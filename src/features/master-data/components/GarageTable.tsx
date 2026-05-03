'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Edit, Trash2, MapPin } from 'lucide-react'
import { Gara } from '@/types/database'

interface GarageTableProps {
  data: Gara[]
  onEdit: (gara: Gara) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function GarageTable({ data, onEdit, onDelete, onAdd }: GarageTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(gara => 
    gara.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Tìm tên Gara..." 
            className="pl-9 bg-slate-800/50 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          Thêm Gara
        </Button>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Tên Gara</TableHead>
              <TableHead className="text-slate-400">Địa chỉ</TableHead>
              <TableHead className="text-slate-400">Tọa độ GPS</TableHead>
              <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((gara) => (
                <TableRow key={gara.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-semibold">{gara.name}</TableCell>
                  <TableCell className="text-slate-400 text-sm max-w-xs truncate">{gara.address || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3 h-3" />
                      {gara.lat && gara.lng ? `${gara.lat.toFixed(4)}, ${gara.lng.toFixed(4)}` : 'Chưa thiết lập'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
                        onClick={() => onEdit(gara)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => onDelete(gara.id)}
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
                  Không tìm thấy Gara nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
