'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const role = user?.user_metadata?.role || 'mechanic'
        
        toast.success('Đăng nhập thành công!')
        
        if (role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/mechanic')
        }
        
        router.refresh()
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error('Đã xảy ra lỗi ngoài ý muốn.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
            <Truck className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
        
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-xl text-slate-100 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight uppercase">MAINTENANCE & REPAIR C.H.L</CardTitle>
            <CardDescription className="text-slate-400">
              Hệ thống quản lý bảo trì xe Container
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="bg-slate-800/50 border-slate-700 focus:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mật khẩu</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="bg-slate-800/50 border-slate-700 focus:ring-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full h-11 text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="mt-8 text-center text-sm text-slate-500">
          © 2026 C.H.L Maintenance. All rights reserved.
        </p>
      </div>
    </div>
  )
}
