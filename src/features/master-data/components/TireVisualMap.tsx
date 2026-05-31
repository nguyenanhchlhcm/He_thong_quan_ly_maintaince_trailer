'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { QuanLyVoXe } from '@/types/database'
import { toast } from 'sonner'
import { Loader2, RefreshCw, X, ArrowLeftRight, ArrowLeft } from 'lucide-react'
import { TireDetailDialog, TireDetail } from './TireDetailDialog'
import { AssignTireDialog } from './AssignTireDialog'
import { ShiftHandoverModal } from './ShiftHandoverModal'

// ─── Types ──────────────────────────────────────────────
type VehicleType = 'tractor' | 'trailer'

interface SlotConfig {
  posCode: string     // Visual position code: A, B, C1, MA1, etc.
  dbPosition: string  // Database vi_tri_lap value (Vietnamese)
  label: string       // Sub-label: Trái, Phải, T.Ngoài, etc.
}

interface AxleConfig {
  axleLabel: string
  layout: 'single' | 'dual'
  slots: SlotConfig[]
}

interface TireSlotProps {
  tire?: QuanLyVoXe | null
  posCode: string
  label: string
  onClick?: () => void
  isHighlighted?: boolean
  isClickable?: boolean
  isInspectionMode?: boolean
  onTreadChange?: (id_vo: string, mm: number) => void
  statusFilter?: 'all' | 'warning' | 'critical'
}

interface AxleProps {
  axle: AxleConfig
  tires: QuanLyVoXe[]
  onSlotClick: (posCode: string, dbPosition: string, tire: QuanLyVoXe | null, label: string) => void
  highlightedPos?: string | null
  isRotationMode?: boolean
  isInspectionMode?: boolean
  onTreadChange?: (id_vo: string, mm: number) => void
  statusFilter?: 'all' | 'warning' | 'critical'
}

interface TireVisualMapProps {
  vehicleId: string
  vehicleType: VehicleType
}

// ─── Position Schema (Array Matrix) ────────────────────
// Tractor: 10 bánh (3 trục)
const TRACTOR_AXLES: AxleConfig[] = [
  {
    axleLabel: 'Trục 1 — Lái',
    layout: 'single',
    slots: [
      { posCode: 'A',  dbPosition: 'Trước trái',       label: 'Trái'    },
      { posCode: 'B',  dbPosition: 'Trước phải',       label: 'Phải'    },
    ],
  },
  {
    axleLabel: 'Trục 2 — Dẫn động',
    layout: 'dual',
    slots: [
      { posCode: 'C1', dbPosition: 'Giữa trái ngoài',  label: 'T.Ngoài' },
      { posCode: 'C2', dbPosition: 'Giữa trái trong',   label: 'T.Trong' },
      { posCode: 'D2', dbPosition: 'Giữa phải trong',   label: 'P.Trong' },
      { posCode: 'D1', dbPosition: 'Giữa phải ngoài',  label: 'P.Ngoài' },
    ],
  },
  {
    axleLabel: 'Trục 3 — Dẫn động',
    layout: 'dual',
    slots: [
      { posCode: 'E1', dbPosition: 'Sau trái ngoài',    label: 'T.Ngoài' },
      { posCode: 'E2', dbPosition: 'Sau trái trong',     label: 'T.Trong' },
      { posCode: 'F2', dbPosition: 'Sau phải trong',     label: 'P.Trong' },
      { posCode: 'F1', dbPosition: 'Sau phải ngoài',    label: 'P.Ngoài' },
    ],
  },
]

// Trailer: 12 bánh (3 trục) — tiền tố "M"
const TRAILER_AXLES: AxleConfig[] = [
  {
    axleLabel: 'Trục 1 — Moóc',
    layout: 'dual',
    slots: [
      { posCode: 'MA1', dbPosition: 'Trục 1 trái ngoài', label: 'T.Ngoài' },
      { posCode: 'MA2', dbPosition: 'Trục 1 trái trong',  label: 'T.Trong' },
      { posCode: 'MB2', dbPosition: 'Trục 1 phải trong',  label: 'P.Trong' },
      { posCode: 'MB1', dbPosition: 'Trục 1 phải ngoài', label: 'P.Ngoài' },
    ],
  },
  {
    axleLabel: 'Trục 2 — Moóc',
    layout: 'dual',
    slots: [
      { posCode: 'MC1', dbPosition: 'Trục 2 trái ngoài', label: 'T.Ngoài' },
      { posCode: 'MC2', dbPosition: 'Trục 2 trái trong',  label: 'T.Trong' },
      { posCode: 'MD2', dbPosition: 'Trục 2 phải trong',  label: 'P.Trong' },
      { posCode: 'MD1', dbPosition: 'Trục 2 phải ngoài', label: 'P.Ngoài' },
    ],
  },
  {
    axleLabel: 'Trục 3 — Moóc',
    layout: 'dual',
    slots: [
      { posCode: 'ME1', dbPosition: 'Trục 3 trái ngoài', label: 'T.Ngoài' },
      { posCode: 'ME2', dbPosition: 'Trục 3 trái trong',  label: 'T.Trong' },
      { posCode: 'MF2', dbPosition: 'Trục 3 phải trong',  label: 'P.Trong' },
      { posCode: 'MF1', dbPosition: 'Trục 3 phải ngoài', label: 'P.Ngoài' },
    ],
  },
]

// ─── Helpers ────────────────────────────────────────────
function formatShortSerial(serial: string) {
  if (!serial) return ''
  if (serial.length <= 8) return serial
  return `..${serial.slice(-6)}`
}

function getTreadDepthPercent(depth: number | null) {
  const maxDepth = 16
  const val = depth || 0
  return Math.min(100, Math.max(0, Math.round((val / maxDepth) * 100)))
}

function getTireStatus(depth: number | null): {
  percent: number
  colorClass: string
  needsReplacement: boolean
} {
  const gai_goc = 16.0
  const gai_hien_tai = depth || 0
  const percent = Math.round((gai_hien_tai / gai_goc) * 100)
  
  const needsReplacement = percent < 40 || gai_hien_tai <= 4
  
  let colorClass = 'border-2 border-green-500 hover:border-green-400'
  if (needsReplacement) {
    colorClass = 'border-2 border-red-500 hover:border-red-400'
  } else if (percent >= 40 && percent <= 70) {
    colorClass = 'border-2 border-yellow-500 hover:border-yellow-450'
  }
  
  return { percent, colorClass, needsReplacement }
}

// ─── Sub-components ─────────────────────────────────────

function TireSlot({
  tire,
  posCode,
  label,
  onClick,
  isHighlighted,
  isClickable,
  isInspectionMode,
  onTreadChange,
  statusFilter
}: TireSlotProps) {
  const hasTire = !!tire
  const status = getTireStatus(hasTire ? tire.tinh_trang_gai : null)

  // Calculate opacity class based on status filter
  let opacityClass = ''
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'warning') {
      const isYellow = hasTire && !status.needsReplacement && (status.percent >= 40 && status.percent <= 70)
      if (!isYellow) {
        opacityClass = 'opacity-20 transition-all duration-300 pointer-events-none'
      }
    } else if (statusFilter === 'critical') {
      const isRed = hasTire && status.needsReplacement
      if (!isRed) {
        opacityClass = 'opacity-20 transition-all duration-300 pointer-events-none'
      }
    }
  }

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      aria-label={hasTire ? `Lốp ${tire.id_vo} – Vị trí ${posCode}` : `Vị trí trống ${posCode}`}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-[72px] h-[100px] rounded-lg',
        'text-xs font-medium transition-all duration-200 select-none touch-manipulation',
        isClickable && 'active:scale-95 cursor-pointer',
        hasTire
          ? [
              'bg-gradient-to-b from-slate-700/80 to-slate-800/90',
              status.colorClass,
              'shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]',
              isClickable && 'hover:shadow-primary/10',
            ]
          : [
              'border border-dashed border-slate-600/40',
              'bg-slate-800/20',
              !isClickable && 'opacity-60',
            ],
        isHighlighted && [
          'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950 scale-105',
          'shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse',
        ],
        opacityClass
      )}
    >
      {hasTire ? (
        <>
          {/* Green activity dot */}
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
          {/* Position code — RED, prominent */}
          <span className="text-[15px] font-black text-red-500 leading-none tracking-wider mt-1">
            {posCode}
          </span>
          {/* Sub-label — gray */}
          <span className="text-[9px] text-slate-400/70 mt-0.5">{label}</span>
          
          {isInspectionMode ? (
            <div className="mt-1 z-10" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                defaultValue={tire.tinh_trang_gai || 0}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && onTreadChange) {
                    onTreadChange(tire.id_vo, val)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseFloat((e.target as HTMLInputElement).value)
                    if (!isNaN(val) && onTreadChange) {
                      onTreadChange(tire.id_vo, val)
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }
                }}
                className="w-12 h-6 text-center text-xs font-bold text-slate-900 bg-white rounded border border-slate-350 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ) : (
            <>
              {/* Tread depth (mm) */}
              <span className="text-[10px] font-bold text-slate-200 mt-1">
                {tire.tinh_trang_gai != null ? `${tire.tinh_trang_gai} mm` : '—'}
              </span>
              {/* Shortened Serial number */}
              <span className="text-[9px] font-medium text-slate-400 font-mono tracking-tighter mt-0.5 max-w-[64px] truncate">
                {formatShortSerial(tire.id_vo)}
              </span>
              {/* Blinking Cần Thay label if needed */}
              {status.needsReplacement && (
                <span className="absolute bottom-1 text-[8px] bg-red-600 text-white font-extrabold px-1 rounded animate-pulse uppercase tracking-tight scale-90">
                  Cần Thay
                </span>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {/* Position code — RED, even when empty */}
          <span className="text-[15px] font-black text-red-500/50 leading-none tracking-wider">
            {posCode}
          </span>
          {/* Sub-label */}
          <span className="text-[9px] text-slate-500/50 mt-0.5">{label}</span>
          {/* Empty indicator */}
          <span className="text-[10px] text-slate-500/70 font-bold mt-1">+ Trống</span>
        </>
      )}
    </button>
  )
}

function Axle({
  axle,
  tires,
  onSlotClick,
  highlightedPos,
  isRotationMode,
  isInspectionMode,
  onTreadChange,
  statusFilter
}: AxleProps) {
  const { axleLabel, layout, slots } = axle

  const findTire = (dbPos: string) => tires.find(t => t.vi_tri_lap === dbPos) || null

  if (layout === 'single') {
    return (
      <div className="flex flex-col items-center gap-2 animate-slide-up">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {axleLabel}
        </span>
        <div className="flex items-center gap-0">
          {/* Left */}
          {(() => {
            const s = slots[0]
            const t = findTire(s.dbPosition)
            return (
              <TireSlot
                tire={t}
                posCode={s.posCode}
                label={s.label}
                onClick={() => onSlotClick(s.posCode, s.dbPosition, t, s.label)}
                isHighlighted={highlightedPos === s.dbPosition}
                isClickable={isRotationMode || !!t || true}
                isInspectionMode={isInspectionMode}
                onTreadChange={onTreadChange}
                statusFilter={statusFilter}
              />
            )
          })()}
          {/* Chassis spine */}
          <div className="w-16 h-1 bg-gradient-to-r from-slate-600/60 via-slate-500/40 to-slate-600/60 rounded-full mx-1" />
          {/* Right */}
          {(() => {
            const s = slots[1]
            const t = findTire(s.dbPosition)
            return (
              <TireSlot
                tire={t}
                posCode={s.posCode}
                label={s.label}
                onClick={() => onSlotClick(s.posCode, s.dbPosition, t, s.label)}
                isHighlighted={highlightedPos === s.dbPosition}
                isClickable={isRotationMode || !!t || true}
                isInspectionMode={isInspectionMode}
                onTreadChange={onTreadChange}
                statusFilter={statusFilter}
              />
            )
          })()}
        </div>
      </div>
    )
  }

  // Dual layout: [0] [1] ── [2] [3]
  const leftSlots = slots.slice(0, 2)
  const rightSlots = slots.slice(2, 4)

  return (
    <div className="flex flex-col items-center gap-2 animate-slide-up">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {axleLabel}
      </span>
      <div className="flex items-center gap-0">
        {/* Left pair */}
        <div className="flex gap-0.5">
          {leftSlots.map(s => {
            const t = findTire(s.dbPosition)
            return (
              <TireSlot
                key={s.posCode}
                tire={t}
                posCode={s.posCode}
                label={s.label}
                onClick={() => onSlotClick(s.posCode, s.dbPosition, t, s.label)}
                isHighlighted={highlightedPos === s.dbPosition}
                isClickable={isRotationMode || !!t || true}
                isInspectionMode={isInspectionMode}
                onTreadChange={onTreadChange}
                statusFilter={statusFilter}
              />
            )
          })}
        </div>
        {/* Chassis spine */}
        <div className="w-6 h-1 bg-gradient-to-r from-slate-600/60 via-slate-500/40 to-slate-600/60 rounded-full mx-1" />
        {/* Right pair */}
        <div className="flex gap-0.5">
          {rightSlots.map(s => {
            const t = findTire(s.dbPosition)
            return (
              <TireSlot
                key={s.posCode}
                tire={t}
                posCode={s.posCode}
                label={s.label}
                onClick={() => onSlotClick(s.posCode, s.dbPosition, t, s.label)}
                isHighlighted={highlightedPos === s.dbPosition}
                isClickable={isRotationMode || !!t || true}
                isInspectionMode={isInspectionMode}
                onTreadChange={onTreadChange}
                statusFilter={statusFilter}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ChassisDivider() {
  return (
    <div className="flex justify-center">
      <div className="w-0.5 h-8 bg-gradient-to-b from-slate-600/40 via-slate-500/30 to-slate-600/40 rounded-full" />
    </div>
  )
}

function VehicleHeader({ type, vehicleId }: { type: VehicleType; vehicleId: string }) {
  const isTractor = type === 'tractor'

  return (
    <div className="flex flex-col items-center gap-1 mb-4">
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2 rounded-xl',
          'bg-gradient-to-r',
          isTractor
            ? 'from-blue-500/15 to-cyan-500/15 border border-blue-500/20'
            : 'from-amber-500/15 to-orange-500/15 border border-amber-500/20'
        )}
      >
        <span
          className={cn(
            'text-sm font-bold tracking-wide',
            isTractor ? 'text-blue-400' : 'text-amber-400'
          )}
        >
          {isTractor ? 'ĐẦU KÉO' : 'RƠ-MOÓC'} — {vehicleId || 'Chưa chọn xe'}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground/50 tracking-wider uppercase">
        {isTractor ? '3 Trục · 2 Đơn + 8 Kép' : '3 Trục · 12 Kép'}
      </span>
    </div>
  )
}

function DirectionArrow() {
  return (
    <div className="flex flex-col items-center gap-1 mb-3">
      <svg className="w-4 h-4 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
      </svg>
      <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/30 font-semibold">
        Hướng di chuyển
      </span>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────

export function TireVisualMap({ vehicleId, vehicleType }: TireVisualMapProps) {
  const queryClient = useQueryClient()
  const isTractor = vehicleType === 'tractor'

  // Dialog & Rotation State
  const [selectedTire, setSelectedTire] = useState<QuanLyVoXe | null>(null)
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Assign tire to empty slot state
  const [assignSlot, setAssignSlot] = useState<{ posCode: string; dbPosition: string; label: string } | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)

  // State Mutex for tire rotation
  const [rotationState, setRotationState] = useState<{
    firstTire: QuanLyVoXe
    firstPos: string
    firstLabel: string
  } | null>(null)

  // Toolbar and filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'warning' | 'critical'>('all')
  const [isInspectionMode, setIsInspectionMode] = useState<boolean>(false)

  // Update Tread Depth Mutation (Inspection Mode)
  const updateTreadMutation = useMutation({
    mutationFn: async ({ id_vo, mm }: { id_vo: string; mm: number }) => {
      const { error } = await supabase
        .from('quan_ly_vo_xe')
        .update({ tinh_trang_gai: mm })
        .eq('id_vo', id_vo)
      if (error) throw error
      return { id_vo, mm }
    },
    onSuccess: () => {
      toast.success('Cập nhật độ gai lốp thành công!')
      queryClient.invalidateQueries({ queryKey: ['tires', 'vehicle', vehicleId] })
    },
    onError: (err: any) => {
      toast.error('Lỗi cập nhật độ gai: ' + err.message)
    }
  })

  const handleExportPDF = () => {
    toast.success(`Đang xuất hồ sơ lốp cho xe ${vehicleId}... Bản tải xuống PDF đang được khởi tạo!`)
  }

  // Fetch real tires
  const { data: tires = [], isLoading, refetch } = useQuery({
    queryKey: ['tires', 'vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return []
      const { data, error } = await supabase
        .from('quan_ly_vo_xe')
        .select('*')
        .eq('id_xe', vehicleId)
      if (error) throw error
      return data as QuanLyVoXe[]
    },
    enabled: !!vehicleId,
  })

  // Swap Rotation Mutation
  const rotateMutation = useMutation({
    mutationFn: async ({
      tireA,
      tireB,
      posA,
      posB,
    }: {
      tireA: QuanLyVoXe
      tireB: QuanLyVoXe | null
      posA: string
      posB: string
    }) => {
      const response = await fetch('/api/tires/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, tireA, tireB, posA, posB }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Lỗi từ server')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Đảo vị trí lốp xe thành công!')
      queryClient.invalidateQueries({ queryKey: ['tires', 'vehicle', vehicleId] })
      setRotationState(null)
    },
    onError: (err: any) => {
      toast.error('Lỗi khi thực hiện đảo lốp: ' + err.message)
    },
  })

  // Assign tire from warehouse to an empty slot
  const assignMutation = useMutation({
    mutationFn: async ({ tire, dbPosition }: { tire: QuanLyVoXe; dbPosition: string }) => {
      const response = await fetch('/api/tires/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          tireId: tire.id_vo,
          dbPosition,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Lỗi không xác định khi gọi API')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Gắn lốp vào xe thành công!')
      queryClient.invalidateQueries({ queryKey: ['tires', 'vehicle', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['tires', 'warehouse'] })
      setIsAssignDialogOpen(false)
      setAssignSlot(null)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi không xác định khi gắn lốp')
    },
  })

  const handleRotateRequest = (tire: QuanLyVoXe, pos: string, label: string) => {
    setRotationState({ firstTire: tire, firstPos: pos, firstLabel: label })
    setIsDialogOpen(false)
    toast.info(`Đã chọn lốp thứ nhất: ${tire.id_vo} (${label}). Vui lòng chọn vị trí tiếp theo.`)
  }

  const handleSlotClick = (posCode: string, dbPosition: string, tire: QuanLyVoXe | null, label: string) => {
    if (rotationState) {
      if (rotationState.firstPos === dbPosition) {
        toast.warning('Vui lòng chọn một vị trí khác vị trí hiện tại.')
        return
      }

      rotateMutation.mutate({
        tireA: rotationState.firstTire,
        tireB: tire,
        posA: rotationState.firstPos,
        posB: dbPosition,
      })
    } else {
      if (tire) {
        setSelectedTire(tire)
        setSelectedSlotLabel(`${posCode} — ${label}`)
        setIsDialogOpen(true)
      } else {
        // Open assign dialog to pick a tire from warehouse
        setAssignSlot({ posCode, dbPosition, label })
        setIsAssignDialogOpen(true)
      }
    }
  }

  const axles = isTractor ? TRACTOR_AXLES : TRAILER_AXLES

  const router = useRouter()

  return (
    <div className="w-full max-w-sm mx-auto px-2 py-6 select-none space-y-4">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/master-data')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-white tracking-wide truncate">
          SƠ ĐỒ LỐP — XE {vehicleId || 'Chưa chọn'}
        </h1>
        {/* Spacer to balance the back button */}
        <div className="w-[88px]" />
      </div>

      {/* Rotation Status Banner */}
      {rotationState && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 animate-in fade-in zoom-in duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="flex items-center gap-2">
            {rotateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowLeftRight className="w-4 h-4 animate-pulse" />
            )}
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider block text-[10px] text-emerald-500">Đảo lốp đang chạy</span>
              Đang chọn bánh thứ 2 để đảo cho lốp <span className="font-mono font-bold text-white">{rotationState.firstTire.id_vo}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRotationState(null)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
            title="Hủy bỏ đảo lốp"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <VehicleHeader type={vehicleType} vehicleId={vehicleId} />
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
          title="Tải lại sơ đồ"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Premium Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-white/[0.05] rounded-2xl mb-2 text-xs">
        {/* Left Side: Filter Tab Group */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/[0.04] space-x-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all text-[11px]",
              statusFilter === 'all'
                ? "bg-slate-800 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('warning')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] flex items-center gap-1",
              statusFilter === 'warning'
                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Cần Đảo 🟡
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('critical')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] flex items-center gap-1",
              statusFilter === 'critical'
                ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Khẩn Cấp 🔴
          </button>
        </div>

        {/* Center Side: Quick Inspection Switch */}
        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={isInspectionMode}
              onChange={() => setIsInspectionMode(!isInspectionMode)}
              className="sr-only"
            />
            <div className={cn(
              "w-8 h-4.5 rounded-full transition-colors duration-300",
              isInspectionMode ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]" : "bg-slate-800"
            )} />
            <div className={cn(
              "absolute left-0.5 top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform duration-300 shadow",
              isInspectionMode ? "transform translate-x-3.5" : ""
            )} />
          </div>
          <span className="text-[11px] font-semibold text-slate-300">
            Đo nhanh
          </span>
        </label>

        {/* Odometer Shift Handover Button */}
        <button
          type="button"
          onClick={() => setIsShiftModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-400 hover:text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          📝 Chốt ca / Odometer
        </button>

        {/* Right Side: Export Vehicle Profile Button */}
        <button
          type="button"
          onClick={handleExportPDF}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700/50 bg-slate-800/40 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Xuất Hồ Sơ
        </button>
      </div>

      {/* Direction indicator */}
      <DirectionArrow />

      {/* Axle diagram */}
      <div
        className={cn(
          'relative flex flex-col items-center gap-0',
          'p-4 rounded-2xl',
          'bg-slate-900/50 border border-white/[0.06]',
          'shadow-[0_4px_24px_rgba(0,0,0,0.2)]',
          isLoading && 'opacity-60 pointer-events-none'
        )}
      >
        {/* Left / Right labels */}
        <div className="absolute top-3 left-3 text-[9px] font-bold tracking-[0.15em] uppercase text-muted-foreground/30">
          Trái
        </div>
        <div className="absolute top-3 right-3 text-[9px] font-bold tracking-[0.15em] uppercase text-muted-foreground/30">
          Phải
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs text-slate-500">Đang đồng bộ dữ liệu...</span>
          </div>
        ) : (
          axles.map((axle, index) => (
            <div key={axle.axleLabel} className="w-full">
              <Axle
                axle={axle}
                tires={tires}
                onSlotClick={handleSlotClick}
                highlightedPos={rotationState?.firstPos}
                isRotationMode={!!rotationState}
                isInspectionMode={isInspectionMode}
                onTreadChange={(id_vo, mm) => updateTreadMutation.mutate({ id_vo, mm })}
                statusFilter={statusFilter}
              />
              {index < axles.length - 1 && <ChassisDivider />}
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          <span className="text-[10px] text-muted-foreground/60">Gai &gt; 70%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
          <span className="text-[10px] text-muted-foreground/60">Gai 40% - 70%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)] animate-pulse" />
          <span className="text-[10px] text-muted-foreground/60">Cần Thay (&lt; 40% / ≤ 4mm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded border border-dashed border-slate-500/50 bg-slate-800/30" />
          <span className="text-[10px] text-muted-foreground/60">Trống</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-red-500">A</span>
          <span className="text-[10px] text-muted-foreground/60">Mã vị trí</span>
        </div>
      </div>

      {/* Tire Detail Dialog */}
      <TireDetailDialog
        tire={selectedTire ? {
          id_vo: selectedTire.id_vo,
          brand: 'Michelin',
          tread_depth_mm: selectedTire.tinh_trang_gai || 0,
          tread_depth_percent: getTreadDepthPercent(selectedTire.tinh_trang_gai),
          position_label: selectedSlotLabel,
          serial_photo_url: selectedTire.serial_photo_url || `https://placehold.co/400x300/1e293b/94a3b8?text=Serial+${selectedTire.id_vo}`,
          tread_condition_photo_url: selectedTire.tread_condition_photo_url || `https://placehold.co/400x300/1e293b/22c55e?text=Gai+${selectedTire.tinh_trang_gai}mm`
        } : null}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onRotateRequest={() => {
          if (selectedTire) {
            handleRotateRequest(selectedTire, selectedTire.vi_tri_lap || '', selectedSlotLabel)
          }
        }}
      />

      {/* Assign tire from warehouse dialog */}
      <AssignTireDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        posLabel={assignSlot ? `${assignSlot.posCode} — ${assignSlot.label}` : ''}
        dbPosition={assignSlot?.dbPosition || ''}
        vehicleId={vehicleId}
        isLoading={assignMutation.isPending}
        onConfirm={(tire) => {
          if (!assignSlot) return
          assignMutation.mutate({ tire, dbPosition: assignSlot.dbPosition })
        }}
      />

      {/* Shift handover / Odometer logger dialog */}
      <ShiftHandoverModal
        open={isShiftModalOpen}
        onOpenChange={setIsShiftModalOpen}
        initialVehicleId={vehicleId}
        initialVehicleType={vehicleType}
      />
    </div>
  )
}
