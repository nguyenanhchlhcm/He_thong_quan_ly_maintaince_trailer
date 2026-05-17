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
import { FileText, Clock, Hammer, CheckCircle2, Loader2, RefreshCw, Plus, FileDown } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<PhieuBaoTri[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<PhieuBaoTri | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<PhieuBaoTri | null>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

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

  const handleExportExcel = async () => {
    let ticketsToExport = filteredTickets
    let isDefaultYearRange = false
    
    if (!startDate && !endDate) {
      isDefaultYearRange = true
      const currentYear = new Date().getFullYear()
      const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`)
      
      ticketsToExport = tickets.filter(ticket => {
        const targetDate = ticket.ngay_tiep_nhan || ticket.created_at
        if (!targetDate) return false
        const ticketDate = new Date(targetDate)
        return ticketDate >= startOfYear
      })
    }

    if (ticketsToExport.length === 0) {
      toast.error('Không có dữ liệu phiếu bảo trì để xuất!')
      return
    }

    setIsExporting(true)
    try {
      const ticketIds = ticketsToExport.map(t => t.id)
      let partsData: any[] = []
      
      if (ticketIds.length > 0) {
        const { data, error } = await supabase
          .from('chi_tiet_vat_tu_su_dung')
          .select(`
            *,
            sku:skus!id_sku (
              ten_vat_tu:name
            )
          `)
          .in('id_phieu', ticketIds)
        
        if (error) throw error
        partsData = data || []
      }

      const ws1Data = ticketsToExport.map(t => ({
        'Mã phiếu': t.ma_phieu || t.id.slice(0, 8),
        'Biển số xe': t.vehicles?.bien_so || t.id_xe || 'N/A',
        'Loại xe': t.vehicles?.loai_xe || '',
        'Loại phiếu': t.loai_phieu,
        'Thợ máy thực hiện': t.profiles?.full_name || t.profiles?.email || 'Chưa gán',
        'Đơn vị sửa ngoài': t.don_vi_sua_ngoai || '',
        'Loại sửa ngoài': t.loai_sua_ngoai || '',
        'Ngày tiếp nhận': new Date(t.ngay_tiep_nhan || t.created_at).toLocaleDateString('vi-VN'),
        'Ngày tạo phiếu': new Date(t.created_at).toLocaleDateString('vi-VN'),
        'Tổng tiền vật tư': t.tong_vat_tu || 0,
        'Tiền công': t.tien_cong || 0,
        'Tổng chi phí': t.tong_chi_phi || 0,
        'Trạng thái': t.trang_thai_phieu,
        'Ghi chú': t.ghi_chu_ngoai || ''
      }))

      const ws2Data = partsData.map(p => {
        const ticket = ticketsToExport.find(t => t.id === p.id_phieu)
        return {
          'Mã phiếu': ticket?.ma_phieu || p.id_phieu.slice(0, 8),
          'Biển số xe': ticket?.vehicles?.bien_so || ticket?.id_xe || 'N/A',
          'Ngày tiếp nhận': ticket ? new Date(ticket.ngay_tiep_nhan || ticket.created_at).toLocaleDateString('vi-VN') : '',
          'Ngày tạo phiếu': ticket ? new Date(ticket.created_at).toLocaleDateString('vi-VN') : '',
          'Tên vật tư / Dịch vụ': p.sku?.ten_vat_tu || 'Không rõ',
          'Số lượng': p.so_luong || 0,
          'Đơn giá': p.don_gia || 0,
          'Thành tiền': p.thanh_tien || 0,
          'Người thực hiện': ticket?.profiles?.full_name || 'Chưa gán'
        }
      })

      const wb = XLSX.utils.book_new()
      
      const ws1 = XLSX.utils.json_to_sheet(ws1Data)
      XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan phiếu')
      
      const ws2 = XLSX.utils.json_to_sheet(ws2Data)
      XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết vật tư')
      
      const fileName = isDefaultYearRange 
        ? `Phieu_Bao_Tri_Dau_Nam_Den_Nay_${new Date().toISOString().split('T')[0]}.xlsx`
        : `Phieu_Bao_Tri_Bo_Loc_${new Date().toISOString().split('T')[0]}.xlsx`
        
      XLSX.writeFile(wb, fileName)
      toast.success(`Đã xuất ${ticketsToExport.length} phiếu bảo trì sang Excel thành công!`)
    } catch (error: any) {
      toast.error('Lỗi khi xuất Excel: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const targetDate = ticket.ngay_tiep_nhan || ticket.created_at
    if (!targetDate) return true
    const ticketDate = new Date(targetDate).toISOString().split('T')[0]
    
    if (startDate && ticketDate < startDate) return false
    if (endDate && ticketDate > endDate) return false
    return true
  })

  // Stats calculation based on filtered list
  const stats = {
    total: filteredTickets.length,
    pending: filteredTickets.filter(t => t.trang_thai_phieu === 'Chờ duyệt').length,
    inProgress: filteredTickets.filter(t => t.trang_thai_phieu === 'Đang sửa').length,
    completed: filteredTickets.filter(t => t.trang_thai_phieu === 'Đã xong').length
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
            variant="outline"
            className="gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 font-bold"
            onClick={handleExportExcel}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Xuất Excel
          </Button>
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

      {/* Date Range Filter Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-900/50 p-4 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0]
              setStartDate(today)
              setEndDate(today)
            }}
            className={`border-slate-800 hover:bg-slate-800 text-xs ${startDate === new Date().toISOString().split('T')[0] && endDate === new Date().toISOString().split('T')[0] ? 'bg-primary text-slate-900 hover:bg-primary/95 border-primary font-bold' : 'text-slate-300'}`}
          >
            Hôm nay
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const end = new Date().toISOString().split('T')[0]
              const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              setStartDate(start)
              setEndDate(end)
            }}
            className={`border-slate-800 hover:bg-slate-800 text-xs ${startDate === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && endDate === new Date().toISOString().split('T')[0] ? 'bg-primary text-slate-900 hover:bg-primary/95 border-primary font-bold' : 'text-slate-300'}`}
          >
            7 ngày qua
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const end = new Date().toISOString().split('T')[0]
              const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              setStartDate(start)
              setEndDate(end)
            }}
            className={`border-slate-800 hover:bg-slate-800 text-xs ${startDate === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && endDate === new Date().toISOString().split('T')[0] ? 'bg-primary text-slate-900 hover:bg-primary/95 border-primary font-bold' : 'text-slate-300'}`}
          >
            30 ngày qua
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setStartDate('')
              setEndDate('')
            }}
            className={`border-slate-800 hover:bg-slate-800 text-xs ${!startDate && !endDate ? 'bg-primary text-slate-900 hover:bg-primary/95 border-primary font-bold' : 'text-slate-300'}`}
          >
            Tất cả
          </Button>
        </div>

        <div className="flex gap-3 items-center w-full md:w-auto">
          <div className="grid gap-1 w-full md:w-40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Từ ngày</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full [color-scheme:dark]"
            />
          </div>
          <div className="grid gap-1 w-full md:w-40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Đến ngày</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full [color-scheme:dark]"
            />
          </div>
        </div>
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
            data={filteredTickets} 
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
        onEditClick={(ticket) => {
          setEditingTicket(ticket)
          setIsCreateDialogOpen(true)
        }}
      />

      <CreateTicketDialog 
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) setEditingTicket(null)
        }}
        onSuccess={fetchTickets}
        editTicket={editingTicket}
      />
    </div>
  )
}
