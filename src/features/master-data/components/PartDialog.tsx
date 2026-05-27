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
import { VatTuSKU } from '@/types/database'
import { SinglePhotoUploader } from '@/features/maintenance/components/mechanic/SinglePhotoUploader'
import { uploadBase64Image } from '@/lib/supabase/storage'

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
  const [nhomVatTu, setNhomVatTu] = useState<string>('Động cơ')
  const [customNhom, setCustomNhom] = useState('')
  const [skuPhoto, setSkuPhoto] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setTenVatTu(initialData.name || initialData.ten_vat_tu || '')
      setDonViTinh((initialData.unit || initialData.don_vi_tinh || 'Cái') as any)
      setGiaThamKhao((initialData.price || initialData.gia_tham_khao || 0).toString())
      
      const currentNhom = initialData.loai || 'Động cơ'
      const standardGroups = ['Động cơ', 'Gầm', 'Điện', 'Lốp', 'Máy lạnh']
      if (standardGroups.includes(currentNhom)) {
        setNhomVatTu(currentNhom)
        setCustomNhom('')
      } else {
        setNhomVatTu('Khác')
        setCustomNhom(currentNhom)
      }
      
      setExistingPhotoUrl(initialData.photo_url || null)
      setSkuPhoto(null)
    } else {
      setTenVatTu('')
      setDonViTinh('Cái')
      setGiaThamKhao('0')
      setNhomVatTu('Động cơ')
      setCustomNhom('')
      setExistingPhotoUrl(null)
      setSkuPhoto(null)
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenVatTu) return toast.error('Vui lòng nhập tên vật tư')

    const finalNhom = nhomVatTu === 'Khác' ? customNhom.trim() : nhomVatTu
    if (nhomVatTu === 'Khác' && !customNhom.trim()) {
      return toast.error('Vui lòng nhập tên nhóm vật tư khác')
    }

    setIsSubmitting(true)

    try {
      let finalPhotoUrl = existingPhotoUrl

      if (skuPhoto) {
        const path = `skus/${Date.now()}_sku.webp`
        finalPhotoUrl = await uploadBase64Image('t2m-evidence', path, skuPhoto)
      }

      const payload = { 
        name: tenVatTu, 
        unit: donViTinh, 
        price: giaThamKhao ? parseFloat(giaThamKhao) : 0,
        loai: finalNhom,
        photo_url: finalPhotoUrl
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
                  <SelectItem value="Khác">➕ Khác (Nhập mới...)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {nhomVatTu === 'Khác' && (
              <div className="grid gap-2 animate-in fade-in-20 duration-200">
                <Label htmlFor="custom-group">Tên nhóm vật tư khác <span className="text-red-500">*</span></Label>
                <Input
                  id="custom-group"
                  value={customNhom}
                  onChange={(e) => setCustomNhom(e.target.value)}
                  placeholder="VD: Cabin, Thủy lực, Thân vỏ..."
                  className="bg-slate-800 border-slate-700 focus:ring-primary"
                  required
                />
              </div>
            )}
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
            <div className="grid gap-2 pt-2 border-t border-slate-800">
              <Label>Hình ảnh vật tư (Không bắt buộc)</Label>
              <SinglePhotoUploader 
                title="Ảnh SKU / Vật tư"
                description="Nhấp để chụp hoặc chọn ảnh"
                required={false}
                onPhotoChange={setSkuPhoto}
                initialUrl={existingPhotoUrl}
                icon={<Camera className="w-5 h-5" />}
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
