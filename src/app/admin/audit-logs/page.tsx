'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ShieldAlert, Search, RefreshCw, Trash2, Calendar, FileText, User, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

interface AuditLog {
  id: number
  user_email: string
  action: string
  target: string
  description: string
  created_at: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('ALL')
  const { user: authUser } = useAuthStore()
  const router = useRouter()

  // Guard: Protect page. Only admin role allowed.
  useEffect(() => {
    if (!authUser) return
    const role = (authUser?.user_metadata?.role as string) || 'MECHANIC'
    if (role.toUpperCase() !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập trang này.')
      router.push('/mechanic/tickets')
    }
  }, [authUser, router])

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setLogs(data || [])
    } catch (error: any) {
      toast.error('Lỗi tải nhật ký hệ thống: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleRefresh = () => {
    fetchLogs()
    toast.success('Đã làm mới dữ liệu nhật ký!')
  }

  // Filter logs based on search and action filter
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (selectedAction === 'ALL') return matchesSearch
    return matchesSearch && log.action === selectedAction
  })

  // Calculate statistics
  const stats = {
    total: logs.length,
    deletes: logs.filter(l => l.action?.toUpperCase() === 'XÓA' || l.description?.includes('Xóa')).length,
    updates: logs.filter(l => l.action?.toUpperCase() === 'CẬP NHẬT').length,
    activeUsers: new Set(logs.map(l => l.user_email)).size
  }

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm">Đang tải nhật ký hệ thống...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Nhật ký Hoạt động Hệ thống
          </h1>
          <p className="text-sm text-slate-400">Giám sát mọi thao tác nhạy cảm, chỉnh sửa, và xóa dữ liệu.</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="bg-slate-900 border-slate-800 text-slate-200 gap-2 hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardContent className="pt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số ghi nhận</p>
            <p className="text-2xl font-black text-slate-100 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl border-l-red-500/50 border-l-2">
          <CardContent className="pt-4">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Yêu cầu Xóa</p>
            <p className="text-2xl font-black text-red-400 mt-1">{stats.deletes}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl border-l-amber-500/50 border-l-2">
          <CardContent className="pt-4">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Lượt Chỉnh sửa</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.updates}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardContent className="pt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Người thực thi</p>
            <p className="text-2xl font-black text-slate-100 mt-1">{stats.activeUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <CardTitle className="text-lg">Danh sách Nhật ký</CardTitle>
            <CardDescription className="text-slate-400 text-xs">Tra cứu hoạt động chi tiết của thợ máy và quản trị viên.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Tìm người dùng, thao tác..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 h-9"
              />
            </div>
            {/* Quick Action Category Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'THÊM', 'CẬP NHẬT', 'XÓA'].map(act => (
                <Button
                  key={act}
                  size="sm"
                  variant={selectedAction === act ? 'default' : 'secondary'}
                  onClick={() => setSelectedAction(act)}
                  className={`text-xs px-2.5 h-9 shrink-0 ${
                    selectedAction === act 
                      ? 'bg-primary text-primary-foreground font-semibold shadow-lg' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {act === 'ALL' ? 'Tất cả' : act}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400 font-bold w-[200px]">Thời gian</TableHead>
                  <TableHead className="text-slate-400 font-bold w-[220px]">Người thực hiện</TableHead>
                  <TableHead className="text-slate-400 font-bold w-[120px]">Hành động</TableHead>
                  <TableHead className="text-slate-400 font-bold w-[130px]">Phân hệ</TableHead>
                  <TableHead className="text-slate-400 font-bold">Mô tả chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isDelete = log.action === 'XÓA' || log.description?.includes('Xóa')
                    const isUpdate = log.action === 'CẬP NHẬT'
                    const isCreate = log.action === 'THÊM'

                    return (
                      <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/20 transition-colors">
                        <TableCell className="text-xs text-slate-400 font-medium">
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary text-[10px] uppercase font-bold font-mono">
                              {log.user_email ? log.user_email.charAt(0) : 'H'}
                            </div>
                            <span className="text-xs truncate max-w-[180px]">{log.user_email || 'Hệ thống'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] font-extrabold uppercase py-0.5 px-2 border-0 ${
                              isDelete
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : isUpdate
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : isCreate
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300 font-bold">
                          {log.target}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300 font-medium">
                          {log.description}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">
                      Không tìm thấy lịch sử ghi nhận nào khớp bộ lọc.
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
