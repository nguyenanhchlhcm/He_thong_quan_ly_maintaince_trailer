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
  const [id, setId] = useState('')
  const [model, setModel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setId(initialData.id)
      setModel(initialData.model || '')
    } else {
      setId('')
      setModel('')
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return toast.error('Vui lòng nhập Biển số/ID xe')

    setIsSubmitting(true)

    try {
      if (initialData) {
        // Mode: EDIT
        const { error } = await supabase
          .from('vehicles')
          .update({ model })
          .eq('id', initialData.id)

        if (error) throw error
        toast.success('Cập nhật thông tin xe thành công!')
      } else {
        // Mode: ADD
        const { error } = await supabase
          .from('vehicles')
          .insert([{ id, model }])

        if (error) throw error
        toast.success('Thêm xe mới thành công!')
      }

      onOpenChange(false)
      onSuccess(id)
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
              {initialData ? `Chỉnh sửa thông tin cho xe ${initialData.id}` : 'Nhập biển số hoặc ID định danh cho xe mới.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="id">Biển số / ID Xe <span className="text-red-500">*</span></Label>
              <Input
                id="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="VD: 51C-123.45"
                className="bg-slate-800 border-slate-700 focus:ring-primary"
                required
                disabled={!!initialData} // Không cho sửa ID/Biển số vì là Primary Key
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Model / Ghi chú</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="VD: Freightliner Cascadia 2022"
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
