'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, MapPin } from 'lucide-react'
import { Gara } from '@/types/database'

interface GarageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: Gara | null
}

export function GarageDialog({ open, onOpenChange, onSuccess, initialData }: GarageDialogProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState('') 
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setAddress(initialData.address || '')
      if (initialData.lat && initialData.lng) {
        setCoords(`${initialData.lat}, ${initialData.lng}`)
      } else {
        setCoords('')
      }
    } else {
      setName('')
      setAddress('')
      setCoords('')
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return toast.error('Vui lòng nhập tên Gara')

    setIsSubmitting(true)

    let lat: number | null = null
    let lng: number | null = null

    if (coords.trim()) {
      const parts = coords.split(/[,/\s]+/).map(p => p.trim())
      if (parts.length >= 2) {
        lat = parseFloat(parts[0])
        lng = parseFloat(parts[1])
      }
      
      if (isNaN(lat as number) || isNaN(lng as number)) {
        setIsSubmitting(false)
        return toast.error('Định dạng tọa độ không hợp lệ.')
      }
    }

    try {
      const payload = { 
        name, 
        address: address || null,
        lat,
        lng
      }

      if (initialData) {
        const { error } = await supabase
          .from('garages')
          .update(payload)
          .eq('id', initialData.id)
        if (error) throw error
        toast.success('Cập nhật Gara thành công!')
      } else {
        const { error } = await supabase
          .from('garages')
          .insert([payload])
        if (error) throw error
        toast.success('Thêm Gara mới thành công!')
      }

      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error('Error saving garage:', error)
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
            <DialogTitle>{initialData ? 'Sửa thông tin Gara' : 'Thêm Gara mới'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Đăng ký trạm bảo trì nội bộ hoặc đối tác sửa chữa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="garage-name">Tên Gara <span className="text-red-500">*</span></Label>
              <Input
                id="garage-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Gara T2M - Quận 9"
                className="bg-slate-800 border-slate-700 focus:ring-primary"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số đường, phường, quận..."
                className="bg-slate-800 border-slate-700 focus:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coords" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Tọa độ GPS (Lat, Lng)
              </Label>
              <Input
                id="coords"
                value={coords}
                onChange={(e) => setCoords(e.target.value)}
                placeholder="VD: 10.729, 106.737"
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
