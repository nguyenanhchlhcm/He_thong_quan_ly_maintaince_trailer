'use client'

import { useState, useEffect } from 'react'
import { MapPin, MapPinOff, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface GPSLocatorProps {
  onLocationFound: (location: { lat: number; lng: number } | null) => void
  targetLocation?: { lat: number; lng: number } | null
}

import { calculateDistance } from '@/lib/utils/haversine'

export function GPSLocator({ onLocationFound, targetLocation }: GPSLocatorProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [distance, setDistance] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMsg('Trình duyệt của bạn không hỗ trợ định vị GPS.')
      onLocationFound(null)
      return
    }

    setStatus('loading')

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    const success = (pos: GeolocationPosition) => {
      if (!isMounted) return
      const crd = pos.coords
      const currentCoords = { lat: crd.latitude, lng: crd.longitude }
      setCoords(currentCoords)
      
      if (targetLocation) {
        const d = calculateDistance(currentCoords.lat, currentCoords.lng, targetLocation.lat, targetLocation.lng)
        setDistance(d)
      } else {
        setDistance(null)
      }

      setStatus('success')
      onLocationFound(currentCoords)
    }

    const error = (err: GeolocationPositionError) => {
      if (!isMounted) return
      setStatus('error')
      if (err.code === err.PERMISSION_DENIED) {
        setErrorMsg('Vui lòng cấp quyền truy cập vị trí (Location) để tạo phiếu.')
      } else {
        setErrorMsg(`Lỗi định vị: ${err.message}`)
      }
      onLocationFound(null)
    }

    navigator.geolocation.getCurrentPosition(success, error, options)
    
    return () => { isMounted = false }
  }, [onLocationFound, retryCount, targetLocation])

  if (status === 'loading') {
    return (
      <Alert className="bg-slate-800/50 border-slate-700 text-slate-300 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <AlertDescription className="ml-2 font-medium">
          Đang xác định vị trí GPS của bạn...
        </AlertDescription>
      </Alert>
    )
  }

  if (status === 'error') {
    return (
      <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 py-3">
        <MapPinOff className="h-4 w-4" />
        <div className="ml-2 flex-1">
          <AlertTitle className="text-sm">Lỗi định vị GPS</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            {errorMsg}
          </AlertDescription>
        </div>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          onClick={() => setRetryCount(prev => prev + 1)}
          className="h-8 border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          Thử lại
        </Button>
      </Alert>
    )
  }

  const isTooFar = distance !== null && distance > 1

  return (
    <div className="space-y-2">
      <Alert className={`${isTooFar ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-400'} py-3 flex items-center`}>
        <MapPin className="h-4 w-4" />
        <AlertDescription className="ml-2 text-xs font-medium flex-1">
          {isTooFar 
            ? `CẢNH BÁO: Bạn đang cách Gara ${distance.toFixed(2)}km (Quá xa!)`
            : `Đã xác nhận vị trí (${coords?.lat.toFixed(4)}, {coords?.lng.toFixed(4)})`
          }
        </AlertDescription>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => setRetryCount(prev => prev + 1)}
          className={`h-7 ${isTooFar ? 'text-amber-500 hover:bg-amber-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
        >
          Làm mới
        </Button>
      </Alert>
      {isTooFar && (
        <p className="text-[10px] text-amber-600 font-bold px-2 italic">
          * Hệ thống sẽ đánh dấu phiếu này là "Cần xác minh GPS" (GPS Warning flag).
        </p>
      )}
    </div>
  )
}
