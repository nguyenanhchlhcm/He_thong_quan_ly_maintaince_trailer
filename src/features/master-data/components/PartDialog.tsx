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
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [loai, setLoai] = useState<'Vật tư' | 'Dịch vụ'>('Vật tư')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setUnit(initialData.unit || '')
      setPrice(initialData.price?.toString() || '')
      setLoai(initialData.loai || 'Vật tư')
    } else {
      setName('')
      setUnit('')
      setPrice('')
      setLoai('Vật tư')
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return toast.error('Vui lòng nhập tên vật tư/dịch vụ')

    setIsSubmitting(true)

    try {
      const payload = { 
        name, 
        unit: unit || null, 
        price: price ? parseFloat(price) : 0,
        loai
      }

      if (initialData) {
        const { error } = await supabase
          .from('skus')
          .update(payload)
          .eq('id', initialData.id)
        if (error) throw error
        toast.success('Cập nhật vật tư thành công!')
      } else {
        const { data: newSku, error } = await supabase
          .from('skus')
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
              <Label>Loại hạng mục</Label>
              <Select value={loai} onValueChange={(val: any) => setLoai(val)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Chọn loại..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="Vật tư">📦 Vật tư (Phụ tùng)</SelectItem>
                  <SelectItem value="Dịch vụ">🛠️ Dịch vụ (Tiền công)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="part-name">Tên {loai.toLowerCase()} <span className="text-red-500">*</span></Label>
              <Input
                id="part-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={loai === 'Vật tư' ? "VD: Nhớt Castrol 20L" : "VD: Công thay nhớt / Vá vỏ"}
                className="bg-slate-800 border-slate-700 focus:ring-primary"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Đơn vị tính</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="VD: Can, Cái, Bộ..."
                className="bg-slate-800 border-slate-700 focus:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Đơn giá định mức (VNĐ)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
