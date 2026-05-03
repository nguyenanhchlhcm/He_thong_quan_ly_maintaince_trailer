import { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, Home, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/layout/LogoutButton'

export const metadata: Metadata = {
  title: 'Mechanic App | C.H.L',
  description: 'Ứng dụng Thợ máy - Quản lý phiếu bảo trì',
}

import { NetworkStatus } from '@/components/ui/NetworkStatus'
import { SyncEngine } from '@/components/ui/SyncEngine'

export default function MechanicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 pb-16 md:pb-0">
      {/* Top Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-primary w-8 h-8 rounded-full flex items-center justify-center">
            <span className="font-bold text-primary-foreground text-[10px]">C.H.L</span>
          </div>
          <h1 className="font-semibold text-lg tracking-tight">Thợ Máy</h1>
        </div>
        <LogoutButton 
          variant="ghost" 
          showText={true} 
          className="hidden sm:flex text-slate-400 hover:text-red-400 gap-2 font-medium" 
        />
        <LogoutButton 
          variant="ghost" 
          showText={false} 
          className="flex sm:hidden text-slate-400 hover:text-red-400" 
        />
      </header>

      <NetworkStatus />
      <SyncEngine />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around md:hidden pb-safe">
        <Link href="/mechanic" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-primary transition-colors">
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Trang chủ</span>
        </Link>
        <Link href="/mechanic/tickets" className="flex flex-col items-center justify-center w-full h-full text-primary transition-colors">
          <ClipboardList className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Phiếu bảo trì</span>
        </Link>
        <Link href="/mechanic/profile" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-primary transition-colors">
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Cá nhân</span>
        </Link>
      </nav>

      {/* Sidebar - Desktop/Tablet Fallback */}
      <aside className="fixed top-14 bottom-0 left-0 w-64 bg-slate-900 border-r border-slate-800 hidden md:block">
        <nav className="p-4 space-y-2">
          <Link href="/mechanic" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-medium">Trang chủ</span>
          </Link>
          <Link href="/mechanic/tickets" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary transition-colors">
            <ClipboardList className="w-5 h-5" />
            <span className="font-medium">Phiếu bảo trì</span>
          </Link>
          <Link href="/mechanic/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">
            <User className="w-5 h-5" />
            <span className="font-medium">Cá nhân</span>
          </Link>
        </nav>
      </aside>
    </div>
  )
}
