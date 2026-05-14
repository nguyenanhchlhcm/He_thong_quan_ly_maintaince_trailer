'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, Plus, Trash2, Save, Wrench, AlertCircle, Warehouse, WifiOff, Fingerprint, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { PhotoUploader } from './PhotoUploader'
import { SinglePhotoUploader } from './SinglePhotoUploader'
import { GPSLocator } from './GPSLocator'
import { calculateDistance } from '@/lib/utils/haversine'
import { useTicketStore } from '@/store/ticketStore'
import { supabase } from '@/lib/supabase/client'
import { uploadBase64Image } from '@/lib/supabase/storage'
import { toast } from 'sonner'

// Types for master data fetched from Supabase
type SkuItem = { id: string; ten_vat_tu: string; don_vi_tinh: string | null; gia_tham_khao: number; loai: string | null }
type GaraItem = { id: string; ten_gara: string; toa_do_lat: number | null; toa_do_lng: number | null }

type TicketFormValues = {
  id_xe: string
  id_gara: string
  so_km_luc_sua: number
  tien_cong: number
  odometer_photo_base64: string | null
  receipt_photo_base64: string | null
  checkin_photos_base64: (string | null)[]
  parts: {
    id_sku: string
    so_luong: number
    don_gia: number
    photos: {
      oldPartBase64: string | null
      newPartBase64: string | null
    }
  }[]
}

export function TicketForm() {
  const isMounted = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isDebugMode, setIsDebugMode] = useState(false)
  const [skuList, setSkuList] = useState<SkuItem[]>([])
  const [garaList, setGaraList] = useState<GaraItem[]>([])
  const [isLoadingMaster, setIsLoadingMaster] = useState(true)
  
  const { draftTicket, saveDraft, clearDraft, addToSyncQueue } = useTicketStore()

  // Fetch master data (SKU + Gara) from Supabase on mount
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [skuRes, garaRes] = await Promise.all([
          supabase.from('danh_muc_vat_tu_sku').select('id, ten_vat_tu, don_vi_tinh, gia_tham_khao, loai'),
          supabase.from('danh_muc_gara').select('id, ten_gara, toa_do_lat, toa_do_lng')
        ])
        setSkuList(skuRes.data || [])
        setGaraList(garaRes.data || [])
      } catch {
        toast.error('Không tải được danh mục')
      } finally {
        setIsLoadingMaster(false)
      }
    }
    fetchMaster()
  }, [])

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<TicketFormValues>({
    defaultValues: {
      id_xe: '',
      id_gara: '',
      so_km_luc_sua: 0,
      tien_cong: 0,
      odometer_photo_base64: null,
      receipt_photo_base64: null,
      checkin_photos_base64: [null, null, null, null],
      parts: [],
    }
  })

  // Restore draft on mount only - FIXED: Use ref to prevent loop
  useEffect(() => {
    if (draftTicket && !isMounted.current) {
      reset({
        id_xe: draftTicket.id_xe,
        id_gara: draftTicket.id_gara,
        so_km_luc_sua: draftTicket.so_km_luc_sua || 0,
        tien_cong: draftTicket.tien_cong,
        odometer_photo_base64: draftTicket.odometer_photo_base64 || null,
        receipt_photo_base64: draftTicket.receipt_photo_base64 || null,
        checkin_photos_base64: draftTicket.checkin_photos_base64 || [null, null, null, null],
        parts: draftTicket.parts,
      })
      isMounted.current = true
    }
  }, [draftTicket, reset])

  // Auto-save draft on changes
  const formValues = watch()
  useEffect(() => {
    const hasData = formValues.id_xe || formValues.parts?.length || formValues.tien_cong > 0
    if (hasData) {
      // Use a timeout or debounce to prevent excessive writes
      const timeout = setTimeout(() => {
        saveDraft({
          ...formValues,
          createdAt: Date.now()
        } as any)
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [formValues, saveDraft])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parts'
  })

  const watchParts = watch('parts') || []
  const watchTienCong = watch('tien_cong')

  // Calculate total dynamically (for UI only, DB Trigger will enforce real total)
  const totalPartsCost = watchParts.reduce((acc, curr) => acc + (curr?.so_luong || 0) * (curr?.don_gia || 0), 0)
  const totalCost = totalPartsCost + (Number(watchTienCong) || 0)

  const onSubmit = async (data: TicketFormValues) => {
    // Validation Rule 2: GPS Verification
    if (!data.id_gara) {
      alert('Vui lòng chọn Gara đang thực hiện sửa chữa.')
      return
    }

    if (!deviceLocation) {
      alert('Chưa xác định được vị trí GPS. Vui lòng cấp quyền truy cập vị trí.')
      return
    }

    const selectedGara = garaList.find(g => g.id === data.id_gara)
    const distance = (selectedGara?.toa_do_lat && selectedGara?.toa_do_lng && deviceLocation)
      ? calculateDistance(deviceLocation.lat, deviceLocation.lng, selectedGara.toa_do_lat, selectedGara.toa_do_lng)
      : 0
    
    const hasGPSWarning = distance > 1 && !isDebugMode

    // Validation Rule 3: Odometer Poka-yoke
    if (!data.so_km_luc_sua || data.so_km_luc_sua <= 0) {
      alert('Vui lòng nhập số Km hiện tại của xe.')
      return
    }

    // Ở thực tế sẽ check với DB, ở đây giả lập check với xe đang chọn (nếu tìm thấy)
    // Giả sử có list xe thật từ useVehicles hook
    // const currentXe = vehicles.find(x => x.id_xe === data.id_xe);
    // if (currentXe && data.so_km_luc_sua < currentXe.so_km_hien_tai) {
    //   alert(`LỖI: Số Km nhập (${data.so_km_luc_sua}) thấp hơn số Km hiện tại của xe (${currentXe.so_km_hien_tai}).`);
    //   return;
    // }

    // Validation Rule 1: Visual Proof
    if (!data.odometer_photo_base64) {
      alert('Vui lòng chụp ảnh đồng hồ ODO (Bắt buộc) để xác minh số Km.')
      return
    }

    if (data.tien_cong > 0 && !data.receipt_photo_base64) {
      alert('Vui lòng chụp ảnh hóa đơn/chứng từ khi có phát sinh chi phí mua ngoài/tiền công thợ ngoài.')
      return
    }

    if (data.parts.length === 0 && data.tien_cong === 0) {
      alert('Vui lòng thêm ít nhất 1 vật tư hoặc khai báo tiền công vào phiếu bảo trì.')
      return
    }

    for (let i = 0; i < data.parts.length; i++) {
      const part = data.parts[i]
      if (!part.photos?.oldPartBase64 || !part.photos?.newPartBase64) {
        alert(`Lỗi: Vật tư dòng thứ ${i + 1} chưa có đủ 2 ảnh (CŨ & MỚI). Đây là yêu cầu bắt buộc!`)
        return
      }
    }

    setIsSubmitting(true)
    
    // Offline flow: queue to IndexedDB
    if (!navigator.onLine) {
      addToSyncQueue({ ...data, createdAt: Date.now() } as any)
      clearDraft()
      toast.info('Đã lưu Phếu vào bộ nhớ tạm. Hệ thống sẽ tự động đồng bộ khi có mạng!')
      setIsSubmitting(false)
      reset()
      return
    }

    // Online flow: upload images + insert to Supabase
    try {
      const ticketRef = `ticket_${Date.now()}`

      // 1. Upload ODO photo (required)
      const odoUrl = await uploadBase64Image(
        't2m-evidence',
        `odometer/${ticketRef}_odo.webp`,
        data.odometer_photo_base64!
      )

      // 2. Upload receipt photo (optional)
      let receiptUrl: string | null = null
      if (data.receipt_photo_base64) {
        receiptUrl = await uploadBase64Image(
          't2m-evidence',
          `receipts/${ticketRef}_receipt.webp`,
          data.receipt_photo_base64
        )
      }

      // 3. Create main ticket record
      const totalVatTu = data.parts.reduce((sum, p) => sum + (p.so_luong * p.don_gia), 0)
      const { data: phieu, error: phieuError } = await supabase
        .from('phieu_bao_tri')
        .insert([{
          id_xe: data.id_xe,
          so_km_luc_sua: data.so_km_luc_sua,
          toa_do_app_lat: deviceLocation?.lat ?? null,
          toa_do_app_lng: deviceLocation?.lng ?? null,
          canh_bao_gps: hasGPSWarning,
          trang_thai_phieu: 'Chờ duyệt',
          tong_vat_tu: totalVatTu,
          tien_cong: data.tien_cong || 0,
          tong_chi_phi: totalVatTu + (data.tien_cong || 0),
        }])
        .select()
        .single()

      if (phieuError) throw phieuError

      // 4. Upload part photos and create detail records
      const chiTietData = await Promise.all(
        data.parts.map(async (part, i) => {
          const [anhCuUrl, anhMoiUrl] = await Promise.all([
            uploadBase64Image('t2m-evidence', `parts/${ticketRef}_part${i}_old.webp`, part.photos.oldPartBase64!),
            uploadBase64Image('t2m-evidence', `parts/${ticketRef}_part${i}_new.webp`, part.photos.newPartBase64!)
          ])
          return {
            id_phieu: phieu.id,
            id_sku: part.id_sku,
            so_luong: part.so_luong,
            don_gia: part.don_gia,
            thanh_tien: part.so_luong * part.don_gia,
            anh_vat_tu_cu_url: anhCuUrl,
            anh_vat_tu_moi_url: anhMoiUrl,
          }
        })
      )

      const { error: ctError } = await supabase
        .from('chi_tiet_vat_tu_su_dung')
        .insert(chiTietData)

      if (ctError) throw ctError

      toast.success('Gửi phiếu bảo trì thành công!')
      clearDraft()
      reset()
    } catch (err: any) {
      toast.error('Lỗi khi gửi phiếu: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectSKU = (index: number, skuId: string) => {
    const sku = skuList.find(s => s.id === skuId)
    if (sku) {
      setValue(`parts.${index}.id_sku`, skuId)
      setValue(`parts.${index}.don_gia`, sku.gia_tham_khao)
      if (!watchParts[index]?.so_luong) {
        setValue(`parts.${index}.so_luong`, 1)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
      {/* Thông tin chung */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Thông tin Phiếu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-amber-500" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-500">CHẾ ĐỘ THỬ NGHIỆM</span>
                <span className="text-[10px] text-slate-500 uppercase">Bỏ qua kiểm tra khoảng cách GPS</span>
              </div>
            </div>
            <Switch 
              checked={isDebugMode} 
              onCheckedChange={setIsDebugMode} 
              className="data-[state=checked]:bg-amber-500"
            />
          </div>

          <div className="space-y-2">
            <Label>Định vị GPS (Anti-Fraud)</Label>
            <GPSLocator 
              onLocationFound={setDeviceLocation} 
              targetLocation={(() => {
                const g = garaList.find(g => g.id === watch('id_gara'))
                return (g?.toa_do_lat && g?.toa_do_lng) ? { lat: g.toa_do_lat, lng: g.toa_do_lng } : null
              })()}
            />
          </div>

          <div className="space-y-2">
            <SinglePhotoUploader 
              title="Ảnh Đồng Hồ ODO" 
              description="Bắt buộc chụp rõ số Km hiện tại" 
              required={true}
              onPhotoChange={(base64) => setValue('odometer_photo_base64', base64)}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-700/50">
            <div>
              <Label>Ảnh Tình Trạng Xe Lúc Giao Nhận (Tùy chọn)</Label>
              <p className="text-xs text-slate-500 mb-2">Chụp 4 góc xe để tránh tranh chấp xước xát sau sửa chữa.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SinglePhotoUploader 
                title="Góc Trái Trước" 
                required={false}
                onPhotoChange={(base64) => {
                  const current = watch('checkin_photos_base64') || [null, null, null, null]
                  current[0] = base64
                  setValue('checkin_photos_base64', current)
                }}
              />
              <SinglePhotoUploader 
                title="Góc Phải Trước" 
                required={false}
                onPhotoChange={(base64) => {
                  const current = watch('checkin_photos_base64') || [null, null, null, null]
                  current[1] = base64
                  setValue('checkin_photos_base64', current)
                }}
              />
              <SinglePhotoUploader 
                title="Góc Trái Sau" 
                required={false}
                onPhotoChange={(base64) => {
                  const current = watch('checkin_photos_base64') || [null, null, null, null]
                  current[2] = base64
                  setValue('checkin_photos_base64', current)
                }}
              />
              <SinglePhotoUploader 
                title="Góc Phải Sau" 
                required={false}
                onPhotoChange={(base64) => {
                  const current = watch('checkin_photos_base64') || [null, null, null, null]
                  current[3] = base64
                  setValue('checkin_photos_base64', current)
                }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-700/50">
            <Label htmlFor="id_gara">Chọn Gara Sửa Chữa</Label>
            <Select onValueChange={(val: any) => setValue('id_gara', val)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 h-12">
                <SelectValue placeholder="Chọn Gara..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {isLoadingMaster ? (
                  <div className="flex items-center gap-2 p-3 text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                  </div>
                ) : garaList.map(gara => (
                  <SelectItem key={gara.id} value={gara.id}>
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-slate-500" />
                      {gara.ten_gara}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_xe">Biển số xe / Mã xe</Label>
            <Input 
              id="id_xe" 
              placeholder="VD: XE-001" 
              className="bg-slate-800/50 border-slate-700 h-12 text-lg uppercase"
              {...register('id_xe', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="so_km_luc_sua">Số Km lúc sửa (Odometer) <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input 
                id="so_km_luc_sua" 
                type="number"
                placeholder="Nhập số Km trên đồng hồ..." 
                className="bg-slate-800/50 border-slate-700 h-12 text-lg font-mono text-primary"
                {...register('so_km_luc_sua', { required: true, valueAsNumber: true })}
                onFocus={(e) => e.target.select()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">KM</div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tien_cong">Tiền công thợ ngoài / Mua ngoài (VNĐ)</Label>
            <Input 
              id="tien_cong" 
              type="number"
              placeholder="0" 
              className="bg-slate-800/50 border-slate-700 h-12 text-lg font-mono text-amber-400"
              {...register('tien_cong', { valueAsNumber: true })}
              onFocus={(e) => e.target.select()}
            />
          </div>
          
          {watchTienCong > 0 && (
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-700/50">
              <SinglePhotoUploader 
                title="Hóa đơn / Chứng từ mua ngoài" 
                description="Bắt buộc khi có phát sinh tiền công/vật tư ngoài" 
                required={true}
                onPhotoChange={(base64) => setValue('receipt_photo_base64', base64)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danh sách vật tư */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-400" />
            Vật tư sử dụng
          </h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => append({ id_sku: '', so_luong: 1, don_gia: 0, photos: { oldPartBase64: null, newPartBase64: null } })}
            className="border-primary/50 text-primary hover:bg-primary/10 gap-1 h-9"
          >
            <Plus className="w-4 h-4" /> Thêm
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-800 rounded-xl text-center text-slate-500">
            Chưa có vật tư nào. Nhấn "Thêm" để chọn.
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="bg-slate-800/30 border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Chọn Vật tư</Label>
                      <Select onValueChange={(val: any) => handleSelectSKU(index, val)}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 h-12">
                          <SelectValue placeholder="Chọn từ danh mục..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          {isLoadingMaster ? (
                            <div className="flex items-center gap-2 p-3 text-slate-500 text-sm">
                              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                            </div>
                          ) : skuList.map(sku => (
                            <SelectItem key={sku.id} value={sku.id} className="py-3">
                              {sku.ten_vat_tu} <span className="text-slate-500 text-xs">({sku.don_vi_tinh})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 mt-6"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Số lượng</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        className="bg-slate-900 border-slate-700 h-12 text-center text-lg"
                        {...register(`parts.${index}.so_luong` as const)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Đơn giá</Label>
                      <Input 
                        type="number" 
                        className="bg-slate-900 border-slate-700 h-12 font-mono text-right text-lg"
                        {...register(`parts.${index}.don_gia` as const, { valueAsNumber: true })}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                  
                  {/* Phase 8 Anti-Fraud hook: Upload ảnh */}
                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <Label className="text-amber-500">Bằng chứng hình ảnh (Bắt buộc)</Label>
                    </div>
                    <PhotoUploader 
                      onPhotosChange={(photos) => {
                        setValue(`parts.${index}.photos`, photos)
                      }}
                    />
                    
                    {(!watchParts[index]?.photos?.oldPartBase64 || !watchParts[index]?.photos?.newPartBase64) && (
                      <p className="text-xs text-red-400 mt-2 text-center">
                        * Vui lòng chụp đủ 2 ảnh Cũ và Mới để nghiệm thu.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-700/50 text-xs text-slate-500 italic flex justify-between">
                    <span>Thành tiền:</span>
                    <span className="font-mono text-slate-300">
                      {((watchParts[index]?.so_luong || 0) * (watchParts[index]?.don_gia || 0)).toLocaleString()} đ
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs text-slate-400">Tổng chi phí dự kiến</p>
            <p className="text-xl font-bold font-mono text-green-400">{totalCost.toLocaleString()} đ</p>
            {draftTicket && <p className="text-[10px] text-amber-500 flex items-center gap-1"><WifiOff className="w-3 h-3"/> Đang có bản nháp chưa lưu</p>}
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="big-button flex-1 premium-gradient text-white border-none"
          >
            <Save className="w-6 h-6" />
            {isSubmitting ? 'Đang lưu...' : 'GỬI PHIẾU BẢO TRÌ'}
          </Button>
        </div>
      </div>
    </form>
  )
}
