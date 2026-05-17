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

import { useRouter } from 'next/navigation'

// Types for master data fetched from Supabase
type SkuItem = { id: string; ten_vat_tu: string; don_vi_tinh: string | null; gia_tham_khao: number; loai: string | null }
type GaraItem = { id: string; ten_gara: string; toa_do_lat: number | null; toa_do_lng: number | null }
type VehicleItem = { id: string; bien_so: string; loai_xe: string | null }

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

export function TicketForm({ ticketId }: { ticketId?: string }) {
  const router = useRouter()
  const isMounted = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isDebugMode, setIsDebugMode] = useState(false)
  const [skuList, setSkuList] = useState<SkuItem[]>([])
  const [garaList, setGaraList] = useState<GaraItem[]>([])
  const [vehicleList, setVehicleList] = useState<VehicleItem[]>([])
  const [isLoadingMaster, setIsLoadingMaster] = useState(true)
  const [isLoadingTicket, setIsLoadingTicket] = useState(false)
  const [existingUrls, setExistingUrls] = useState<{
    odo: string | null;
    receipt: string | null;
    parts: { old: string | null; new: string | null }[];
  }>({ odo: null, receipt: null, parts: [] })
  const [showDraftAlert, setShowDraftAlert] = useState(false)
  
  const { draftTicket, saveDraft, clearDraft, addToSyncQueue } = useTicketStore()

  // Fetch master data (SKU + Gara) from Supabase on mount
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [skuRes, garaRes, vehicleRes] = await Promise.all([
          supabase.from('skus').select('id, ten_vat_tu:name, don_vi_tinh:unit, gia_tham_khao:price, loai'),
          supabase.from('garages').select('id, ten_gara:name, toa_do_lat:lat, toa_do_lng:lng'),
          supabase.from('vehicles').select('id, bien_so:id, loai_xe:model')
        ])
        setSkuList(skuRes.data || [])
        setGaraList(garaRes.data || [])
        setVehicleList((vehicleRes.data || []) as VehicleItem[])
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

  // Fetch existing ticket details for editing
  useEffect(() => {
    if (!ticketId) return
    const fetchTicketData = async () => {
      setIsLoadingTicket(true)
      try {
        // 1. Fetch ticket
        const { data: ticket, error: ticketError } = await supabase
          .from('phieu_bao_tri')
          .select('*')
          .eq('id', ticketId)
          .single()
        if (ticketError) throw ticketError

        // 2. Fetch details (parts)
        const { data: parts, error: partsError } = await supabase
          .from('chi_tiet_vat_tu_su_dung')
          .select('*')
          .eq('id_phieu', ticketId)
        if (partsError) throw partsError

        // Store existing URLs
        setExistingUrls({
          odo: ticket.odometer_photo_url,
          receipt: ticket.receipt_photo_url,
          parts: parts.map(p => ({
            old: p.anh_vat_tu_cu_url,
            new: p.anh_vat_tu_moi_url
          }))
        })

        // Populate fields
        reset({
          id_xe: ticket.id_xe || '',
          id_gara: ticket.id_gara || '',
          so_km_luc_sua: ticket.so_km_luc_sua || 0,
          tien_cong: ticket.tien_cong || 0,
          odometer_photo_base64: null,
          receipt_photo_base64: null,
          checkin_photos_base64: [null, null, null, null], // We can assume checkin photos are skipped or handled in bucket
          parts: parts.map(p => ({
            id_sku: p.id_sku,
            so_luong: p.so_luong,
            don_gia: p.don_gia,
            photos: {
              oldPartBase64: null,
              newPartBase64: null
            }
          }))
        })
        isMounted.current = true
      } catch (error: any) {
        toast.error('Lỗi tải thông tin phiếu bảo trì: ' + error.message)
      } finally {
        setIsLoadingTicket(false)
      }
    }
    fetchTicketData()
  }, [ticketId, reset])

  // Check for draft on mount (Only if creating new ticket)
  useEffect(() => {
    if (draftTicket && !ticketId && !isMounted.current) {
      setShowDraftAlert(true)
      isMounted.current = true
    }
  }, [draftTicket, ticketId])

  // Auto-save draft on changes (Only if NOT in edit mode)
  const formValues = watch()
  useEffect(() => {
    if (ticketId) return
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
  }, [formValues, saveDraft, ticketId])

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
    // Check if vehicle is selected
    if (!data.id_xe) {
      alert('Vui lòng chọn xe.')
      return
    }

    // GPS Verification (TEMPORARILY BYPASSED FOR TESTING)
    const hasGPSWarning = false

    setIsSubmitting(true)
    
    // Offline flow: queue to IndexedDB (Only for new tickets, editing requires online connection)
    if (!navigator.onLine) {
      if (ticketId) {
        toast.error('Lỗi: Bạn phải có kết nối mạng để chỉnh sửa phiếu bảo trì.')
        setIsSubmitting(false)
        return
      }
      addToSyncQueue({ ...data, createdAt: Date.now() } as any)
      clearDraft()
      toast.info('Đã lưu Phiếu vào bộ nhớ tạm. Hệ thống sẽ tự động đồng bộ khi có mạng!')
      setIsSubmitting(false)
      reset()
      return
    }

    // Online flow: upload images + insert/update to Supabase
    try {
      const ticketRef = `ticket_${Date.now()}`

      // 1. Upload ODO photo (required if new base64 provided)
      let odoUrl = existingUrls.odo
      if (data.odometer_photo_base64) {
        odoUrl = await uploadBase64Image(
          't2m-evidence',
          `odometer/${ticketRef}_odo.webp`,
          data.odometer_photo_base64
        )
      }

      // 2. Upload receipt photo (optional)
      let receiptUrl = existingUrls.receipt
      if (data.receipt_photo_base64) {
        receiptUrl = await uploadBase64Image(
          't2m-evidence',
          `receipts/${ticketRef}_receipt.webp`,
          data.receipt_photo_base64
        )
      } else if (data.tien_cong === 0) {
        receiptUrl = null
      }

      const totalVatTu = data.parts.reduce((sum, p) => sum + (p.so_luong * p.don_gia), 0)
      let activeTicketId = ticketId
      let insertedPhieu: any = null

      if (ticketId) {
        // Edit flow: Update main ticket
        const { error: phieuError } = await supabase
          .from('phieu_bao_tri')
          .update({
            id_xe: data.id_xe,
            id_gara: data.id_gara,
            toa_do_app_lat: null,
            toa_do_app_lng: null,
            canh_bao_gps: false,
            trang_thai_phieu: 'Chờ duyệt', // Trả về Chờ duyệt để Quản lý duyệt lại
            tong_vat_tu: totalVatTu,
            tien_cong: data.tien_cong || 0,
            tong_chi_phi: totalVatTu + (data.tien_cong || 0),
            odometer_photo_url: odoUrl,
            receipt_photo_url: receiptUrl
          })
          .eq('id', ticketId)

        if (phieuError) throw phieuError
      } else {
        // New flow: Create main ticket record
        const { data: phieuData, error: phieuError } = await supabase
          .from('phieu_bao_tri')
          .insert([{
            id_xe: data.id_xe,
            id_gara: data.id_gara,
            toa_do_app_lat: null,
            toa_do_app_lng: null,
            canh_bao_gps: false,
            trang_thai_phieu: 'Chờ duyệt',
            tong_vat_tu: totalVatTu,
            tien_cong: data.tien_cong || 0,
            tong_chi_phi: totalVatTu + (data.tien_cong || 0),
            odometer_photo_url: odoUrl,
            receipt_photo_url: receiptUrl
          }])
          .select()
          .single()

        if (phieuError) throw phieuError
        insertedPhieu = phieuData
        activeTicketId = phieuData.id
      }

      // 4. Upload part photos and create detail records
      const chiTietData = await Promise.all(
        data.parts.map(async (part, i) => {
          let oldUrl = existingUrls.parts[i]?.old || null
          let newUrl = existingUrls.parts[i]?.new || null

          if (part.photos?.oldPartBase64) {
            oldUrl = await uploadBase64Image('t2m-evidence', `parts/${ticketRef}_part${i}_old.webp`, part.photos.oldPartBase64)
          }
          if (part.photos?.newPartBase64) {
            newUrl = await uploadBase64Image('t2m-evidence', `parts/${ticketRef}_part${i}_new.webp`, part.photos.newPartBase64)
          }

          return {
            id_phieu: activeTicketId,
            id_sku: part.id_sku,
            so_luong: part.so_luong,
            don_gia: part.don_gia,
            thanh_tien: part.so_luong * part.don_gia,
            anh_vat_tu_cu_url: oldUrl || "",
            anh_vat_tu_moi_url: newUrl || "",
          }
        })
      )

      if (ticketId) {
        // Delete previous detail records first
        const { error: delError } = await supabase
          .from('chi_tiet_vat_tu_su_dung')
          .delete()
          .eq('id_phieu', ticketId)
        if (delError) throw delError
      }

      const { error: ctError } = await supabase
        .from('chi_tiet_vat_tu_su_dung')
        .insert(chiTietData)

      if (ctError) throw ctError

      toast.success(ticketId ? 'Cập nhật phiếu bảo trì thành công!' : 'Gửi phiếu bảo trì thành công!')
      
      // Trigger Telegram notification in the background
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const mechanicName = user?.user_metadata?.full_name || user?.email || 'Thợ máy CHL'
        const vehiclePlate = vehicleList.find(v => v.id === data.id_xe)?.bien_so || data.id_xe
        
        let ticketCode = ticketId ? '' : (insertedPhieu?.ma_phieu || '')
        if (ticketId) {
          const { data: updatedPhieu } = await supabase.from('phieu_bao_tri').select('ma_phieu').eq('id', ticketId).single()
          ticketCode = updatedPhieu?.ma_phieu || ''
        }

        fetch('/api/telegram-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_ticket',
            ticket: {
              ma_phieu: ticketCode || 'N/A',
              bien_so: vehiclePlate,
              loai_phieu: ticketId ? 'Cập nhật phiếu sửa chữa' : 'Phiếu bảo trì sửa chữa',
              tho_may: mechanicName,
              ngay_tiep_nhan: new Date().toLocaleDateString('vi-VN'),
              tong_chi_phi: totalVatTu + (data.tien_cong || 0)
            }
          })
        }).catch(err => console.error('Telegram notification error:', err))
      } catch (tgErr) {
        console.error('Failed to dispatch Telegram notification:', tgErr)
      }

      if (!ticketId) {
        clearDraft()
      }
      reset()
      const isCustomAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
      router.push(isCustomAdmin ? '/admin/tickets' : '/mechanic/tickets')
    } catch (error: any) {
      toast.error('Lỗi khi lưu phiếu: ' + error.message)
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
      {/* Draft recovery prompt */}
      {showDraftAlert && draftTicket && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 text-amber-500 text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold">Phát hiện Bản nháp chưa gửi!</p>
              <p className="text-xs text-slate-400">Hệ thống đã lưu lại tiến trình viết dở trước đó của bạn.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="h-8 border-slate-700 hover:bg-slate-800 text-xs text-slate-300 cursor-pointer"
              onClick={() => {
                clearDraft()
                setShowDraftAlert(false)
                toast.info('Đã xóa bản nháp.')
              }}
            >
              Xóa nháp
            </Button>
            <Button 
              type="button" 
              size="sm" 
              className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer border-0"
              onClick={() => {
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
                setShowDraftAlert(false)
                toast.success('Khôi phục bản nháp thành công!')
              }}
            >
              Khôi phục
            </Button>
          </div>
        </div>
      )}

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
              title="Ảnh Đồng Hồ ODO (Tùy chọn)" 
              description="Không bắt buộc - Có thể chụp số Km hiện tại" 
              required={false}
              initialUrl={existingUrls.odo}
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
            <Select value={watch('id_gara')} onValueChange={(val: any) => setValue('id_gara', val)}>
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
            <Label htmlFor="id_xe">Biển số xe / Mã xe <span className="text-red-500">*</span></Label>
            <Select value={watch('id_xe')} onValueChange={(val: any) => setValue('id_xe', val)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 h-12 text-lg uppercase">
                <SelectValue placeholder="Chọn xe..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {isLoadingMaster ? (
                  <div className="flex items-center gap-2 p-3 text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                  </div>
                ) : vehicleList.map(xe => (
                  <SelectItem key={xe.id} value={xe.id}>
                    <div className="flex flex-col">
                      <span className="font-bold">{xe.bien_so}</span>
                      <span className="text-[10px] text-slate-500">{xe.loai_xe}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="so_km_luc_sua">Số Km lúc sửa (Odometer)</Label>
            <div className="relative">
              <Input 
                id="so_km_luc_sua" 
                type="number"
                placeholder="Nhập số Km trên đồng hồ..." 
                className="bg-slate-800/50 border-slate-700 h-12 text-lg font-mono text-primary"
                {...register('so_km_luc_sua', { required: false, valueAsNumber: true })}
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
                title="Hóa đơn / Chứng từ mua ngoài (Tùy chọn)" 
                description="Không bắt buộc" 
                required={false}
                initialUrl={existingUrls.receipt}
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
                      <AlertCircle className="w-4 h-4 text-slate-500" />
                      <Label className="text-slate-400">Bằng chứng hình ảnh (Tùy chọn)</Label>
                    </div>
                    <PhotoUploader 
                      initialOldUrl={existingUrls.parts[index]?.old}
                      initialNewUrl={existingUrls.parts[index]?.new}
                      onPhotosChange={(photos) => {
                        setValue(`parts.${index}.photos`, photos)
                      }}
                    />
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
            {draftTicket && !ticketId && <p className="text-[10px] text-amber-500 flex items-center gap-1"><WifiOff className="w-3 h-3"/> Đang có bản nháp chưa lưu</p>}
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="big-button flex-1 premium-gradient text-white border-none"
          >
            <Save className="w-6 h-6" />
            {isSubmitting ? 'Đang lưu...' : ticketId ? 'CẬP NHẬT PHIẾU' : 'GỬI PHIẾU BẢO TRÌ'}
          </Button>
        </div>
      </div>
    </form>
  )
}
