'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import { QuanLyVoXe } from '@/types/database'
import { SinglePhotoUploader } from '@/features/maintenance/components/mechanic/SinglePhotoUploader'
import { uploadBase64Image } from '@/lib/supabase/storage'

interface TireDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: QuanLyVoXe | null
}

export function TireDialog({ open, onOpenChange, onSuccess, initialData }: TireDialogProps) {
  const [idVo, setIdVo] = useState('')
  const [tinhTrangGai, setTinhTrangGai] = useState('')
  const [trangThai, setTrangThai] = useState('Đang chạy')
  const [dotCode, setDotCode] = useState('')
  const [serialPhoto, setSerialPhoto] = useState<string | null>(null)
  const [treadPhoto, setTreadPhoto] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setIdVo(initialData.id_vo)
      setTinhTrangGai(initialData.tinh_trang_gai?.toString() || '')
      setTrangThai(initialData.trang_thai_vo || 'Đang chạy')
      setDotCode(initialData.dot_code || '')
      setSerialPhoto(initialData.serial_photo_url || null)
      setTreadPhoto(initialData.tread_condition_photo_url || null)
    } else {
      setIdVo('')
      setTinhTrangGai('')
      setTrangThai('Đang chạy')
      setDotCode('')
      setSerialPhoto(null)
      setTreadPhoto(null)
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idVo) return toast.error('Vui lòng nhập Serial Number của lốp')

    setIsSubmitting(true)

    try {
      // 1. Validate Scrap Evidence
      const needsEvidence = trangThai === 'Thanh lý' || trangThai === 'Chờ đắp'
      if (needsEvidence) {
        if (!serialPhoto || !treadPhoto) {
          throw new Error('Vui lòng cung cấp đủ hình ảnh Serial và tình trạng gai lốp để làm bằng chứng.')
        }
      }

      // 2. Upload Images if they are base64 (newly captured)
      let finalSerialUrl = serialPhoto
      let finalTreadUrl = treadPhoto

      if (serialPhoto?.startsWith('data:image')) {
        const path = `tires/${idVo}_serial_${Date.now()}.webp`
        finalSerialUrl = await uploadBase64Image('t2m-evidence', path, serialPhoto)
      }
      if (treadPhoto?.startsWith('data:image')) {
        const path = `tires/${idVo}_tread_${Date.now()}.webp`
        finalTreadUrl = await uploadBase64Image('t2m-evidence', path, treadPhoto)
      }

      const payload = { 
        id_vo: idVo, 
        tinh_trang_gai: tinhTrangGai ? parseFloat(tinhTrangGai) : 0,
        trang_thai_vo: trangThai,
        dot_code: dotCode.trim() || null,
        serial_photo_url: finalSerialUrl,
        tread_condition_photo_url: finalTreadUrl
      }

      if (initialData) {
        const { error } = await supabase
          .from('quan_ly_vo_xe')
          .update(payload)
          .eq('id_vo', initialData.id_vo)
        if (error) throw error
        toast.success('Cập nhật thông tin lốp thành công!')
      } else {
        const { error } = await supabase
          .from('quan_ly_vo_xe')
          .insert([payload])
        if (error) throw error
        toast.success('Nhập kho lốp mới thành công!')
      }

      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error('Error saving tire:', error)
      toast.error('Lỗi: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[500px] max-h-[90vh] p-0 flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Header — cố định */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800 shrink-0">
            <DialogTitle>{initialData ? 'Sửa thông tin lốp' : 'Nhập kho lốp mới'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Quản lý Serial Number và tình trạng kỹ thuật của lốp.
            </DialogDescription>
          </DialogHeader>

          {/* Body — cuộn được */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="id-vo">Serial Number (ID Lốp) <span className="text-red-500">*</span></Label>
              <Input
                id="id-vo"
                value={idVo}
                onChange={(e) => setIdVo(e.target.value)}
                placeholder="VD: SN-MICHELIN-001"
                className="bg-slate-800 border-slate-700 focus:ring-primary"
                required
                disabled={!!initialData}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gai">Độ sâu gai (mm)</Label>
                <Input
                  id="gai"
                  type="number"
                  step="0.1"
                  value={tinhTrangGai}
                  onChange={(e) => setTinhTrangGai(e.target.value)}
                  placeholder="VD: 14.5"
                  className="bg-slate-800 border-slate-700 focus:ring-primary"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dot-code">
                  Mã DOT
                  <span className="ml-1 text-xs text-slate-500 font-normal">— 4 số</span>
                </Label>
                <Input
                  id="dot-code"
                  value={dotCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setDotCode(v)
                  }}
                  placeholder="VD: 3125"
                  maxLength={4}
                  className="bg-slate-800 border-slate-700 focus:ring-primary font-mono tracking-widest"
                />
                {dotCode.length === 4 && (
                  <p className="text-xs text-cyan-400">
                    📅 Tuần <strong>{dotCode.slice(0, 2)}</strong> / Năm <strong>20{dotCode.slice(2)}</strong>
                  </p>
                )}
                {dotCode.length > 0 && dotCode.length < 4 && (
                  <p className="text-xs text-amber-400">Nhập đủ 4 chữ số</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Trạng thái lốp</Label>
              <Select value={trangThai} onValueChange={(val: any) => setTrangThai(val)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="Đang chạy">🟢 Đang chạy</SelectItem>
                  <SelectItem value="Chờ đắp">🟡 Chờ đắp</SelectItem>
                  <SelectItem value="Thanh lý">🔴 Thanh lý</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── EDIT MODE: luôn hiện ảnh đã lưu, cho phép chụp lại ── */}
            {initialData ? (
              <div className="grid gap-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-300">📷 Ảnh lốp</span>
                  <span className="text-xs text-slate-500">Nhấn vào ảnh để chụp lại</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SinglePhotoUploader
                    key={`serial-${initialData.id_vo}-${open}`}
                    title="Serial Number"
                    description="Chụp rõ số Serial"
                    required={trangThai === 'Thanh lý' || trangThai === 'Chờ đắp'}
                    onPhotoChange={setSerialPhoto}
                    initialUrl={initialData.serial_photo_url || undefined}
                    icon={<Camera className="w-5 h-5" />}
                  />
                  <SinglePhotoUploader
                    key={`tread-${initialData.id_vo}-${open}`}
                    title="Tình trạng Gai/Rách"
                    description="Chụp rõ mặt lốp"
                    required={trangThai === 'Thanh lý' || trangThai === 'Chờ đắp'}
                    onPhotoChange={setTreadPhoto}
                    initialUrl={initialData.tread_condition_photo_url || undefined}
                    icon={<Camera className="w-5 h-5" />}
                  />
                </div>
                {(trangThai === 'Thanh lý' || trangThai === 'Chờ đắp') && (
                  <p className="text-xs text-amber-500">
                    🛡️ Bằng chứng bắt buộc — cần có đủ 2 ảnh để lưu trạng thái này.
                  </p>
                )}
              </div>
            ) : (
              /* ── CREATE MODE: chỉ hiện khi cần bằng chứng ── */
              (trangThai === 'Thanh lý' || trangThai === 'Chờ đắp') && (
                <div className="grid gap-4 pt-4 border-t border-slate-800">
                  <div className="text-sm font-semibold text-amber-500">
                    🛡️ Bằng chứng bắt buộc (Anti-Fraud)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <SinglePhotoUploader
                      title="Serial Number"
                      description="Chụp rõ số Serial"
                      required={true}
                      onPhotoChange={setSerialPhoto}
                      icon={<Camera className="w-5 h-5" />}
                    />
                    <SinglePhotoUploader
                      title="Tình trạng Gai/Rách"
                      description="Chụp rõ mặt lốp"
                      required={true}
                      onPhotoChange={setTreadPhoto}
                      icon={<Camera className="w-5 h-5" />}
                    />
                  </div>
                </div>
              )
            )}
          </div>

          {/* Footer — cố định đáy */}
          <DialogFooter className="px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900/80 backdrop-blur-sm">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-400"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thông tin'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
