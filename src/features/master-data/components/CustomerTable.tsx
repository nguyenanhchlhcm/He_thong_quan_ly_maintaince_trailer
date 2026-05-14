'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Edit, Trash2, UserCircle } from 'lucide-react'
import { KhachHang } from '@/types/database'

interface CustomerTableProps {
  data: KhachHang[]
  onEdit: (customer: KhachHang) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function CustomerTable({ data, onEdit, onDelete, onAdd }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(customer => 
    customer.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.sdt && customer.sdt.includes(searchTerm))
  )

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'VIP': return 'bg-amber-500/20 text-amber-500 border-amber-500/30'
      case 'Gold': return 'bg-slate-300/20 text-slate-300 border-slate-300/30'
      default: return 'bg-slate-500/20 text-slate-500 border-slate-500/30'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Tìm tên hoặc SĐT khách hàng..." 
            className="pl-9 bg-slate-800/50 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          Thêm Khách hàng
        </Button>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Tên khách hàng</TableHead>
              <TableHead className="text-slate-400">Liên hệ</TableHead>
              <TableHead className="text-slate-400">Hạng</TableHead>
              <TableHead className="text-slate-400 text-right">Công nợ</TableHead>
              <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((customer) => (
                <TableRow key={customer.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-slate-500" />
                      {customer.ten_khach_hang}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    <div>{customer.sdt || '-'}</div>
                    <div className="text-[10px] text-slate-600 font-mono">{customer.ma_so_thue || ''}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRankBadge(customer.hang_khach)}`}>
                      {customer.hang_khach}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-amber-500">
                    {customer.cong_no.toLocaleString()} đ
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
                        onClick={() => onEdit(customer)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => onDelete(customer.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">
                  Không tìm thấy khách hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
