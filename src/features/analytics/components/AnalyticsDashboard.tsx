'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line, AreaChart, Area
} from 'recharts'
import { 
  TrendingUp, Wallet, Ticket, Truck, FileDown, 
  Loader2, BarChart3, Fuel, Wrench, MapPin
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

interface CostPerVehicle {
  id: string
  bien_so: string
  loai_xe: string | null
  total_tickets: number
  total_cost: number
  cp_km: number
  so_km_hien_tai: number
}

interface CostPerGarage {
  id: string
  ten_gara: string
  total_tickets: number
  total_cost: number
  unique_vehicles: number
}

export function AnalyticsDashboard() {
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([])
  const [vehiclesCost, setVehiclesCost] = useState<CostPerVehicle[]>([])
  const [garagesCost, setGaragesCost] = useState<CostPerGarage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAllTime: 0,
    activeTickets: 0,
    totalVehicles: 0,
    averageCostPerTicket: 0,
    avgCpKm: 0,
    totalDoneTickets: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 1. Monthly costs
      const { data: costData, error: costError } = await supabase
        .from('maintenance_costs_monthly')
        .select('*')
        .order('month', { ascending: true })

      if (costError) throw costError
      setMonthlyCosts(costData || [])

      // 2. Cost per vehicle
      const { data: vehicleData } = await supabase
        .from('cost_per_vehicle')
        .select('*')
        .order('total_cost', { ascending: false })
        .limit(10)
      setVehiclesCost(vehicleData || [])

      // 3. Cost per garage
      const { data: garageData } = await supabase
        .from('cost_per_garage')
        .select('*')
        .order('total_cost', { ascending: false })
      setGaragesCost(garageData || [])

      // 4. Overall stats
      const [ticketsRes, vehiclesRes, cpKmRes] = await Promise.all([
        supabase.from('phieu_bao_tri').select('*'),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }),
        supabase.from('overall_cp_km').select('*').single()
      ])
      
      const tickets = ticketsRes.data || []
      const vehicleCount = vehiclesRes.count || 0
      const doneTickets = tickets.filter(t => t.trang_thai_phieu === 'Đã xong')
      const total = doneTickets.reduce((sum, t) => sum + (t.tong_chi_phi || 0), 0)
      
      const cpKmData = cpKmRes.data as any
      const avgCpKm = cpKmData?.avg_cp_km ? Math.round(cpKmData.avg_cp_km) : 0

      setStats({
        totalAllTime: total,
        activeTickets: tickets.filter(t => t.trang_thai_phieu !== 'Đã xong').length,
        totalVehicles: vehicleCount,
        averageCostPerTicket: doneTickets.length > 0 ? total / doneTickets.length : 0,
        avgCpKm,
        totalDoneTickets: doneTickets.length
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
      const wb = XLSX.utils.book_new()
      
      const ws1 = XLSX.utils.json_to_sheet(monthlyCosts.map(m => ({
        'Tháng': m.month,
        'Tổng chi phí': m.total_cost,
        'Số phiếu': m.ticket_count
      })))
      XLSX.utils.book_append_sheet(wb, ws1, 'Chi phí tháng')

      const ws2 = XLSX.utils.json_to_sheet(vehiclesCost.map(v => ({
        'Biển số': v.bien_so,
        'Loại xe': v.loai_xe,
        'Số phiếu': v.total_tickets,
        'Tổng chi phí': v.total_cost,
        'CP/KM': Math.round(v.cp_km),
        'KM hiện tại': v.so_km_hien_tai
      })))
      XLSX.utils.book_append_sheet(wb, ws2, 'Chi phí theo xe')

      const ws3 = XLSX.utils.json_to_sheet(garagesCost.map(g => ({
        'Gara': g.ten_gara,
        'Số phiếu': g.total_tickets,
        'Tổng chi phí': g.total_cost,
        'Xe độc nhất': g.unique_vehicles
      })))
      XLSX.utils.book_append_sheet(wb, ws3, 'Chi phí theo gara')

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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
  const vehicleChartData = vehiclesCost.map(v => ({
    name: v.bien_so,
    'Chi phí': v.total_cost,
    'CP/KM': v.cp_km
  }))
  const garageChartData = garagesCost.filter(g => g.total_tickets > 0).map(g => ({
    name: g.ten_gara,
    'Chi phí': g.total_cost,
    'Số phiếu': g.total_tickets
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Báo cáo & Phân tích</h1>
          <p className="text-sm text-slate-400">Tổng quan chi phí và hiệu suất bảo trì toàn hệ thống.</p>
        </div>
        <Button onClick={exportToExcel} className="gap-2 bg-green-600 hover:bg-green-700 font-bold shadow-lg shadow-green-900/20 w-full sm:w-auto">
          <FileDown className="w-4 h-4" />
          Xuất Excel
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md relative overflow-hidden group hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng chi phí</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Wallet className="h-4 w-4 text-blue-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalAllTime)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{stats.totalDoneTickets} phiếu đã xong</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/50 transition-all animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Chờ xử lý</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg"><Ticket className="h-4 w-4 text-amber-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">{stats.activeTickets}</div>
            <p className="text-[10px] text-slate-500 mt-1">Phiếu cần duyệt</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/50 transition-all animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Đội xe</CardTitle>
            <div className="p-2 bg-indigo-500/10 rounded-lg"><Truck className="h-4 w-4 text-indigo-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">{stats.totalVehicles}</div>
            <p className="text-[10px] text-slate-500 mt-1">Phương tiện</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/50 transition-all animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">TB/Phiếu</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg"><BarChart3 className="h-4 w-4 text-purple-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.averageCostPerTicket)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Chi phí TB</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/50 transition-all animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">CP/KM</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><Fuel className="h-4 w-4 text-emerald-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {stats.avgCpKm.toLocaleString('vi-VN')} <span className="text-xs text-slate-500">đ/km</span>
            </div>
            <p className="text-[10px] text-emerald-400 mt-1 font-medium">Chi phí mỗi KM</p>
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
             <p className="text-sm text-slate-400">Mọi thứ đang hoạt động ổn định.</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Cost Chart */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-slate-200">Chi phí bảo trì theo tháng</CardTitle>
          <CardDescription>Tổng chi phí và số lượng phiếu đã hoàn thành.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyCosts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  formatter={(value: any, name: any) => {
                    if (name === 'total_cost') return [new Intl.NumberFormat('vi-VN').format(value) + ' đ', 'Chi phí']
                    return [value, 'Số phiếu']
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="total_cost" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Chi phí" strokeWidth={2} />
                <Area type="monotone" dataKey="ticket_count" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Số phiếu" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cost per Vehicle & Garage Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              Chi phí theo đầu xe (Top 10)
            </CardTitle>
            <CardDescription>Xếp hạng xe theo tổng chi phí bảo trì.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    formatter={(value: any) => [new Intl.NumberFormat('vi-VN').format(value) + ' đ', 'Chi phí']}
                  />
                  <Bar dataKey="Chi phí" radius={[0, 4, 4, 0]}>
                    {vehicleChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              Chi phí theo Gara
            </CardTitle>
            <CardDescription>Phân bổ chi phí theo nơi sửa chữa.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {garageChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={garageChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="Chi phí"
                      nameKey="name"
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {garageChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      formatter={(value: any) => [new Intl.NumberFormat('vi-VN').format(value) + ' đ', 'Chi phí']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  Chưa có dữ liệu chi phí theo gara
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CP/KM per Vehicle Table */}
      {vehiclesCost.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              Bảng xếp hạng CP/KM theo xe
            </CardTitle>
            <CardDescription>Chi phí bảo trì trên mỗi km - Xe càng cao càng tốn kém.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Biển số</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Loại xe</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">KM hiện tại</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Số phiếu</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Tổng chi phí</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">CP/KM</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesCost.map((v, i) => (
                    <tr key={v.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{v.bien_so}</td>
                      <td className="py-3 px-4 text-slate-300">{v.loai_xe || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">{v.so_km_hien_tai?.toLocaleString() || 0}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{v.total_tickets}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">{v.total_cost.toLocaleString()} đ</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono font-bold ${v.cp_km > 5000 ? 'text-red-400' : v.cp_km > 2000 ? 'text-amber-400' : 'text-green-400'}`}>
                          {Math.round(v.cp_km).toLocaleString()} đ/km
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
