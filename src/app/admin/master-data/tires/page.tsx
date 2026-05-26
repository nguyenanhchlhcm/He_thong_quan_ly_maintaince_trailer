'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TireVisualMap } from '@/features/master-data/components/TireVisualMap'
import { Loader2 } from 'lucide-react'

function TireMapContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || ''
  const type = (searchParams.get('type') || 'tractor') as 'tractor' | 'trailer'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-slate-900/30 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <TireVisualMap vehicleId={id} vehicleType={type} />
      </div>
    </div>
  )
}

export default function VehicleTireMapPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-slate-400">Đang chuẩn bị sơ đồ lốp xe...</span>
      </div>
    }>
      <TireMapContent />
    </Suspense>
  )
}
