'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, AlertCircle, Clock, CheckCircle2, Hammer, FileText, Wrench, MapPin, User } from 'lucide-react'
import { PhieuBaoTri } from '@/types/database'

interface AdminTicketTableProps {
  data: PhieuBaoTri[]
  onViewDetails: (ticket: PhieuBaoTri) => void
}

export function AdminTicketTable({ data, onViewDetails }: AdminTicketTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(ticket => {
    const bienSo = ticket.vehicles?.bien_so || ticket.id_xe || ''
    const maPhieu = ticket.ma_phieu || ticket.id.slice(0, 8)
    const term = searchTerm.toLowerCase()
    return bienSo.toLowerCase().includes(term) || maPhieu.toLowerCase().includes(term)
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Báo giá': 
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20">Báo giá</Badge>
      case 'Chờ duyệt': 
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</Badge>
      case 'Đang sửa': 
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1"><Hammer className="w-3 h-3" /> Đang sửa</Badge>
      case 'Đã xong': 
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Đã xong</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const formatDateTime = (isoString: string | null | undefined) => {
    if (!isoString) return 'N/A'
    const date = new Date(isoString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Tìm theo Biển số xe hoặc Mã phiếu..." 
            className="pl-9 bg-slate-800/50 border-slate-700 text-slate-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Mã Phiếu</TableHead>
              <TableHead className="text-slate-400">Ngày tạo</TableHead>
              <TableHead className="text-slate-400">Biển số Xe</TableHead>
              <TableHead className="text-slate-400">Trạng thái</TableHead>
              <TableHead className="text-slate-400">Loại</TableHead>
              <TableHead className="text-slate-400 text-right">Tổng chi phí</TableHead>
              <TableHead className="text-slate-400">Người phụ trách</TableHead>
              <TableHead className="text-slate-400">GPS</TableHead>
              <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((ticket) => (
                <TableRow key={ticket.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-slate-400">
                    {ticket.ma_phieu || ticket.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-medium">
                    {formatDateTime(ticket.created_at)}
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    <div>
                      <p>{ticket.vehicles?.bien_so || ticket.id_xe || 'N/A'}</p>
                      {ticket.vehicles?.loai_xe && (
                        <p className="text-[10px] text-slate-500 font-normal">{ticket.vehicles.loai_xe}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(ticket.trang_thai_phieu)}</TableCell>
                  <TableCell>
                    {ticket.loai_phieu === 'Bên ngoài' ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 w-fit">
                          <MapPin className="w-3 h-3" /> Bên ngoài
                        </Badge>
                        {ticket.loai_sua_ngoai && (
                          <span className="text-[10px] text-amber-400/60 pl-1">{ticket.loai_sua_ngoai}</span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-blue-500/5 text-blue-400/70 border-blue-500/10 gap-1">
                        <Wrench className="w-3 h-3" /> Nội bộ
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-200">
                    {ticket.tong_chi_phi.toLocaleString()} đ
                  </TableCell>
                  <TableCell className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary border border-primary/20">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="text-xs">{ticket.profiles?.full_name || ticket.profiles?.email || 'Chưa gán'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ticket.canh_bao_gps ? (
                      <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1 animate-pulse">
                        <AlertCircle className="w-3 h-3" /> Lệch vị trí
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-500/5 text-green-500/50 border-green-500/10">Hợp lệ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 text-slate-400 hover:text-primary hover:bg-primary/10"
                      onClick={() => onViewDetails(ticket)}
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-slate-500 italic">
                  Không tìm thấy phiếu bảo trì nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
