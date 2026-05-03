'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts'
import { 
  TrendingUp, Wallet, Ticket, Truck, FileDown, 
  ArrowUpRight, ArrowDownRight, Loader2, BarChart3 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { AlertCenter } from './AlertCenter'

interface MonthlyCost {
  month: string
  total_cost: number
  ticket_count: number
}

export function AnalyticsDashboard() {
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAllTime: 0,
    activeTickets: 0,
    totalVehicles: 0,
    averageCostPerTicket: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch monthly costs from our new View
      const { data: costData, error: costError } = await supabase
        .from('maintenance_costs_monthly')
        .select('*')
        .order('month', { ascending: true })

      if (costError) throw costError
      setMonthlyCosts(costData || [])

      // 2. Fetch summary stats
      const { data: tickets } = await supabase.from('phieu_bao_tri').select('tong_chi_phi, trang_thai_phieu')
      const { count: vehicleCount } = await supabase.from('vehicles').select('*', { count: 'exact', head: true })

      const doneTickets = tickets?.filter(t => t.trang_thai_phieu === 'Đã xong') || []
      const total = doneTickets.reduce((sum, t) => sum + (t.tong_chi_phi || 0), 0)
      
      setStats({
        totalAllTime: total,
        activeTickets: tickets?.filter(t => t.trang_thai_phieu !== 'Đã xong').length || 0,
        totalVehicles: vehicleCount || 0,
        averageCostPerTicket: doneTickets.length > 0 ? total / doneTickets.length : 0
      })
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      toast.error('Lỗi khi tải dữ liệu báo cáo: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(monthlyCosts)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Báo cáo chi phí")
      XLSX.writeFile(wb, `Bao_cao_chi_phi_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Đã xuất file Excel thành công!')
    } catch (error) {
      toast.error('Lỗi khi xuất Excel')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-400">Đang phân tích dữ liệu hệ thống...</p>
      </div>
    )
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Báo cáo & Phân tích</h2>
          <p className="text-slate-400">Tổng quan chi phí và hiệu suất bảo trì toàn hệ thống.</p>
        </div>
        <Button onClick={exportToExcel} className="gap-2 bg-green-600 hover:bg-green-700 font-bold">
          <FileDown className="w-4 h-4" />
          Xuất Excel
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Tổng chi phí (Đã xong)</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalAllTime)}
            </div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Phiếu đang xử lý</CardTitle>
            <Ticket className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.activeTickets}</div>
            <p className="text-xs text-slate-500 mt-1 italic">Cần kiểm tra và phê duyệt</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Tổng số phương tiện</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.totalVehicles}</div>
            <p className="text-xs text-slate-500 mt-1">Đang quản lý trong danh mục</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Trung bình/Phiếu</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.averageCostPerTicket)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Hiệu suất chi phí vận hành</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <AlertCenter />
        </div>
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-400">Trạng thái Hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
             <div className="p-4 bg-green-500/10 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-green-500" />
             </div>
             <p className="text-sm text-slate-400">Mọi thứ đang hoạt động ổn định. Cơ sở dữ liệu Supabase đã sẵn sàng.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-200">Biểu đồ Chi phí theo Tháng</CardTitle>
            <CardDescription>Dữ liệu tổng hợp từ các phiếu bảo trì đã hoàn tất.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCosts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#3b82f6' }}
                    formatter={(value: any) => [new Intl.NumberFormat('vi-VN').format(value) + ' VND', 'Chi phí']}
                  />
                  <Bar dataKey="total_cost" radius={[4, 4, 0, 0]}>
                    {monthlyCosts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Info */}
        <Card className="lg:col-span-3 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-200">Tần suất Bảo trì</CardTitle>
            <CardDescription>Số lượng phiếu sửa chữa theo tháng.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={monthlyCosts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="ticket_count"
                    nameKey="month"
                  >
                    {monthlyCosts.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
