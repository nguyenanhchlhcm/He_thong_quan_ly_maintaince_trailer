'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Edit, Trash2, Truck, Star } from 'lucide-react'
import { NhaCungCap } from '@/types/database'

interface SupplierTableProps {
  data: NhaCungCap[]
  onEdit: (supplier: NhaCungCap) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function SupplierTable({ data, onEdit, onDelete, onAdd }: SupplierTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(supplier => 
    supplier.ten_ncc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.nhom_cung_cap && supplier.nhom_cung_cap.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Tìm tên hoặc nhóm cung cấp..." 
            className="pl-9 bg-slate-800/50 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          Thêm Nhà cung cấp
        </Button>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Tên nhà cung cấp</TableHead>
              <TableHead className="text-slate-400">Nhóm / Ngành hàng</TableHead>
              <TableHead className="text-slate-400">Liên hệ</TableHead>
              <TableHead className="text-slate-400">Đánh giá</TableHead>
              <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((supplier) => (
                <TableRow key={supplier.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-500" />
                      {supplier.ten_ncc}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {supplier.nhom_cung_cap || 'Chưa phân loại'}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {supplier.lien_he || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-mono">{supplier.rating}/10</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
                        onClick={() => onEdit(supplier)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => onDelete(supplier.id)}
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
                  Không tìm thấy nhà cung cấp nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
