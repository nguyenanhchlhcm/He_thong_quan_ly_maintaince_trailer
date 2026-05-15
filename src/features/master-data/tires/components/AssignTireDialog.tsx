'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Truck, Disc } from 'lucide-react'
import { QuanLyVoXe, Xe } from '@/types/database'

interface AssignTireDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  tire: QuanLyVoXe | null
}

export function AssignTireDialog({ open, onOpenChange, onSuccess, tire }: AssignTireDialogProps) {
  const [vehicles, setVehicles] = useState<Xe[]>([])
  const [selectedXe, setSelectedXe] = useState('')
  const [viTri, setViTri] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)

  useEffect(() => {
    if (open) {
      fetchVehicles()
      if (tire) {
        setSelectedXe(tire.id_xe || '')
        setViTri(tire.vi_tri_lap || '')
      }
    }
  }, [open, tire])

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true)
    const { data } = await supabase.from('vehicles').select('id, bien_so:id, loai_xe:model')
    setVehicles((data || []) as unknown as Xe[])
    setIsLoadingVehicles(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tire) return

    setIsSubmitting(true)

    try {
      // 1. Nếu gắn vào vị trí cụ thể trên xe, cần đảm bảo vị trí đó trống
      if (selectedXe && viTri) {
        // Tháo bất kỳ lốp nào đang ở vị trí này về kho
        await supabase
          .from('quan_ly_vo_xe')
          .update({ id_xe: null, vi_tri_lap: null })
          .eq('id_xe', selectedXe)
          .eq('vi_tri_lap', viTri)
          .neq('id_vo', tire.id_vo) // Không tháo chính nó nếu đang đảo trong cùng 1 vị trí
      }

      // 2. Cập nhật vị trí mới cho lốp hiện tại
      const { error } = await supabase
        .from('quan_ly_vo_xe')
        .update({ 
          id_xe: selectedXe || null, 
          vi_tri_lap: viTri || null 
        })
        .eq('id_vo', tire.id_vo)

      if (error) throw error

      toast.success('Điều chuyển lốp thành công!')
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
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
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Truck className="w-6 h-6 text-primary" />
              Điều chuyển & Đảo lốp
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Gắn lốp <span className="text-primary font-bold">{tire?.id_vo}</span> vào phương tiện hoặc điều chuyển về kho.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <Label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Thông tin lốp hiện tại</Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Disc className="w-5 h-5 text-slate-400" />
                  <span className="font-mono font-bold text-lg">{tire?.id_vo}</span>
                </div>
                <Badge variant="outline" className="bg-slate-900 border-slate-800">
                  {tire?.trang_thai_vo}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-slate-300">Chọn xe mục tiêu</Label>
                <Select value={selectedXe} onValueChange={(val: any) => setSelectedXe(val)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 h-11">
                    <SelectValue placeholder={isLoadingVehicles ? "Đang tải danh sách xe..." : "Chọn xe từ danh sách"} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="">-- Không gắn xe (Đưa về kho) --</SelectItem>
                    {vehicles.map(xe => (
                      <SelectItem key={xe.id} value={xe.id} className="focus:bg-primary/20">
                        <div className="flex flex-col">
                          <span className="font-bold">{xe.bien_so}</span>
                          <span className="text-[10px] text-slate-500">{xe.loai_xe || 'Không rõ loại'}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedXe && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-slate-300">Vị trí lắp trên xe</Label>
                  <Select value={viTri} onValueChange={(val: any) => setViTri(val)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 h-11">
                      <SelectValue placeholder="Chọn vị trí lắp" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase">Trục trước</div>
                      <SelectItem value="Trước trái">Trước trái (L1)</SelectItem>
                      <SelectItem value="Trước phải">Trước phải (R1)</SelectItem>
                      
                      <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase mt-2 border-t border-slate-800">Trục sau</div>
                      <SelectItem value="Sau trái ngoài">Sau trái ngoài (L2-O)</SelectItem>
                      <SelectItem value="Sau trái trong">Sau trái trong (L2-I)</SelectItem>
                      <SelectItem value="Sau phải trong">Sau phải trong (R2-I)</SelectItem>
                      <SelectItem value="Sau phải ngoài">Sau phải ngoài (R2-O)</SelectItem>
                      
                      <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase mt-2 border-t border-slate-800">Khác</div>
                      <SelectItem value="Sơ cua">Lốp sơ cua</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-amber-500/80 italic">
                    * Lưu ý: Nếu vị trí này đã có lốp khác, hệ thống sẽ tự động tháo lốp cũ về kho.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="border-t border-slate-800 pt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoadingVehicles} 
              className="min-w-[150px] bg-primary hover:bg-primary/90 font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận điều chuyển'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
