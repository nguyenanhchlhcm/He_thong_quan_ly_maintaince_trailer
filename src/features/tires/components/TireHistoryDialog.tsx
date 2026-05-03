'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { Loader2, History, ArrowRight, Truck, MapPin, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TireHistory {
  id: string
  id_vo: string
  id_xe_cu: string | null
  id_xe_moi: string | null
  vi_tri_cu: string | null
  vi_tri_moi: string | null
  hanh_dong: string
  created_at: string
}

interface TireHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tireId: string | null
}

export function TireHistoryDialog({ open, onOpenChange, tireId }: TireHistoryDialogProps) {
  const [history, setHistory] = useState<TireHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && tireId) {
      fetchHistory()
    }
  }, [open, tireId])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tire_history')
        .select('*')
        .eq('id_vo', tireId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error('Error fetching tire history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Lịch sử lốp: {tireId}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Truy xuất toàn bộ lộ trình điều chuyển của chiếc lốp này.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-slate-500">Đang truy xuất dữ liệu...</p>
            </div>
          ) : history.length > 0 ? (
            <div className="relative border-l-2 border-slate-800 ml-4 pl-8 space-y-8">
              {history.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[41px] mt-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-primary" />
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {event.hanh_dong}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.created_at).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 space-y-3">
                      {/* Vehicle Change */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex flex-col items-center gap-1 min-w-[80px]">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Từ xe</span>
                          <span className="font-mono text-slate-300">{event.id_xe_cu || 'Kho'}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600" />
                        <div className="flex flex-col items-center gap-1 min-w-[80px]">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Sang xe</span>
                          <span className="font-mono text-primary font-bold">{event.id_xe_moi || 'Kho'}</span>
                        </div>
                      </div>

                      {/* Position Change */}
                      {(event.vi_tri_cu || event.vi_tri_moi) && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                          <MapPin className="w-3 h-3" />
                          <span>Vị trí: </span>
                          <span className="italic">{event.vi_tri_cu || 'N/A'}</span>
                          <ArrowRight className="w-3 h-3 mx-1" />
                          <span className="font-bold text-slate-200">{event.vi_tri_moi || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500 italic">Chưa có lịch sử điều chuyển cho lốp này.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
