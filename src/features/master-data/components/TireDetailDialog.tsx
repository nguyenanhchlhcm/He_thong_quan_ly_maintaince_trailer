'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────
export interface TireDetail {
  id_vo: string
  brand: string
  tread_depth_mm: number
  tread_depth_percent: number
  position_label: string
  serial_photo_url: string
  tread_condition_photo_url: string
}

interface TireDetailDialogProps {
  tire: TireDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRotateRequest?: () => void
}

// ─── Mock Detail Data (keyed by serial) ─────────────────
export const MOCK_TIRE_DETAILS: Record<string, TireDetail> = {
  'S-10201': {
    id_vo: 'S-10201',
    brand: 'Michelin',
    tread_depth_mm: 12.5,
    tread_depth_percent: 78,
    position_label: 'Trục 1 — Bên Trái',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+S-10201',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+12.5mm',
  },
  'S-10202': {
    id_vo: 'S-10202',
    brand: 'Bridgestone',
    tread_depth_mm: 10.2,
    tread_depth_percent: 64,
    position_label: 'Trục 1 — Bên Phải',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+S-10202',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/eab308?text=Gai+10.2mm',
  },
  'S-20301': {
    id_vo: 'S-20301',
    brand: 'Casumina',
    tread_depth_mm: 8.0,
    tread_depth_percent: 50,
    position_label: 'Trục 2 — Ngoài Bên Trái',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+S-20301',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/f97316?text=Gai+8.0mm',
  },
  'S-20304': {
    id_vo: 'S-20304',
    brand: 'Michelin',
    tread_depth_mm: 14.0,
    tread_depth_percent: 88,
    position_label: 'Trục 2 — Trong Bên Phải',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+S-20304',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+14.0mm',
  },
  'S-20305': {
    id_vo: 'S-20305',
    brand: 'Bridgestone',
    tread_depth_mm: 11.3,
    tread_depth_percent: 71,
    position_label: 'Trục 2 — Ngoài Bên Phải',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+S-20305',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+11.3mm',
  },
  'S-30401': {
    id_vo: 'S-30401',
    brand: 'Casumina',
    tread_depth_mm: 5.2,
    tread_depth_percent: 33,
    position_label: 'Trục 3 — Ngoài Bên Trái',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+S-30401',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/ef4444?text=Gai+5.2mm',
  },
  'S-30402': {
    id_vo: 'S-30402',
    brand: 'Michelin',
    tread_depth_mm: 13.1,
    tread_depth_percent: 82,
    position_label: 'Trục 3 — Trong Bên Trái',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+S-30402',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+13.1mm',
  },
  'S-30404': {
    id_vo: 'S-30404',
    brand: 'Bridgestone',
    tread_depth_mm: 9.8,
    tread_depth_percent: 61,
    position_label: 'Trục 3 — Ngoài Bên Phải',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+S-30404',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/eab308?text=Gai+9.8mm',
  },
  // Trailer tires
  'M-50101': {
    id_vo: 'M-50101',
    brand: 'Michelin',
    tread_depth_mm: 11.0,
    tread_depth_percent: 69,
    position_label: 'Moóc Trục 1 — Ngoài Trái',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+M-50101',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+11.0mm',
  },
  'M-50102': {
    id_vo: 'M-50102',
    brand: 'Casumina',
    tread_depth_mm: 7.5,
    tread_depth_percent: 47,
    position_label: 'Moóc Trục 1 — Trong Trái',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+M-50102',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/f97316?text=Gai+7.5mm',
  },
  'M-50103': {
    id_vo: 'M-50103',
    brand: 'Bridgestone',
    tread_depth_mm: 15.0,
    tread_depth_percent: 94,
    position_label: 'Moóc Trục 1 — Trong Phải',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+M-50103',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+15.0mm',
  },
  'M-60202': {
    id_vo: 'M-60202',
    brand: 'Michelin',
    tread_depth_mm: 10.8,
    tread_depth_percent: 68,
    position_label: 'Moóc Trục 2 — Trong Trái',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+M-60202',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+10.8mm',
  },
  'M-60203': {
    id_vo: 'M-60203',
    brand: 'Casumina',
    tread_depth_mm: 6.3,
    tread_depth_percent: 39,
    position_label: 'Moóc Trục 2 — Trong Phải',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+M-60203',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/ef4444?text=Gai+6.3mm',
  },
  'M-60204': {
    id_vo: 'M-60204',
    brand: 'Bridgestone',
    tread_depth_mm: 12.0,
    tread_depth_percent: 75,
    position_label: 'Moóc Trục 2 — Ngoài Phải',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+M-60204',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+12.0mm',
  },
  'M-70301': {
    id_vo: 'M-70301',
    brand: 'Michelin',
    tread_depth_mm: 14.5,
    tread_depth_percent: 91,
    position_label: 'Moóc Trục 3 — Ngoài Trái',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+M-70301',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+14.5mm',
  },
  'M-70302': {
    id_vo: 'M-70302',
    brand: 'Casumina',
    tread_depth_mm: 9.0,
    tread_depth_percent: 56,
    position_label: 'Moóc Trục 3 — Trong Trái',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+M-70302',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/eab308?text=Gai+9.0mm',
  },
  'M-70303': {
    id_vo: 'M-70303',
    brand: 'Bridgestone',
    tread_depth_mm: 13.7,
    tread_depth_percent: 86,
    position_label: 'Moóc Trục 3 — Trong Phải',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+M-70303',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+13.7mm',
  },
  'M-70304': {
    id_vo: 'M-70304',
    brand: 'Michelin',
    tread_depth_mm: 11.5,
    tread_depth_percent: 72,
    position_label: 'Moóc Trục 3 — Ngoài Phải',
    serial_photo_url: 'https://placehold.co/400x300/1e293b/94a3b8?text=Serial+M-70304',
    tread_condition_photo_url: 'https://placehold.co/400x300/1e293b/22c55e?text=Gai+11.5mm',
  },
}

// ─── Tread health status ─────────────────────────────────
function getTreadStatus(percent: number, mm: number) {
  const needsReplacement = percent < 40 || mm <= 4
  if (needsReplacement) {
    return {
      color: 'text-red-400',
      bg: 'bg-red-500/15 border-red-500/30',
      needsReplacement: true
    }
  }
  if (percent >= 40 && percent <= 70) {
    return {
      color: 'text-amber-400',
      bg: 'bg-amber-500/15 border-amber-500/30',
      needsReplacement: false
    }
  }
  return {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    needsReplacement: false
  }
}

// ─── Positional Code Mapping Helper ──────────────────────
function getPositionCode(dbPosition: string | null | undefined): string {
  if (!dbPosition) return ''
  const mapping: Record<string, string> = {
    // Tractor positions
    'Trước trái': 'A',
    'Trước phải': 'B',
    'Giữa trái ngoài': 'C1',
    'Giữa trái trong': 'C2',
    'Giữa phải trong': 'D2',
    'Giữa phải ngoài': 'D1',
    'Sau trái ngoài': 'E1',
    'Sau trái trong': 'E2',
    'Sau phải trong': 'F2',
    'Sau phải ngoài': 'F1',
    // Trailer positions
    'Trục 1 trái ngoài': 'MA1',
    'Trục 1 trái trong': 'MA2',
    'Trục 1 phải trong': 'MB2',
    'Trục 1 phải ngoài': 'MB1',
    'Trục 2 trái ngoài': 'MC1',
    'Trục 2 trái trong': 'MC2',
    'Trục 2 phải trong': 'MD2',
    'Trục 2 phải ngoài': 'MD1',
    'Trục 3 trái ngoài': 'ME1',
    'Trục 3 trái trong': 'ME2',
    'Trục 3 phải trong': 'MF2',
    'Trục 3 phải ngoài': 'MF1'
  }
  return mapping[dbPosition] || dbPosition
}

// ─── Lightbox (fullscreen image viewer) ─────────────────
function ImageLightbox({ src, alt, open, onClose }: {
  src: string; alt: string; open: boolean; onClose: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[101] flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white active:scale-95 transition-transform"
        aria-label="Đóng ảnh"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[92vw] max-h-[85vh] rounded-xl object-contain shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

// ─── Main Dialog Component ──────────────────────────────
export function TireDetailDialog({ tire, open, onOpenChange, onRotateRequest }: TireDetailDialogProps) {
  const [lightboxSrc, setLightboxSrc] = useState<{ src: string; alt: string } | null>(null)

  // 1. Fetch history records dynamically
  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['tire-history', tire?.id_vo],
    queryFn: async () => {
      if (!tire?.id_vo) return []
      const { data, error } = await supabase
        .from('tire_history')
        .select('*')
        .eq('id_vo', tire.id_vo)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!tire?.id_vo && open,
  })

  if (!tire) return null

  const pct = tire.tread_depth_percent
  const status = getTreadStatus(pct, tire.tread_depth_mm)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="bg-slate-900 border-slate-700/50 text-slate-100 sm:max-w-sm max-h-[90vh] overflow-y-auto"
        >
          {/* Custom large close button — mobile friendly */}
          <DialogClose
            className="absolute top-3 right-3 flex items-center justify-center w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </DialogClose>

          <DialogHeader>
            <DialogTitle className="text-base font-bold pr-14">
              📍 {tire.position_label}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Thông tin chi tiết lốp xe tại vị trí này
            </DialogDescription>
          </DialogHeader>

          {/* ── Info rows ── */}
          <div className="space-y-3 mt-1">
            {/* Serial */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/30">
              <span className="text-xs text-slate-400">Số Serial (id_vo)</span>
              <span className="text-sm font-semibold font-mono tracking-wider">{tire.id_vo}</span>
            </div>

            {/* Brand */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/30">
              <span className="text-xs text-slate-400">Thương hiệu</span>
              <span className="text-sm font-semibold">{tire.brand}</span>
            </div>

            {/* Tread depth */}
            <div className={cn(
              'px-3 py-2.5 rounded-xl border border-slate-700/30 transition-all',
              status.bg
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Độ sâu gai còn lại</span>
                <span className={cn('text-sm font-bold flex items-center gap-1.5', status.color)}>
                  {tire.tread_depth_mm} mm ({pct}%)
                  {status.needsReplacement && (
                    <span className="animate-pulse text-[9px] bg-red-600 text-white font-extrabold px-1 rounded-sm uppercase tracking-tight">
                      Cần Thay
                    </span>
                  )}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Photo evidence ── */}
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Hình ảnh minh chứng
            </span>
            <div className="grid grid-cols-2 gap-2">
              {/* Serial photo */}
              <button
                type="button"
                onClick={() => setLightboxSrc({ src: tire.serial_photo_url, alt: `Serial ${tire.id_vo}` })}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-700/40 bg-slate-800 hover:border-primary/40 active:scale-[0.97] transition-all"
              >
                <img
                  src={tire.serial_photo_url}
                  alt={`Ảnh serial ${tire.id_vo}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-80 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                  </svg>
                </div>
                <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white/80 px-1.5 py-0.5 rounded-md">
                  Serial
                </span>
              </button>

              {/* Tread photo */}
              <button
                type="button"
                onClick={() => setLightboxSrc({ src: tire.tread_condition_photo_url, alt: `Gai lốp ${tire.id_vo}` })}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-700/40 bg-slate-800 hover:border-primary/40 active:scale-[0.97] transition-all"
              >
                <img
                  src={tire.tread_condition_photo_url}
                  alt={`Ảnh gai lốp ${tire.id_vo}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-80 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                  </svg>
                </div>
                <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white/80 px-1.5 py-0.5 rounded-md">
                  Độ gai
                </span>
              </button>
            </div>
          </div>

          {/* ── Timeline Section ── */}
          <div className="mt-5 border-t border-slate-800 pt-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              Lịch sử vận hành
            </span>
            {isHistoryLoading ? (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-slate-500">Đang tải lịch sử...</span>
              </div>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">
                Chưa có lịch sử vận hành cho lốp này.
              </p>
            ) : (
              <div className="relative pl-6 border-l border-slate-800 space-y-4 ml-3">
                {history.map((item: any) => {
                  const action = item.hanh_dong || ''
                  let icon = '⚙️'
                  let iconBg = 'bg-slate-850'
                  
                  if (action.toLowerCase().includes('đảo') || action.toLowerCase().includes('vị trí')) {
                    icon = '🔄'
                    iconBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  } else if (action.toLowerCase().includes('mới') || action.toLowerCase().includes('thay')) {
                    icon = '🆕'
                    iconBg = 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  } else if (action.toLowerCase().includes('gai') || action.toLowerCase().includes('đo')) {
                    icon = '📏'
                    iconBg = 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }

                  return (
                    <div key={item.id} className="relative group">
                      {/* Bullet icon */}
                      <span className={cn(
                        "absolute -left-[37px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full text-xs transition-transform duration-200 group-hover:scale-110",
                        iconBg
                      )}>
                        {icon}
                      </span>
                      {/* Timeline Card */}
                      <div className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800/50 rounded-xl p-2.5 transition-all">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-200">{action}</span>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {new Date(item.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        {/* Detail text */}
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-1.5 items-center">
                          {item.id_xe_cu && (
                            <span>
                              Xe: <span className="font-mono text-slate-300 font-medium">{item.id_xe_cu}</span>
                            </span>
                          )}
                          {item.vi_tri_cu && item.vi_tri_moi && (
                            <>
                              <span className="text-slate-700">•</span>
                              <span>
                                Vị trí: <span className="text-slate-300 font-mono font-bold bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/30 text-[10px]">{getPositionCode(item.vi_tri_cu)}</span>
                                <span className="mx-1 text-slate-500">→</span>
                                <span className="text-slate-300 font-mono font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px]">{getPositionCode(item.vi_tri_moi)}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Footer action ── */}
          <DialogFooter className="mt-2">
            <Button
              type="button"
              className="w-full h-12 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 shadow-[0_0_12px_rgba(52,211,153,0.15)] active:scale-[0.97] transition-all"
              onClick={() => {
                onOpenChange(false)
                if (onRotateRequest) onRotateRequest()
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
              </svg>
              Yêu cầu Đảo Lốp / Điều chuyển
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen lightbox */}
      <ImageLightbox
        src={lightboxSrc?.src || ''}
        alt={lightboxSrc?.alt || ''}
        open={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </>
  )
}
