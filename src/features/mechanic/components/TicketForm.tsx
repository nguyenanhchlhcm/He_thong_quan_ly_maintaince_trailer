'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, Plus, Trash2, Save, Wrench, AlertCircle, Warehouse, WifiOff, Fingerprint } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { PhotoUploader } from './PhotoUploader'
import { SinglePhotoUploader } from './SinglePhotoUploader'
import { GPSLocator } from './GPSLocator'
import { calculateDistance } from '@/lib/utils/haversine'
import { useTicketStore } from '@/store/ticketStore'
import { useEffect } from 'react'

// Giả lập danh sách vật tư để chọn
const MOCK_SKUS = [
  { id: '1', name: 'Nhớt động cơ Castrol 20L', unit: 'Can', price: 1500000 },
  { id: '2', name: 'Lốp xe Michelin 11R22.5', unit: 'Cái', price: 6500000 },
  { id: '3', name: 'Bố thắng sau', unit: 'Bộ', price: 850000 },
]

const MOCK_GARAGES = [
  { id: '1', name: 'Gara T2M - Quận 9', lat: 10.844, lng: 106.791 },
  { id: '2', name: 'Gara Hợp Tác - Bình Dương', lat: 10.921, lng: 106.711 },
]

type TicketFormValues = {
  id_xe: string
  id_gara: string
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isDebugMode, setIsDebugMode] = useState(false)
  
  const { draftTicket, saveDraft, clearDraft, addToSyncQueue } = useTicketStore()

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<TicketFormValues>({
    defaultValues: {
      id_xe: '',
      id_gara: '',
      tien_cong: 0,
      odometer_photo_base64: null,
      receipt_photo_base64: null,
      checkin_photos_base64: [null, null, null, null],
      parts: [],
    }
  })

  // Restore draft on mount
  useEffect(() => {
    if (draftTicket) {
      reset({
        id_xe: draftTicket.id_xe,
        id_gara: draftTicket.id_gara,
        tien_cong: draftTicket.tien_cong,
        odometer_photo_base64: draftTicket.odometer_photo_base64 || null,
        receipt_photo_base64: draftTicket.receipt_photo_base64 || null,
        checkin_photos_base64: draftTicket.checkin_photos_base64 || [null, null, null, null],
        parts: draftTicket.parts,
      })
    }
  }, [draftTicket, reset])

  // Auto-save draft on changes (Debouncing would be better in prod)
  const formValues = watch()
  useEffect(() => {
    if (formValues.id_xe || formValues.parts?.length) {
      saveDraft({
        ...formValues,
        createdAt: Date.now()
      } as any)
    }
  }, [formValues, saveDraft])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parts'
  })

  const watchParts = watch('parts')
  const watchTienCong = watch('tien_cong')

  // Calculate total dynamically (for UI only, DB Trigger will enforce real total)
  const totalPartsCost = watchParts.reduce((acc, curr) => acc + (curr.so_luong || 0) * (curr.don_gia || 0), 0)
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

    const selectedGara = MOCK_GARAGES.find(g => g.id === data.id_gara)
    if (selectedGara && !isDebugMode) {
      const distance = calculateDistance(deviceLocation.lat, deviceLocation.lng, selectedGara.lat, selectedGara.lng)
      console.log(`Khoảng cách đến Gara: ${distance.toFixed(2)} km`)
      
      if (distance > 1) { // Lệch quá 1km
        alert(`CẢNH BÁO: Bạn đang ở cách xa Gara ${distance.toFixed(2)}km. Phiếu sẽ bị gắn cờ gian lận (GPS Warning)!`)
        // Ở thực tế, mình vẫn cho submit nhưng gắn flag canh_bao_gps = true
      }
    } else if (isDebugMode) {
      console.log('Skipping GPS verification in Debug Mode.')
    }

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
    
    // Check network status
    if (!navigator.onLine) {
      // Offline Flow
      console.log('User is offline, adding to sync queue...')
      addToSyncQueue({ ...data, createdAt: Date.now() } as any)
      clearDraft()
      alert('Đã lưu Phiếu vào bộ nhớ tạm. Hệ thống sẽ tự động đồng bộ khi có mạng!')
      setIsSubmitting(false)
      reset()
      return
    }

    // Online Flow (Mock)
    console.log('Submitting ticket online...', data)
    setTimeout(() => {
      setIsSubmitting(false)
      clearDraft()
      reset()
      alert('Tạo phiếu thành công! (Đã nén và upload ảnh giả lập)')
    }, 1500)
  }

  const handleSelectSKU = (index: number, skuId: string) => {
    const sku = MOCK_SKUS.find(s => s.id === skuId)
    if (sku) {
      setValue(`parts.${index}.id_sku`, skuId)
      setValue(`parts.${index}.don_gia`, sku.price)
      if (!watchParts[index].so_luong) {
        setValue(`parts.${index}.so_luong`, 1)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
      {/* Thông tin chung */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
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
            <GPSLocator onLocationFound={setDeviceLocation} />
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
                {MOCK_GARAGES.map(gara => (
                  <SelectItem key={gara.id} value={gara.id}>
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-slate-500" />
                      {gara.name}
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
              placeholder="VD: 51C-123.45" 
              className="bg-slate-800/50 border-slate-700 h-12 text-lg uppercase"
              {...register('id_xe', { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tien_cong">Tiền công thợ ngoài / Mua ngoài (VNĐ)</Label>
            <Input 
              id="tien_cong" 
              type="number"
              placeholder="0" 
              className="bg-slate-800/50 border-slate-700 h-12 text-lg font-mono text-amber-400"
              {...register('tien_cong', { valueAsNumber: true })}
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
                          {MOCK_SKUS.map(sku => (
                            <SelectItem key={sku.id} value={sku.id} className="py-3">
                              {sku.name} <span className="text-slate-500 text-xs">({sku.unit})</span>
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
                        {...register(`parts.${index}.don_gia` as const)}
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
            size="lg" 
            disabled={isSubmitting}
            className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 gap-2 font-semibold"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Đang lưu...' : 'Lưu Phiếu'}
          </Button>
        </div>
      </div>
    </form>
  )
}
