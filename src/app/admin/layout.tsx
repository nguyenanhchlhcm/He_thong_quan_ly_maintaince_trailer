import { Metadata } from 'next'
import Link from 'next/link'
import { Truck, Users, Warehouse, Package, Settings, LogOut, Disc, FileText, LayoutDashboard, ShieldAlert, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/layout/LogoutButton'

export const metadata: Metadata = {
  title: 'Admin Dashboard | C.H.L',
}

import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.user_metadata?.role as string) || 'MECHANIC'
  const isAdmin = role.toUpperCase() === 'ADMIN'

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 pb-16 md:pb-0">
      {/* Sidebar - Desktop Only */}
      <aside className="w-16 hover:w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl hidden md:flex flex-col sticky top-0 h-screen transition-[width] duration-300 ease-in-out overflow-hidden group z-40">
        <div className="p-4 flex items-center justify-center group-hover:justify-start transition-all duration-300">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-2xl tracking-tighter whitespace-nowrap">
            <div className="bg-primary p-1.5 rounded-lg flex-shrink-0">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">C.H.L</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-2 space-y-1 mt-4">
          <Link href="/admin" className="flex items-center px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap">
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Bảng điều khiển</span>
          </Link>
          <Link href="/admin/master-data" className="flex items-center px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap">
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Quản lý Danh mục</span>
          </Link>
          <Link href="/admin/tickets" className="flex items-center px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap">
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Phiếu Bảo Trì</span>
          </Link>
          <Link href="/admin/tires" className="flex items-center px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap">
            <Disc className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Quản lý Lốp xe</span>
          </Link>
          <Link href="/admin/alerts" className="flex items-center px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap">
            <Bell className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Cảnh báo Hệ thống</span>
          </Link>
          {isAdmin && (
            <>
              <Link href="/admin/master-data?tab=users" className="flex items-center px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap">
                <Users className="w-5 h-5 flex-shrink-0" />
                <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Nhân viên</span>
              </Link>
              <Link href="/admin/audit-logs" className="flex items-center px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Nhật ký Hệ thống</span>
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around md:hidden px-2">
        <Link href="/admin" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-primary active:scale-90 transition-all">
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Báo cáo</span>
        </Link>
        <Link href="/admin/tickets" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-primary active:scale-90 transition-all">
          <FileText className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Phiếu</span>
        </Link>
        <Link href="/admin/tires" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-primary active:scale-90 transition-all">
          <Disc className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Lốp xe</span>
        </Link>
        <Link href="/admin/alerts" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-primary active:scale-90 transition-all">
          <Bell className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Cảnh báo</span>
        </Link>
        <Link href="/admin/master-data" className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-primary active:scale-90 transition-all">
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Cấu hình</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2 md:hidden">
            <div className="bg-primary p-1 rounded-md">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-bold text-sm tracking-tight">C.H.L ADMIN</h2>
          </div>
          <h2 className="hidden md:block font-semibold text-lg">Hệ thống Quản trị Bảo trì</h2>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-200">Administrator</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[150px]">admin@chl-maintenance.com</p>
            </div>
            <LogoutButton 
              variant="outline"
              showText={true}
              className="hidden sm:flex h-9 rounded-lg bg-slate-800/50 border-slate-700 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-slate-400 hover:text-red-400 gap-2 px-3 font-semibold text-xs uppercase"
            />
            <LogoutButton 
              variant="outline"
              showText={false}
              className="flex sm:hidden w-9 h-9 rounded-full bg-slate-800/50 border-slate-700 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-slate-400 hover:text-red-400"
            />
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
