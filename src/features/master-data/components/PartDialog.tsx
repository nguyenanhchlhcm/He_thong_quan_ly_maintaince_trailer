'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { VatTuSKU } from '@/types/database'

interface PartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (id?: string) => void
  initialData?: VatTuSKU | null
}

export function PartDialog({ open, onOpenChange, onSuccess, initialData }: PartDialogProps) {
  const [tenVatTu, setTenVatTu] = useState('')
  const [donViTinh, setDonViTinh] = useState<'Cái' | 'Bộ' | 'Can' | 'Lít' | 'Gói'>('Cái')
  const [giaThamKhao, setGiaThamKhao] = useState('')
  const [nhomVatTu, setNhomVatTu] = useState<'Động cơ' | 'Gầm' | 'Điện' | 'Lốp' | 'Máy lạnh'>('Động cơ')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setTenVatTu(initialData.ten_vat_tu)
      setDonViTinh(initialData.don_vi_tinh || 'Cái')
      setGiaThamKhao(initialData.gia_tham_khao?.toString() || '0')
      setNhomVatTu(initialData.nhom_vat_tu || 'Động cơ')
    } else {
      setTenVatTu('')
      setDonViTinh('Cái')
      setGiaThamKhao('0')
      setNhomVatTu('Động cơ')
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenVatTu) return toast.error('Vui lòng nhập tên vật tư')

    setIsSubmitting(true)

    try {
      const payload = { 
        ten_vat_tu: tenVatTu, 
        don_vi_tinh: donViTinh, 
        gia_tham_khao: giaThamKhao ? parseFloat(giaThamKhao) : 0,
        nhom_vat_tu: nhomVatTu
      }

      if (initialData) {
        const { error } = await supabase
          .from('danh_muc_vat_tu_sku')
          .update(payload)
          .eq('id', initialData.id)
        if (error) throw error
        toast.success('Cập nhật vật tư thành công!')
      } else {
        const { data: newSku, error } = await supabase
          .from('danh_muc_vat_tu_sku')
          .insert([payload])
          .select()
          .single()
        if (error) throw error
        toast.success('Thêm vật tư mới thành công!')
        onOpenChange(false)
        onSuccess(newSku?.id)
        return
      }

      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error('Error saving part:', error)
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
            <DialogTitle>{initialData ? 'Sửa thông tin vật tư' : 'Thêm vật tư / SKU mới'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Thiết lập danh mục phụ tùng và đơn giá định mức.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nhóm vật tư</Label>
              <Select value={nhomVatTu} onValueChange={(val: any) => setNhomVatTu(val)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Chọn nhóm..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="Động cơ">⚙️ Động cơ</SelectItem>
                  <SelectItem value="Gầm">🏗️ Gầm</SelectItem>
                  <SelectItem value="Điện">⚡ Điện</SelectItem>
                  <SelectItem value="Lốp">🛞 Lốp</SelectItem>
                  <SelectItem value="Máy lạnh">❄️ Máy lạnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="part-name">Tên vật tư <span className="text-red-500">*</span></Label>
              <Input
                id="part-name"
                value={tenVatTu}
                onChange={(e) => setTenVatTu(e.target.value)}
                placeholder="VD: Nhớt Castrol 20L"
                className="bg-slate-800 border-slate-700 focus:ring-primary"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Đơn vị tính</Label>
              <Select value={donViTinh} onValueChange={(val: any) => setDonViTinh(val)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Chọn đơn vị..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="Cái">Cái</SelectItem>
                  <SelectItem value="Bộ">Bộ</SelectItem>
                  <SelectItem value="Can">Can</SelectItem>
                  <SelectItem value="Lít">Lít</SelectItem>
                  <SelectItem value="Gói">Gói</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Giá nhập tham khảo (VNĐ)</Label>
              <Input
                id="price"
                type="number"
                value={giaThamKhao}
                onChange={(e) => setGiaThamKhao(e.target.value)}
                placeholder="VD: 1500000"
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
