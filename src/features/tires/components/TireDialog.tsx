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
import { QuanLyVoXe } from '@/types/database'

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setIdVo(initialData.id_vo)
      setTinhTrangGai(initialData.tinh_trang_gai?.toString() || '')
      setTrangThai(initialData.trang_thai_vo || 'Đang chạy')
    } else {
      setIdVo('')
      setTinhTrangGai('')
      setTrangThai('Đang chạy')
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idVo) return toast.error('Vui lòng nhập Serial Number của lốp')

    setIsSubmitting(true)

    try {
      const payload = { 
        id_vo: idVo, 
        tinh_trang_gai: tinhTrangGai ? parseFloat(tinhTrangGai) : 0,
        trang_thai_vo: trangThai
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
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Sửa thông tin lốp' : 'Nhập kho lốp mới'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Quản lý Serial Number và tình trạng kỹ thuật của lốp.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <div className="grid gap-2">
              <Label htmlFor="gai">Độ sâu gai hiện tại (mm)</Label>
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
              <Label>Trạng thái lốp</Label>
              <Select value={trangThai} onValueChange={(val: any) => setTrangThai(val)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="Đang chạy">Đang chạy</SelectItem>
                  <SelectItem value="Chờ đắp">Chờ đắp</SelectItem>
                  <SelectItem value="Thanh lý">Thanh lý</SelectItem>
                </SelectContent>
              </Select>
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
