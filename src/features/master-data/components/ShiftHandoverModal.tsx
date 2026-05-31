'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Camera, Compass } from 'lucide-react'
import { SinglePhotoUploader } from '@/features/maintenance/components/mechanic/SinglePhotoUploader'
import { uploadBase64Image } from '@/lib/supabase/storage'
import { useVehicles, MASTER_DATA_KEYS } from '@/hooks/useMasterData'
import { useQueryClient } from '@tanstack/react-query'

interface ShiftHandoverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialVehicleId?: string
  initialVehicleType?: 'tractor' | 'trailer'
}

export function ShiftHandoverModal({
  open,
  onOpenChange,
  initialVehicleId,
  initialVehicleType,
}: ShiftHandoverModalProps) {
  const queryClient = useQueryClient()
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles()

  // State
  const [selectedTractorId, setSelectedTractorId] = useState<string>('')
  const [hasTrailer, setHasTrailer] = useState<boolean>(false)
  const [selectedTrailerId, setSelectedTrailerId] = useState<string>('')
  const [newOdometer, setNewOdometer] = useState<string>('')
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Filter tractors and trailers
  const tractors = useMemo(() => {
    return vehicles.filter(
      (v) =>
        v.loai_xe === 'Đầu kéo' ||
        v.loai_xe === 'Xe tải' ||
        v.model === 'Đầu kéo' ||
        v.model === 'Xe tải'
    )
  }, [vehicles])

  const trailers = useMemo(() => {
    return vehicles.filter(
      (v) => v.loai_xe === 'Rơ-moóc' || v.model === 'Rơ-moóc'
    )
  }, [vehicles])

  // Pre-fill initial vehicle
  useEffect(() => {
    if (open) {
      if (initialVehicleId && initialVehicleType) {
        if (initialVehicleType === 'tractor') {
          setSelectedTractorId(initialVehicleId)
        } else if (initialVehicleType === 'trailer') {
          setHasTrailer(true)
          setSelectedTrailerId(initialVehicleId)
        }
      }
      setNewOdometer('')
      setPhotoBase64(null)
    }
  }, [open, initialVehicleId, initialVehicleType])

  // Get current odometer of selected tractor
  const selectedTractor = useMemo(() => {
    return tractors.find((t) => t.id === selectedTractorId)
  }, [tractors, selectedTractorId])

  const oldOdometer = selectedTractor ? Number(selectedTractor.odometer || 0) : 0

  // Calculate delta KM
  const deltaKm = useMemo(() => {
    if (!newOdometer) return 0
    const val = Number(newOdometer)
    if (isNaN(val)) return 0
    return val - oldOdometer
  }, [newOdometer, oldOdometer])

  // QA Check: Abnormal mileage
  const isAbnormal = deltaKm < 0 || deltaKm > 1500

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTractorId) {
      toast.error('Vui lòng chọn xe đầu kéo.')
      return
    }

    if (!newOdometer || isNaN(Number(newOdometer))) {
      toast.error('Chỉ số Odometer mới không hợp lệ.')
      return
    }

    if (isAbnormal && !photoBase64) {
      toast.error('Chỉ số KM di chuyển bất thường! Vui lòng chụp ảnh Taplo để xác minh.')
      return
    }

    setIsSubmitting(true)
    try {
      let uploadedUrl: string | null = null

      // Upload verification photo if needed
      if (photoBase64) {
        const path = `odometers/odo_${selectedTractorId}_${Date.now()}.webp`
        uploadedUrl = await uploadBase64Image('t2m-evidence', path, photoBase64)
      }

      // Insert log into public.odometer_logs
      const payload = {
        id_xe: selectedTractorId,
        id_mooc: hasTrailer && selectedTrailerId ? selectedTrailerId : null,
        odometer_cu: oldOdometer,
        odometer_moi: Number(newOdometer),
        delta_km: deltaKm,
        photo_url: uploadedUrl,
      }

      const { error } = await supabase.from('odometer_logs').insert([payload])
      if (error) throw error

      toast.success('Chốt ca và cập nhật Odometer thành công!')

      // Invalidate queries to refresh tractor km and tire distances
      queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.vehicles })
      queryClient.invalidateQueries({ queryKey: ['tires'] })

      onOpenChange(false)
    } catch (err: any) {
      console.error('Error logging odometer:', err)
      toast.error('Lỗi: ' + (err.message || 'Không thể cập nhật số KM.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[480px] max-h-[90vh] p-0 flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Compass className="w-5 h-5 text-primary animate-spin-slow" />
              📝 Chốt ca / Ghi nhận Odometer
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Ghi nhận số KM di chuyển của xe đầu kéo và tự động cộng dồn quãng đường cho các lốp đang chạy.
            </DialogDescription>
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Loading Indicator */}
            {isLoadingVehicles ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-slate-400">Đang tải danh sách đội xe...</p>
              </div>
            ) : (
              <>
                {/* 1. Chọn xe đầu kéo */}
                <div className="space-y-2">
                  <Label htmlFor="tractor" className="text-slate-300 font-semibold text-xs">
                    Xe đầu kéo / Xe tải <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedTractorId}
                    onValueChange={(val) => setSelectedTractorId(val || '')}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder="Chọn xe đầu kéo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      {tractors.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          🚚 {t.id} ({t.loai_xe || t.model || 'Đầu kéo'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTractor && (
                    <div className="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-850 border border-slate-800 text-slate-400">
                      <span>Odometer hiện tại:</span>
                      <strong className="font-mono text-primary font-bold">{oldOdometer.toLocaleString()} km</strong>
                    </div>
                  )}
                </div>

                {/* 2. Rơ-moóc kéo theo */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="has-trailer" className="text-slate-300 font-semibold text-xs cursor-pointer">
                      🚚 Kéo theo rơ-moóc (Trailer)?
                    </Label>
                    <Switch
                      id="has-trailer"
                      checked={hasTrailer}
                      onCheckedChange={setHasTrailer}
                    />
                  </div>

                  {hasTrailer && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Select
                        value={selectedTrailerId}
                        onValueChange={(val) => setSelectedTrailerId(val || '')}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                          <SelectValue placeholder="Chọn rơ-moóc..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                          {trailers.map((tr) => (
                            <SelectItem key={tr.id} value={tr.id}>
                              🚛 {tr.id} ({tr.loai_xe || tr.model || 'Rơ-moóc'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-amber-500/80 px-1">
                        * Quãng đường di chuyển sẽ tự động được cộng dồn vào tất cả lốp đang hoạt động trên rơ-moóc này.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Nhập Odometer mới */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <Label htmlFor="new-odometer" className="text-slate-300 font-semibold text-xs">
                    Chỉ số Odometer mới (km) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new-odometer"
                    type="number"
                    value={newOdometer}
                    onChange={(e) => setNewOdometer(e.target.value)}
                    placeholder="Nhập số KM hiện tại trên Taplo..."
                    className="bg-slate-800 border-slate-700 text-slate-100 focus:ring-primary font-mono text-base font-bold"
                    required
                  />
                  {newOdometer && !isNaN(Number(newOdometer)) && (
                    <div className="flex justify-between items-center text-xs px-2 py-1">
                      <span className="text-slate-400">Quãng đường đã chạy (Delta):</span>
                      <span className={`font-mono font-bold ${isAbnormal ? 'text-red-400' : 'text-green-400'}`}>
                        {deltaKm >= 0 ? `+${deltaKm.toLocaleString()}` : deltaKm.toLocaleString()} km
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. QA Warning & Taplo Upload Input */}
                {isAbnormal && newOdometer && (
                  <div className="space-y-3 p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 animate-in zoom-in-95 duration-200">
                    <p className="text-xs font-semibold text-red-400 leading-relaxed">
                      ⚠️ <strong>Số KM di chuyển bất thường!</strong> Quãng đường đã chạy ({deltaKm} km) phải từ 0 đến 1500 km.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Bắt buộc chụp ảnh Taplo / Odometer thực tế của xe để gửi yêu cầu xác minh.
                    </p>

                    <SinglePhotoUploader
                      title="Chụp ảnh Taplo xác minh"
                      description="Yêu cầu chụp rõ mặt đồng hồ Odometer"
                      required={true}
                      onPhotoChange={setPhotoBase64}
                      icon={<Camera className="w-5 h-5 text-red-400" />}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:bg-slate-800 hover:text-white"
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="min-w-[130px] font-bold"
                disabled={
                  isSubmitting ||
                  isLoadingVehicles ||
                  !selectedTractorId ||
                  !newOdometer ||
                  (isAbnormal && !photoBase64)
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  '✓ Chốt Odometer'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
