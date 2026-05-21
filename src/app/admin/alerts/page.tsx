'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Bell, Search, RefreshCw, Loader2, CheckCircle, AlertTriangle, ShieldAlert, Clock, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SystemAlert {
  id: string
  target_id: string
  type: 'BẢO TRÌ' | 'GIAN LẬN'
  message: string
  severity: 'HIGH' | 'CRITICAL'
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<'ALL' | 'BẢO TRÌ' | 'GIAN LẬN'>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('PENDING')
  
  const { user: authUser } = useAuthStore()
  const router = useRouter()

  // Guard: Protect page. Only admin or manager role allowed.
  useEffect(() => {
    if (!authUser) return
    const role = (authUser?.user_metadata?.role as string) || 'MECHANIC'
    if (role.toUpperCase() !== 'ADMIN' && role.toUpperCase() !== 'MANAGER') {
      toast.error('Bạn không có quyền truy cập trang này.')
      router.push('/mechanic/tickets')
    }
  }, [authUser, router])

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAlerts(data || [])
    } catch (error: any) {
      console.error('Error fetching alerts:', error)
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        // Table not created yet
        setAlerts([])
      } else {
        toast.error('Lỗi tải danh sách cảnh báo: ' + error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const scanAlerts = async () => {
    setIsScanning(true)
    try {
      const res = await fetch('/api/alerts/scan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi không xác định')
      toast.success(data.message || 'Quét hệ thống thành công!')
      fetchAlerts()
    } catch (error: any) {
      console.error('Error scanning alerts:', error)
      toast.error('Lỗi khi quét hệ thống: ' + error.message)
    } finally {
      setIsScanning(false)
    }
  }

  const resolveAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      toast.success('Đã đánh dấu xử lý thành công!')
      fetchAlerts()
    } catch (error: any) {
      console.error('Error resolving alert:', error)
      toast.error('Lỗi khi cập nhật trạng thái: ' + error.message)
    }
  }

  const resolveAllAlerts = async () => {
    try {
      const pendingIds = alerts.filter(a => !a.is_resolved).map(a => a.id)
      if (pendingIds.length === 0) {
        toast.info('Không có cảnh báo chưa xử lý')
        return
      }

      const { error } = await supabase
        .from('system_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .in('id', pendingIds)

      if (error) throw error
      toast.success(`Đã xử lý tất cả ${pendingIds.length} cảnh báo!`)
      fetchAlerts()
    } catch (error: any) {
      console.error('Error resolving all alerts:', error)
      toast.error('Lỗi khi cập nhật trạng thái: ' + error.message)
    }
  }

  // Filter alerts based on search and filters
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'ALL' || alert.type === selectedType
    
    let matchesStatus = true
    if (selectedStatus === 'PENDING') matchesStatus = !alert.is_resolved
    if (selectedStatus === 'RESOLVED') matchesStatus = alert.is_resolved

    return matchesSearch && matchesType && matchesStatus
  })

  // Calculate statistics
  const stats = {
    total: alerts.length,
    pending: alerts.filter(a => !a.is_resolved).length,
    critical: alerts.filter(a => !a.is_resolved && a.severity === 'CRITICAL').length,
    resolved: alerts.filter(a => a.is_resolved).length,
  }

  if (isLoading && alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm">Đang tải danh sách cảnh báo...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            Trung tâm Cảnh báo Hệ thống
          </h1>
          <p className="text-sm text-slate-400">Giám sát các xe sắp đến hạn bảo trì và các phiếu phát hiện lỗi GPS.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={scanAlerts} 
            disabled={isScanning}
            className="bg-primary hover:bg-primary/95 text-white gap-2 font-bold w-full md:w-auto shadow-lg shadow-primary/20"
          >
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Quét Hệ thống
          </Button>
          <Button 
            onClick={resolveAllAlerts} 
            variant="outline"
            className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-200 gap-2 w-full md:w-auto"
          >
            <CheckCircle className="w-4 h-4 text-green-500" /> Giải quyết tất cả
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardContent className="pt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số cảnh báo</p>
            <p className="text-2xl font-black text-slate-100 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl border-l-amber-500/50 border-l-2">
          <CardContent className="pt-4">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Chưa xử lý</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl border-l-red-500/50 border-l-2">
          <CardContent className="pt-4">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Mức Khẩn cấp (Critical)</p>
            <p className="text-2xl font-black text-red-400 mt-1">{stats.critical}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl border-l-green-500/50 border-l-2">
          <CardContent className="pt-4">
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Đã giải quyết</p>
            <p className="text-2xl font-black text-green-400 mt-1">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
        <CardHeader className="pb-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <CardTitle className="text-lg">Chi tiết cảnh báo</CardTitle>
            <CardDescription className="text-slate-400 text-xs">Phân loại và tìm kiếm thông tin cảnh báo.</CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-[260px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Tìm nội dung cảnh báo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 h-9"
              />
            </div>
            
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedStatus('PENDING')}
                  className={`text-xs h-8 px-3 ${selectedStatus === 'PENDING' ? 'bg-primary text-primary-foreground font-semibold' : 'text-slate-400'}`}
                >
                  Chưa xử lý
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedStatus('RESOLVED')}
                  className={`text-xs h-8 px-3 ${selectedStatus === 'RESOLVED' ? 'bg-primary text-primary-foreground font-semibold' : 'text-slate-400'}`}
                >
                  Đã xử lý
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedStatus('ALL')}
                  className={`text-xs h-8 px-3 ${selectedStatus === 'ALL' ? 'bg-primary text-primary-foreground font-semibold' : 'text-slate-400'}`}
                >
                  Tất cả
                </Button>
              </div>

              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedType('ALL')}
                  className={`text-xs h-8 px-3 ${selectedType === 'ALL' ? 'bg-slate-800 text-slate-200 font-semibold' : 'text-slate-400'}`}
                >
                  Mọi loại
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedType('BẢO TRÌ')}
                  className={`text-xs h-8 px-3 ${selectedType === 'BẢO TRÌ' ? 'bg-slate-800 text-slate-200 font-semibold' : 'text-slate-400'}`}
                >
                  Bảo trì
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedType('GIAN LẬN')}
                  className={`text-xs h-8 px-3 ${selectedType === 'GIAN LẬN' ? 'bg-slate-800 text-slate-200 font-semibold' : 'text-slate-400'}`}
                >
                  Gian lận
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400 font-bold w-[180px]">Thời gian</TableHead>
                  <TableHead className="text-slate-400 font-bold w-[130px]">Phân loại</TableHead>
                  <TableHead className="text-slate-400 font-bold w-[130px]">Mức độ</TableHead>
                  <TableHead className="text-slate-400 font-bold">Nội dung cảnh báo</TableHead>
                  <TableHead className="text-slate-400 font-bold w-[150px]">Trạng thái</TableHead>
                  <TableHead className="text-slate-400 font-bold w-[180px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert) => {
                    const isGps = alert.type === 'GIAN LẬN'
                    const isCritical = alert.severity === 'CRITICAL'

                    return (
                      <TableRow key={alert.id} className="border-slate-800 hover:bg-slate-800/20 transition-colors">
                        <TableCell className="text-xs text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(alert.created_at).toLocaleString('vi-VN')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] font-extrabold uppercase py-0.5 px-2 border-0 ${
                              isGps
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {isGps ? <ShieldAlert className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {alert.type}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              isCritical
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : 'bg-amber-500/5 text-amber-500 border-amber-500/10'
                            }`}
                          >
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-200 font-semibold max-w-md truncate md:max-w-none">
                          {alert.message}
                        </TableCell>
                        <TableCell>
                          {alert.is_resolved ? (
                            <div className="flex flex-col gap-0.5 text-slate-500">
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1 w-fit text-[10px]">
                                Đã xử lý
                              </Badge>
                              {alert.resolved_at && (
                                <span className="text-[9px] font-mono font-medium pl-1">
                                  {new Date(alert.resolved_at).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 text-[10px]">
                              Chờ xử lý
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={isGps ? '/admin/tickets' : '/admin/master-data?tab=vehicles'}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-slate-400 hover:text-primary gap-1 px-2"
                              >
                                Xử lý <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            {!alert.is_resolved && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resolveAlert(alert.id)}
                                className="h-8 text-xs text-slate-400 hover:text-green-400 hover:bg-green-500/10 gap-1 px-2"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Xong
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500 italic">
                      Không có cảnh báo nào khớp với bộ lọc.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
