'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { QuanLyVoXe } from '@/types/database'
import { Loader2, Search, Disc, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssignTireDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Position code shown to user (e.g. "C1 — T.Ngoài") */
  posLabel: string
  /** dbPosition value to write into vi_tri_lap */
  dbPosition: string
  vehicleId: string
  onConfirm: (tire: QuanLyVoXe) => void
  isLoading?: boolean
}

export function AssignTireDialog({
  open,
  onOpenChange,
  posLabel,
  dbPosition,
  vehicleId,
  onConfirm,
  isLoading = false,
}: AssignTireDialogProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<QuanLyVoXe | null>(null)

  // Fetch tires currently in warehouse (id_xe IS NULL)
  const { data: warehouseTires = [], isLoading: isFetching } = useQuery({
    queryKey: ['tires', 'warehouse'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quan_ly_vo_xe')
        .select('*')
        .is('id_xe', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as QuanLyVoXe[]
    },
    enabled: open,
  })

  const filtered = useMemo(() =>
    warehouseTires.filter(t => {
      const matchSearch = t.id_vo.toLowerCase().includes(search.toLowerCase())
      // Trạng thái khả dụng: Chưa lắp, Chờ đắp (tương thích ngược) hoặc trống
      const isUsableStatus = t.trang_thai_vo === 'Chưa lắp' || t.trang_thai_vo === 'Chờ đắp' || !t.trang_thai_vo
      // Điều kiện độ sâu gai lốp: lốp mới nhập bãi hoặc lốp cũ còn tốt (> 3 mm)
      const isGoodCondition = (t.tinh_trang_gai || 0) > 3
      return matchSearch && isUsableStatus && isGoodCondition
    }),
    [warehouseTires, search]
  )

  const getTreadColor = (depth: number | null) => {
    const pct = Math.round(((depth || 0) / 16) * 100)
    if (pct < 40) return 'text-red-400'
    if (pct <= 70) return 'text-amber-400'
    return 'text-green-400'
  }

  const handleConfirm = () => {
    if (!selected) return
    onConfirm(selected)
    setSelected(null)
    setSearch('')
  }

  const handleClose = (v: boolean) => {
    if (!v) { setSelected(null); setSearch('') }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[480px] max-h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-primary" />
            Gắn lốp vào vị trí
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Vị trí: <span className="font-mono font-bold text-primary">{posLabel}</span>
            {' '}trên xe <span className="font-mono font-bold text-slate-200">{vehicleId}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 py-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Tìm Serial Number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-2">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm text-slate-500">Đang tải danh sách kho...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
              <Disc className="w-10 h-10 opacity-20" />
              <p className="text-sm italic">
                {warehouseTires.length === 0
                  ? 'Không có lốp nào trong kho.'
                  : 'Không tìm thấy lốp phù hợp.'}
              </p>
            </div>
          ) : (
            filtered.map(tire => {
              const isSelected = selected?.id_vo === tire.id_vo
              return (
                <button
                  key={tire.id_vo}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : tire)}
                  className={cn(
                    'w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-150 text-left',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                      : 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/60'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                    isSelected ? 'bg-primary/20' : 'bg-slate-700/50'
                  )}>
                    {isSelected
                      ? <CheckCircle2 className="w-5 h-5 text-primary" />
                      : <Disc className="w-5 h-5 text-slate-400" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-sm text-primary truncate">{tire.id_vo}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={cn('text-xs font-semibold', getTreadColor(tire.tinh_trang_gai))}>
                        Gai: {tire.tinh_trang_gai ?? '—'} mm
                      </span>
                      {tire.dot_code && (
                        <span className="text-xs text-cyan-400 font-mono">
                          DOT: {tire.dot_code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <Badge className="shrink-0 bg-slate-700/50 text-slate-300 border-slate-600 text-[11px]">
                    {tire.trang_thai_vo === 'Chờ đắp' ? 'Chưa lắp' : (tire.trang_thai_vo || 'Kho')}
                  </Badge>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between w-full gap-3">
            <p className="text-xs text-slate-500">
              {filtered.length} lốp trong kho
              {selected && <span className="text-primary ml-2">· Đã chọn: <strong className="font-mono">{selected.id_vo}</strong></span>}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => handleClose(false)} className="text-slate-400">
                Hủy
              </Button>
              <Button
                type="button"
                disabled={!selected || isLoading}
                onClick={handleConfirm}
                className="min-w-[110px]"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang gắn...</>
                ) : (
                  '✓ Gắn lốp'
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
