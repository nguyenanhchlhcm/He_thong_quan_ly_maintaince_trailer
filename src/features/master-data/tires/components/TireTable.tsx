'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Truck, Disc, Trash2, History } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { QuanLyVoXe } from '@/types/database'
import { TireHistoryDialog } from './TireHistoryDialog'

interface TireTableProps {
  data: QuanLyVoXe[]
  onEdit: (tire: QuanLyVoXe) => void
  onDelete: (id: string) => void
  onAdd: () => void
  onRefresh: () => void
}

export function TireTable({ data, onEdit, onDelete, onAdd, onRefresh }: TireTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')


  const filteredData = data.filter(tire => 
    tire.id_vo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tire.id_xe && tire.id_xe.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang chạy': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'Chưa lắp': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'Thanh lý': return 'bg-red-500/10 text-red-500 border-red-500/20'
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
  }

  const [historyTireId, setHistoryTireId] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Tìm theo Serial Number (ID lốp)..." 
            className="pl-9 bg-slate-800 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={onAdd} className="gap-2 bg-primary hover:bg-primary/90 font-bold">
          <Plus className="w-4 h-4" />
          Nhập kho lốp mới
        </Button>
      </div>

      <div className="border border-slate-800 rounded-lg">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800">
              <TableHead className="text-slate-400">Serial Number</TableHead>
              <TableHead className="text-slate-400">Xe đang gắn</TableHead>
              <TableHead className="text-slate-400">Vị trí lắp</TableHead>
              <TableHead className="text-slate-400">Độ sâu gai</TableHead>
              <TableHead className="text-slate-400">Mã DOT</TableHead>
              <TableHead className="text-slate-400">Trạng thái</TableHead>
              <TableHead className="text-right text-slate-400">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((tire) => (
                <TableRow key={tire.id_vo} className="border-slate-800 hover:bg-slate-800/30">
                  <TableCell className="font-mono font-bold text-primary">{tire.id_vo}</TableCell>
                  <TableCell className="font-medium text-slate-300">{tire.id_xe || 'Trong kho'}</TableCell>
                  <TableCell className="text-slate-400">{tire.vi_tri_lap || 'N/A'}</TableCell>
                  <TableCell className="font-mono">{tire.tinh_trang_gai} mm</TableCell>
                  <TableCell>
                    {tire.dot_code ? (
                      <span
                        className="font-mono text-sm text-cyan-400 tracking-widest"
                        title={`Tuần ${tire.dot_code.slice(0, 2)} / Năm 20${tire.dot_code.slice(2)}`}
                      >
                        {tire.dot_code}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(tire.trang_thai_vo || '')}>
                      {tire.trang_thai_vo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Lịch sử điều chuyển"
                        onClick={() => { setHistoryTireId(tire.id_vo); setIsHistoryOpen(true); }}
                        className="text-slate-400 hover:text-primary hover:bg-primary/10"
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Xem sơ đồ / Đảo lốp"
                        onClick={() => {
                          if (tire.id_xe) {
                            const isTrailer = (tire as any).vehicles?.model === 'Rơ-moóc' || (tire as any).loai_xe === 'Rơ-moóc'
                            const vehicleType = isTrailer ? 'trailer' : 'tractor'
                            router.push(`/admin/master-data/tires?id=${tire.id_xe}&type=${vehicleType}`)
                          } else {
                            toast.info('Lốp này đang trong kho. Vui lòng vào sơ đồ của một xe cụ thể để gắn lốp.')
                          }
                        }}
                        className="text-slate-400 hover:text-green-500 hover:bg-green-500/10"
                      >
                        <Truck className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Sửa thông tin"
                        onClick={() => onEdit(tire)}
                        className="text-slate-400 hover:text-blue-500 hover:bg-blue-500/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Xóa lốp"
                        onClick={() => onDelete(tire.id_vo)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500 italic">
                  Không tìm thấy lốp nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TireHistoryDialog 
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        tireId={historyTireId}
      />
    </div>
  )
}
