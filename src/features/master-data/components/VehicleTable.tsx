'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2 } from 'lucide-react'
import { Xe } from '@/types/database'

interface VehicleTableProps {
  data: Xe[]
  onEdit: (xe: Xe) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function VehicleTable({ data, onEdit, onDelete, onAdd }: VehicleTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(xe => 
    xe.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (xe.model && xe.model.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Tìm theo biển số hoặc ID..." 
            className="pl-9 bg-slate-800/50 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          Thêm xe mới
        </Button>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Biển số / ID</TableHead>
              <TableHead className="text-slate-400">Model/Ghi chú</TableHead>
              <TableHead className="text-slate-400">Ngày tạo</TableHead>
              <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((xe) => (
                <TableRow key={xe.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold">
                      {xe.id}
                    </Badge>
                  </TableCell>
                  <TableCell>{xe.model || '-'}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(xe.created_at).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
                        onClick={() => onEdit(xe)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => onDelete(xe.id)}
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
                  Không tìm thấy xe nào phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
