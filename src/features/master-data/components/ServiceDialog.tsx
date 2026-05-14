'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { DichVu } from '@/types/database'

interface ServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (id?: string) => void
  initialData?: DichVu | null
}

export function ServiceDialog({ open, onOpenChange, onSuccess, initialData }: ServiceDialogProps) {
  const [tenDichVu, setTenDichVu] = useState('')
  const [donGiaChuan, setDonGiaChuan] = useState('')
  const [slaDuKien, setSlaDuKien] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setTenDichVu(initialData.ten_dich_vu)
      setDonGiaChuan(initialData.don_gia_chuan?.toString() || '0')
      setSlaDuKien(initialData.sla_du_kien || '')
    } else {
      setTenDichVu('')
      setDonGiaChuan('0')
      setSlaDuKien('')
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenDichVu) return toast.error('Vui lòng nhập tên dịch vụ')

    setIsSubmitting(true)

    try {
      const payload = { 
        ten_dich_vu: tenDichVu, 
        don_gia_chuan: donGiaChuan ? parseFloat(donGiaChuan) : 0,
        sla_du_kien: slaDuKien || null
      }

      if (initialData) {
        const { error } = await supabase
          .from('danh_muc_dich_vu')
          .update(payload)
          .eq('id', initialData.id)
        if (error) throw error
        toast.success('Cập nhật dịch vụ thành công!')
      } else {
        const { data: newService, error } = await supabase
          .from('danh_muc_dich_vu')
          .insert([payload])
          .select()
          .single()
        if (error) throw error
        toast.success('Thêm dịch vụ mới thành công!')
        onOpenChange(false)
        onSuccess(newService?.id)
        return
      }

      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error('Error saving service:', error)
      toast.error('Lỗi: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Sửa thông tin dịch vụ' : 'Thêm dịch vụ mới'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Quản lý bảng giá các loại dịch vụ sửa chữa và bảo trì.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="service-name">Tên dịch vụ <span className="text-red-500">*</span></Label>
              <Input
                id="service-name"
                value={tenDichVu}
                onChange={(e) => setTenDichVu(e.target.value)}
                placeholder="VD: Vá vỏ lưu động"
                className="bg-slate-800 border-slate-700 focus:ring-primary"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Đơn giá chuẩn (VNĐ)</Label>
              <Input
                id="price"
                type="number"
                value={donGiaChuan}
                onChange={(e) => setDonGiaChuan(e.target.value)}
                placeholder="VD: 500000"
                className="bg-slate-800 border-slate-700 focus:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sla">SLA dự kiến (Thời gian xử lý)</Label>
              <Input
                id="sla"
                value={slaDuKien}
                onChange={(e) => setSlaDuKien(e.target.value)}
                placeholder="VD: 30 phút, 2 giờ..."
                className="bg-slate-800 border-slate-700 focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-slate-400"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
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
