'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface LogoutButtonProps {
  className?: string
  variant?: "ghost" | "outline" | "default" | "destructive" | "secondary" | "link"
  showText?: boolean
}

export function LogoutButton({ className, variant = "ghost", showText = true }: LogoutButtonProps) {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success('Đã đăng xuất thành công')
      router.push('/login')
      router.refresh()
    } catch (error: any) {
      toast.error('Lỗi khi đăng xuất: ' + error.message)
    }
  }

  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={handleLogout}
    >
      <LogOut className="w-5 h-5" />
      {showText && <span>Đăng xuất</span>}
    </Button>
  )
}
