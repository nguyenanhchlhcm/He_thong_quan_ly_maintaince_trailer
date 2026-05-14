'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Truck } from 'lucide-react'
import { NhaCungCap } from '@/types/database'

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: NhaCungCap | null
}

export function SupplierDialog({ open, onOpenChange, onSuccess, initialData }: SupplierDialogProps) {
  const [name, setName] = useState('')
  const [group, setGroup] = useState('')
  const [contact, setContact] = useState('')
  const [rating, setRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.ten_ncc)
      setGroup(initialData.nhom_cung_cap || '')
      setContact(initialData.lien_he || '')
      setRating(initialData.rating)
    } else {
      setName('')
      setGroup('')
      setContact('')
      setRating(5)
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return toast.error('Vui lòng nhập tên nhà cung cấp')

    setIsSubmitting(true)

    try {
      const payload = { 
        ten_ncc: name, 
        nhom_cung_cap: group || null,
        lien_he: contact || null,
        rating: rating
      }

      if (initialData) {
        const { error } = await supabase
          .from('danh_muc_nha_cung_cap')
          .update(payload)
          .eq('id', initialData.id)
        if (error) throw error
        toast.success('Cập nhật nhà cung cấp thành công!')
      } else {
        const { error } = await supabase
          .from('danh_muc_nha_cung_cap')
          .insert([payload])
        if (error) throw error
        toast.success('Thêm nhà cung cấp mới thành công!')
      }

      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error('Error saving supplier:', error)
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
            <DialogTitle>{initialData ? 'Sửa thông tin nhà cung cấp' : 'Thêm nhà cung cấp mới'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Các đơn vị cung cấp phụ tùng, vật tư và dịch vụ ngoài.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="supplier-name">Tên nhà cung cấp <span className="text-red-500">*</span></Label>
              <Input
                id="supplier-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Phụ tùng ô tô Thành Phát"
                className="bg-slate-800 border-slate-700"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group">Nhóm cung cấp / Ngành hàng</Label>
              <Input
                id="group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="VD: Lốp xe, Nhớt, Phụ tùng máy..."
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Liên hệ (SĐT / Người phụ trách)</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="VD: 0912... (Anh Nam)"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="rating">Đánh giá độ uy tín (1-10)</Label>
                <span className="text-amber-500 font-mono font-bold">{rating}/10</span>
              </div>
              <Input
                id="rating"
                type="range"
                min="1"
                max="10"
                step="1"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="accent-primary"
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
