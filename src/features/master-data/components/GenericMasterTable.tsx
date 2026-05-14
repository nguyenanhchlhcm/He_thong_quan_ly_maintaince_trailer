'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  header: string
  key: keyof T | string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface GenericMasterTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onEdit: (item: T) => void
  onDelete: (id: string) => void
  onAdd: () => void
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
}

export function GenericMasterTable<T extends { id: string }>({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  onAdd,
  searchPlaceholder = 'Tìm kiếm...',
  searchKeys = []
}: GenericMasterTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(item => {
    if (!searchTerm) return true
    
    // Default search in all string fields if searchKeys not provided
    const keysToSearch = searchKeys.length > 0 ? searchKeys : Object.keys(item) as (keyof T)[]
    
    return keysToSearch.some(key => {
      const value = item[key]
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase())
      }
      return false
    })
  })

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder={searchPlaceholder} 
            className="pl-9 bg-slate-800/50 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2 w-full sm:w-auto shadow-lg shadow-primary/20" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          Thêm mới
        </Button>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/80">
              <TableRow className="border-slate-800 hover:bg-transparent">
                {columns.map((col, idx) => (
                  <TableHead key={idx} className={cn("text-slate-400 font-semibold", col.className)}>
                    {col.header}
                  </TableHead>
                ))}
                <TableHead className="text-slate-400 font-semibold text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                    {columns.map((col, idx) => (
                      <TableCell key={idx} className={cn("text-slate-300", col.className)}>
                        {col.render ? col.render(item) : (item[col.key as keyof T] as React.ReactNode)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
                          onClick={() => onEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => onDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="h-32 text-center text-slate-500 italic">
                    Không tìm thấy dữ liệu nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
