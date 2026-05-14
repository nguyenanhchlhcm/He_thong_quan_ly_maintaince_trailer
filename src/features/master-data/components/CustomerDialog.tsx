'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, UserCircle } from 'lucide-react'
import { KhachHang } from '@/types/database'

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: KhachHang | null
}

export function CustomerDialog({ open, onOpenChange, onSuccess, initialData }: CustomerDialogProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [taxId, setTaxId] = useState('')
  const [rank, setRank] = useState('Standard')
  const [debt, setDebt] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.ten_khach_hang)
      setPhone(initialData.sdt || '')
      setTaxId(initialData.ma_so_thue || '')
      setRank(initialData.hang_khach)
      setDebt(initialData.cong_no)
    } else {
      setName('')
      setPhone('')
      setTaxId('')
      setRank('Standard')
      setDebt(0)
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return toast.error('Vui lòng nhập tên khách hàng')

    setIsSubmitting(true)

    try {
      const payload = { 
        ten_khach_hang: name, 
        sdt: phone || null,
        ma_so_thue: taxId || null,
        hang_khach: rank,
        cong_no: debt
      }

      if (initialData) {
        const { error } = await supabase
          .from('danh_muc_khach_hang')
          .update(payload)
          .eq('id', initialData.id)
        if (error) throw error
        toast.success('Cập nhật khách hàng thành công!')
      } else {
        const { error } = await supabase
          .from('danh_muc_khach_hang')
          .insert([payload])
        if (error) throw error
        toast.success('Thêm khách hàng mới thành công!')
      }

      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error('Error saving customer:', error)
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
            <DialogTitle>{initialData ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Thông tin đối tác vận tải / khách hàng thuê xe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer-name">Tên khách hàng <span className="text-red-500">*</span></Label>
              <Input
                id="customer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Công ty TNHH Vận tải ABC"
                className="bg-slate-800 border-slate-700"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="090..."
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax-id">Mã số thuế</Label>
                <Input
                  id="tax-id"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="MST..."
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Hạng khách hàng</Label>
                <Select value={rank} onValueChange={(val) => setRank(val || 'Standard')}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="debt">Công nợ (VNĐ)</Label>
                <Input
                  id="debt"
                  type="number"
                  value={debt}
                  onChange={(e) => setDebt(Number(e.target.value))}
                  className="bg-slate-800 border-slate-700 font-mono"
                />
              </div>
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
