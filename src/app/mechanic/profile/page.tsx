'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, LogOut, Settings, Bell, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MechanicProfilePage() {
  const router = useRouter()

  const handleLogout = () => {
    // Mock logout
    router.push('/login')
  }

  return (
    <div className="p-4 md:p-8 md:ml-16 space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
          <User className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Lê Văn Thợ</h2>
          <p className="text-slate-400 text-sm font-medium">Bậc thợ: 7/7 (Senior Mechanic)</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-500/20 uppercase font-bold">
              Đang Online
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Cài đặt tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-2">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-slate-300">
              <Settings className="w-5 h-5 text-slate-500" />
              <span>Thiết lập thông báo</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-slate-300">
              <Bell className="w-5 h-5 text-slate-500" />
              <span>Lịch sử hoạt động</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-slate-300">
              <ShieldCheck className="w-5 h-5 text-slate-500" />
              <span>Đổi mật khẩu</span>
            </Button>
          </CardContent>
        </Card>

        <Button 
          variant="destructive" 
          className="w-full h-12 gap-2 font-bold shadow-lg shadow-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          ĐĂNG XUẤT
        </Button>
      </div>

      <div className="text-center pt-8 text-slate-600 text-[10px]">
        <p>MAINTENANCE & REPAIR C.H.L</p>
        <p>Phiên bản 1.0.0 (Build 2026.05.03)</p>
      </div>
    </div>
  )
}
