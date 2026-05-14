'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Xe } from '@/types/database'

interface VehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (id?: string) => void
  initialData?: Xe | null
}

export function VehicleDialog({ open, onOpenChange, onSuccess, initialData }: VehicleDialogProps) {
  const [idXe, setIdXe] = useState('')
  const [bienSo, setBienSo] = useState('')
  const [loaiXe, setLoaiXe] = useState<'Đầu kéo' | 'Rơ-moóc' | 'Xe tải'>('Đầu kéo')
  const [soKm, setSoKm] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setIdXe(initialData.id_xe)
      setBienSo(initialData.bien_so)
      setLoaiXe(initialData.loai_xe)
      setSoKm(initialData.so_km_hien_tai)
    } else {
      setIdXe('')
      setBienSo('')
      setLoaiXe('Đầu kéo')
      setSoKm(0)
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idXe || !bienSo) return toast.error('Vui lòng nhập ID và Biển số xe')

    setIsSubmitting(true)

    try {
      const payload = { 
        bien_so: bienSo, 
        loai_xe: loaiXe, 
        so_km_hien_tai: soKm 
      }

      if (initialData) {
        const { error } = await supabase
          .from('vehicles')
          .update(payload)
          .eq('id_xe', initialData.id_xe)

        if (error) throw error
        toast.success('Cập nhật thông tin xe thành công!')
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([{ ...payload, id_xe: idXe }])

        if (error) throw error
        toast.success('Thêm xe mới thành công!')
      }

      onOpenChange(false)
      onSuccess(idXe)
    } catch (error: any) {
      console.error('Error saving vehicle:', error)
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
            <DialogTitle>{initialData ? 'Sửa thông tin xe' : 'Thêm xe mới vào đội'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {initialData ? `Chỉnh sửa thông tin cho xe ${initialData.id_xe}` : 'Nhập biển số hoặc ID định danh cho xe mới.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="id_xe">ID Xe (Nội bộ) <span className="text-red-500">*</span></Label>
              <Input
                id="id_xe"
                value={idXe}
                onChange={(e) => setIdXe(e.target.value)}
                placeholder="VD: XE-001"
                className="bg-slate-800 border-slate-700 focus:ring-primary"
                required
                disabled={!!initialData}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bien_so">Biển số xe <span className="text-red-500">*</span></Label>
              <Input
                id="bien_so"
                value={bienSo}
                onChange={(e) => setBienSo(e.target.value)}
                placeholder="VD: 51C-123.45"
                className="bg-slate-800 border-slate-700 focus:ring-primary"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loai_xe">Loại xe</Label>
              <select
                id="loai_xe"
                value={loaiXe}
                onChange={(e) => setLoaiXe(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Đầu kéo">Đầu kéo</option>
                <option value="Rơ-moóc">Rơ-moóc</option>
                <option value="Xe tải">Xe tải</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="so_km">Số KM hiện tại</Label>
              <Input
                id="so_km"
                type="number"
                value={soKm}
                onChange={(e) => setSoKm(Number(e.target.value))}
                placeholder="0"
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
