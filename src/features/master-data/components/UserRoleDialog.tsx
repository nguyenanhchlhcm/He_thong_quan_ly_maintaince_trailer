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
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'mechanic'>('mechanic')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setFullName(user.full_name || '')
      setRole((user.role?.toLowerCase() as 'admin' | 'mechanic') || 'mechanic')
      setPassword('') // Don't show existing password
    } else {
      setEmail('')
      setFullName('')
      setRole('mechanic')
      setPassword('')
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Vui lòng nhập Email')
    if (!user && !password) return toast.error('Vui lòng nhập mật khẩu cho tài khoản mới')

    setIsSubmitting(true)

    try {
      if (user) {
        // Mode: EDIT (Only update profile info)
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
        // Mode: QUICK CREATE (Create Auth User + Profile via API)
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName, role })
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Lỗi khi tạo tài khoản')

        toast.success('Đã tạo tài khoản và hồ sơ nhân viên thành công!')
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
            {!user && (
              <div className="grid gap-2">
                <Label htmlFor="password">Mật khẩu khởi tạo <span className="text-red-500">*</span></Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập ít nhất 6 ký tự"
                  className="bg-slate-800 border-slate-700 focus:ring-primary"
                  required
                />
              </div>
            )}
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
