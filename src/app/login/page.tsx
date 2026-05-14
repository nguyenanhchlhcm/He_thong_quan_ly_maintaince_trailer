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
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/logistics_maintenance_bg_1778689298652.png" 
          alt="Logistics Background" 
          className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      <section className="w-full max-w-md relative z-10">
        <header className="flex flex-col items-center mb-10">
          <div className="premium-gradient p-4 rounded-2xl shadow-2xl shadow-primary/30 mb-4 animate-bounce-slow">
            <Truck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            T2M<span className="text-primary-foreground/50">.App</span>
          </h1>
        </header>
        
        <Card className="glass-card border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
          <CardHeader className="space-y-1 text-center pb-8">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">XÁC THỰC HỆ THỐNG</CardTitle>
            <CardDescription className="text-slate-400 font-medium">
              Maintenance & Repair Management Platform
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-slate-300 font-semibold ml-1">Email công ty</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@chl-logistics.com"
                  className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-12 text-white placeholder:text-slate-600 rounded-xl transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-12 text-white rounded-xl transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="pt-6">
              <Button 
                type="submit" 
                className="big-button w-full premium-gradient text-white border-none hover:shadow-primary/30" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ĐANG KẾT NỐI...
                  </>
                ) : 'TRUY CẬP HỆ THỐNG'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <footer className="mt-12 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">C.H.L Logistics Digital Transformation</p>
          <p className="text-[10px] text-slate-600">Secure AES-256 Encrypted Connection</p>
        </footer>
      </section>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1.05); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
      `}</style>
    </main>
  )
}
