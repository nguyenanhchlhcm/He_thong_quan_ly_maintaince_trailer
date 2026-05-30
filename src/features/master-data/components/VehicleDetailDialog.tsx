'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Xe } from '@/types/database'
import { Truck, Disc, Navigation, ShieldAlert, CalendarRange, Landmark } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface VehicleDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Xe | null
}

export function VehicleDetailDialog({ open, onOpenChange, vehicle }: VehicleDetailDialogProps) {
  const router = useRouter()

  if (!vehicle) return null

  // Determine vehicle type for URL parameters
  const getVehicleTypeParam = (model: string | null) => {
    if (model === 'Rơ-moóc') return 'trailer'
    return 'tractor' // Default to tractor for 'Đầu kéo' or 'Xe tải'
  }

  const vehicleTypeParam = getVehicleTypeParam(vehicle.loai_xe)

  const handleGoToTireMap = () => {
    router.push(`/admin/master-data/tires?id=${vehicle.id}&type=${vehicleTypeParam}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[480px] p-6 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header styling with decorative bg */}
        <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />

        <DialogHeader className="relative z-10 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Truck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-wide flex items-center gap-2">
                Thông tin chi tiết xe
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-mono mt-0.5">
                ID: <span className="text-slate-200 font-bold">{vehicle.id}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Detailed Information Grid */}
        <div className="py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Biển số */}
            <div className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:bg-slate-800/60 transition-colors">
              <span className="text-xs text-slate-500 font-medium">BIỂN SỐ XE</span>
              <span className="text-lg font-mono font-black text-primary mt-1 tracking-wider">
                {vehicle.bien_so || vehicle.id}
              </span>
            </div>

            {/* Loại xe */}
            <div className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:bg-slate-800/60 transition-colors">
              <span className="text-xs text-slate-500 font-medium">LOẠI XE</span>
              <div className="mt-2.5">
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-2 py-0.5 text-xs font-semibold">
                  {vehicle.loai_xe || 'Đầu kéo'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Odometer */}
            <div className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Navigation className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium">SỐ KM HIỆN TẠI</span>
              </div>
              <span className="text-base font-mono font-bold text-slate-200 mt-2">
                {vehicle.so_km_hien_tai?.toLocaleString() || '0'} <span className="text-xs font-normal text-slate-400">km</span>
              </span>
            </div>

            {/* Next Maintenance */}
            <div className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-1.5 text-slate-500">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500/80" />
                <span className="text-xs font-medium">BẢO TRÌ TIẾP THEO</span>
              </div>
              <span className="text-base font-mono font-bold text-amber-400 mt-2">
                {vehicle.next_maintenance_km ? `${vehicle.next_maintenance_km.toLocaleString()} km` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Call for Tires diagram */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-slate-800/30 border border-primary/20 flex flex-col items-center text-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Disc className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-200">Sơ đồ bố trí & Quản lý lốp</h4>
            <p className="text-xs text-slate-400 mt-0.5 px-2">
              Xem vị trí hiện tại của các lốp, độ mòn gai, mã DOT, thực hiện đảo lốp hoặc lắp lốp mới từ kho.
            </p>
          </div>
          <Button 
            onClick={handleGoToTireMap} 
            className="w-full mt-1 bg-primary hover:bg-primary/95 text-slate-900 font-bold shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 group py-5"
          >
            Xem sơ đồ lắp lốp 🛞
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Button>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-4 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 w-full sm:w-auto">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
