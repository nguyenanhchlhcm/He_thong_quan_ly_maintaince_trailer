'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2 } from 'lucide-react'
import { VatTuSKU } from '@/types/database'

interface PartTableProps {
  data: VatTuSKU[]
  onEdit: (part: VatTuSKU) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function PartTable({ data, onEdit, onDelete, onAdd }: PartTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(part => 
    (part.name || part.ten_vat_tu || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Tìm kiếm..." 
            className="pl-9 bg-slate-800/50 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          Thêm mới
        </Button>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Tên hạng mục / SKU</TableHead>
              <TableHead className="text-slate-400">Loại</TableHead>
              <TableHead className="text-slate-400">Đơn vị</TableHead>
              <TableHead className="text-slate-400 text-right">Đơn giá định mức</TableHead>
              <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((part) => (
                <TableRow key={part.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-medium">{part.name || part.ten_vat_tu}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-700/50 text-slate-400 border-slate-700">
                      {part.nhom_vat_tu}
                    </Badge>
                  </TableCell>
                  <TableCell>{part.unit || part.don_vi_tinh || '-'}</TableCell>
                  <TableCell className="text-right font-mono text-primary">
                    {(part.price ?? part.gia_tham_khao ?? 0).toLocaleString()} đ
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
                        onClick={() => onEdit(part)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => onDelete(part.id)}
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
                  Không tìm thấy hạng mục nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
