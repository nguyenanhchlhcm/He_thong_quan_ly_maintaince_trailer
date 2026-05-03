'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ShieldCheck, User as UserIcon, Shield, Plus, Trash2, Edit } from 'lucide-react'
import { Profile } from '@/types/database'

interface UserTableProps {
  data: Profile[]
  onEditRole: (user: Profile) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function UserTable({ data, onEditRole, onDelete, onAdd }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(user => 
    (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': 
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1">
            <ShieldCheck className="w-3 h-3" /> Quản trị viên
          </Badge>
        )
      case 'mechanic': 
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">
            <UserIcon className="w-3 h-3" /> Thợ máy
          </Badge>
        )
      default: 
        return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Người dùng</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Tìm theo tên hoặc email..." 
            className="pl-9 bg-slate-800/50 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          Thêm nhân viên
        </Button>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Nhân viên</TableHead>
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400">Vai trò hệ thống</TableHead>
              <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((user) => (
                <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="font-medium">{user.full_name || 'Chưa đặt tên'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Sửa vai trò"
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
                        onClick={() => onEditRole(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Xóa nhân viên"
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => onDelete(user.id)}
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
                  Không tìm thấy nhân viên nào phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
