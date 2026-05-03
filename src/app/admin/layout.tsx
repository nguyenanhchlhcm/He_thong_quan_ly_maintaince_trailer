import { Metadata } from 'next'
import Link from 'next/link'
import { Truck, Users, Warehouse, Package, Settings, LogOut, Disc, FileText, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Admin Dashboard | C.H.L',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 pb-16 md:pb-0">
      {/* Sidebar - Desktop Only */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
            <div className="bg-primary p-1.5 rounded-lg">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <span>C.H.L</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Bảng điều khiển
          </Link>
          <Link href="/admin/master-data" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Settings className="w-5 h-5" />
            Quản lý Danh mục
          </Link>
          <Link href="/admin/tickets" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <FileText className="w-5 h-5" />
            Phiếu Bảo Trì
          </Link>
          <Link href="/admin/tires" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Disc className="w-5 h-5" />
            Quản lý Lốp xe
          </Link>
          <Link href="/admin/master-data?tab=users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Users className="w-5 h-5" />
            Nhân viên
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10">
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </Button>
        </div>
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
            <Button variant="outline" size="icon" className="w-9 h-9 rounded-full bg-slate-800/50 border-slate-700 hover:bg-primary/20 hover:border-primary/50 transition-all">
              <Settings className="w-4 h-4 text-slate-300" />
            </Button>
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
