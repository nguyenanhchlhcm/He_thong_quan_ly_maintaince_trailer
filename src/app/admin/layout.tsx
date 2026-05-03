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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl hidden md:flex flex-col">
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
          <Link href="/admin/master-data?tab=vehicles" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Truck className="w-5 h-5" />
            Đội xe
          </Link>
          <Link href="/admin/master-data?tab=parts" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Package className="w-5 h-5" />
            Vật tư
          </Link>
          <Link href="/admin/master-data?tab=garages" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Warehouse className="w-5 h-5" />
            Gara
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-8">
          <h2 className="font-semibold text-lg">Hệ thống Quản trị</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">Administrator</p>
              <p className="text-xs text-slate-500">admin@chl-maintenance.com</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Settings className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
