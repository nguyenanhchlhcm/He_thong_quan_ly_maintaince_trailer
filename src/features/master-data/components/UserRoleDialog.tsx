'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Shield, UserPlus } from 'lucide-react'
import { Profile } from '@/types/database'

interface UserRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user: Profile | null
}

export function UserRoleDialog({ open, onOpenChange, onSuccess, user }: UserRoleDialogProps) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'mechanic'>('mechanic')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setFullName(user.full_name || '')
      setRole((user.role?.toLowerCase() as 'admin' | 'mechanic') || 'mechanic')
    } else {
      setEmail('')
      setFullName('')
      setRole('mechanic')
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Vui lòng nhập Email')

    setIsSubmitting(true)

    try {
      if (user) {
        // Mode: EDIT
        const { error } = await supabase
          .from('profiles')
          .update({ 
            full_name: fullName,
            role: role 
          })
          .eq('id', user.id)

        if (error) throw error
        toast.success('Cập nhật nhân viên thành công!')
      } else {
        // Mode: ADD (INSERT)
        const { error } = await supabase
          .from('profiles')
          .insert([{ 
            email,
            full_name: fullName,
            role: role 
          }])

        if (error) throw error
        toast.success('Thêm nhân viên mới thành công!')
      }
      
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error('Error saving user:', error)
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
            <DialogTitle className="flex items-center gap-2">
              {user ? <Shield className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
              {user ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {user ? `Cập nhật thông tin cho ${user.email}` : 'Đăng ký thông tin và phân quyền cho thành viên mới.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email đăng nhập <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: nhanvien@chl-maintenance.com"
                className="bg-slate-800 border-slate-700 focus:ring-primary"
                required
                disabled={!!user} // Không cho sửa email nếu là edit
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="full-name">Họ và tên</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="bg-slate-800 border-slate-700 focus:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <Label>Vai trò hệ thống</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                  <SelectItem value="mechanic">Thợ máy (Mechanic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                user ? 'Cập nhật' : 'Thêm mới'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
