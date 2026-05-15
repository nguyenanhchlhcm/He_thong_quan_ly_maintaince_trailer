'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminTicketTable } from '@/features/maintenance/components/admin/AdminTicketTable'
import { AdminTicketDialog } from '@/features/maintenance/components/admin/AdminTicketDialog'
import { CreateTicketDialog } from '@/features/maintenance/components/admin/CreateTicketDialog'
import { PhieuBaoTri } from '@/types/database'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { FileText, Clock, Hammer, CheckCircle2, Loader2, RefreshCw, Plus } from 'lucide-react'

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<PhieuBaoTri[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<PhieuBaoTri | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const fetchTickets = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('phieu_bao_tri')
        .select(`
          *,
          vehicles!id_xe (
            id,
            bien_so:id,
            loai_xe:model
          ),
          profiles!id_tho_may (*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTickets((data || []) as PhieuBaoTri[])
    } catch (error: any) {
      toast.error('Lỗi tải danh sách phiếu: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Stats calculation
  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.trang_thai_phieu === 'Chờ duyệt').length,
    inProgress: tickets.filter(t => t.trang_thai_phieu === 'Đang sửa').length,
    completed: tickets.filter(t => t.trang_thai_phieu === 'Đã xong').length
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-400">Đang tải danh sách phiếu bảo trì...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Quản lý Phiếu Bảo Trì
          </h1>
          <p className="text-slate-400">Xem xét, phê duyệt và nghiệm thu các yêu cầu sửa chữa từ đội ngũ thợ máy.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="gap-2 bg-primary hover:bg-primary/90 font-bold"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Lập phiếu mới
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchTickets} 
            className="border-slate-800 hover:bg-slate-800"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng phiếu</p>
              <h3 className="text-2xl font-bold text-slate-100">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chờ duyệt</p>
              <h3 className="text-2xl font-bold text-slate-100">{stats.pending}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Hammer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang sửa</p>
              <h3 className="text-2xl font-bold text-slate-100">{stats.inProgress}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hoàn tất</p>
              <h3 className="text-2xl font-bold text-slate-100">{stats.completed}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <CardTitle>Danh sách Phiếu hệ thống</CardTitle>
          <CardDescription>
            Bấm vào "Chi tiết" để xem các hạng mục vật tư và duyệt phiếu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTicketTable 
            data={tickets} 
            onViewDetails={(ticket) => {
              setSelectedTicket(ticket);
              setIsDialogOpen(true);
            }} 
          />
        </CardContent>
      </Card>

      <AdminTicketDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchTickets}
        ticket={selectedTicket}
      />

      <CreateTicketDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchTickets}
      />
    </div>
  )
}
