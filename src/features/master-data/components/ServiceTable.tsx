'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Edit, Trash2 } from 'lucide-react'
import { DichVu } from '@/types/database'

interface ServiceTableProps {
  data: DichVu[]
  onEdit: (service: DichVu) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function ServiceTable({ data, onEdit, onDelete, onAdd }: ServiceTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(service => 
    service.ten_dich_vu.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Tìm kiếm dịch vụ..." 
            className="pl-9 bg-slate-800/50 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          Thêm dịch vụ mới
        </Button>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Tên dịch vụ</TableHead>
              <TableHead className="text-slate-400">SLA dự kiến</TableHead>
              <TableHead className="text-slate-400 text-right">Đơn giá chuẩn</TableHead>
              <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((service) => (
                <TableRow key={service.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-medium">{service.ten_dich_vu}</TableCell>
                  <TableCell className="text-slate-400">{service.sla_du_kien || '-'}</TableCell>
                  <TableCell className="text-right font-mono text-primary">
                    {service.don_gia_chuan?.toLocaleString()} đ
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
                        onClick={() => onEdit(service)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => onDelete(service.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500 italic">
                  Không tìm thấy dịch vụ nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
