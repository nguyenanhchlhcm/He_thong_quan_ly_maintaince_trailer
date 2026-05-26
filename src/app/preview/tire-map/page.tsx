'use client'

import { useState, useEffect } from 'react'
import { TireVisualMap } from '@/features/master-data/components/TireVisualMap'
import { useVehicles } from '@/hooks/useMasterData'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Truck, HelpCircle, Lock, ArrowRight, UserCheck } from 'lucide-react'

export default function TireMapPreviewPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles()
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [vehicleType, setVehicleType] = useState<'tractor' | 'trailer'>('tractor')

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Automatically select seeded tractor on first load once vehicles are fetched
  useEffect(() => {
    if (vehicles.length > 0) {
      const defaultVeh = vehicles.find(v => v.id === '51C-123.45') || vehicles[0]
      setSelectedVehicleId(defaultVeh.id)
      setVehicleType(defaultVeh.model === 'Rơ-moóc' ? 'trailer' : 'tractor')
    }
  }, [vehicles])

  const handleVehicleChange = (val: string) => {
    setSelectedVehicleId(val)
    const veh = vehicles.find(v => v.id === val)
    if (veh) {
      setVehicleType(veh.model === 'Rơ-moóc' ? 'trailer' : 'tractor')
    }
  }

  // ─── Loading state ──────────────────────────────────────
  if (isAuthenticated === null) {
    return (
      <div className="dark min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <span className="text-sm text-slate-500 uppercase tracking-widest font-bold">Đang kiểm tra kết nối...</span>
        </div>
      </div>
    )
  }

  // ─── Unauthenticated (Show login card) ─────────────────
  if (!isAuthenticated) {
    return (
      <div className="dark min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl text-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-wider text-slate-200">🔒 YÊU CẦU XÁC THỰC</h2>
              <p className="text-xs text-slate-400 max-w-xs">
                Sơ đồ lốp xe đang sử dụng cơ sở dữ liệu thực tế (Supabase). Vui lòng đăng nhập tài khoản quản trị để hiển thị sơ đồ.
              </p>
            </div>
          </div>

          {/* Quick credentials helper for development */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-400 uppercase tracking-wider mb-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Tài khoản Demo (Dev):</span>
            </div>
            <div className="flex justify-between font-mono text-slate-300">
              <span className="text-slate-500">Email:</span>
              <span className="font-bold">nguyenanhchl.hcm@gmail.com</span>
            </div>
            <div className="flex justify-between font-mono text-slate-300">
              <span className="text-slate-500">Mật khẩu:</span>
              <span className="font-bold">CHLadmin@2026</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.15)] active:scale-[0.97] transition-all cursor-pointer"
          >
            Đăng nhập hệ thống
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ─── Authenticated (Show preview page) ──────────────────
  return (
    <div className="dark min-h-screen bg-background text-foreground bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md mx-auto px-4 pt-8 pb-16 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent uppercase tracking-wider">
            Sơ đồ lốp xe
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            Hệ thống Quản lý Vỏ xe & Đảo lốp
          </p>
        </div>

        {/* Vehicle Selection dropdown */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3 shadow-xl backdrop-blur-md">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Chọn phương tiện giám sát
          </label>
          {isLoadingVehicles ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Đang tải danh sách phương tiện...</span>
            </div>
          ) : vehicles.length > 0 ? (
            <div className="relative">
              <select
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full h-12 px-4 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-bold focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-slate-950 text-slate-300 font-bold">
                    {v.id} — {v.model || 'Không rõ loại'} (Odo: {v.odometer?.toLocaleString('vi-VN')} km)
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <Truck className="w-5 h-5" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <HelpCircle className="w-5 h-5 shrink-0" />
              <span>Không tìm thấy phương tiện nào. Vui lòng seed data trước.</span>
            </div>
          )}
        </div>

        {/* Visual Map */}
        {selectedVehicleId ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TireVisualMap vehicleId={selectedVehicleId} vehicleType={vehicleType} />
          </div>
        ) : (
          !isLoadingVehicles && (
            <div className="text-center py-20 text-slate-600">
              Chưa chọn phương tiện giám sát
            </div>
          )
        )}
      </div>
    </div>
  )
}
