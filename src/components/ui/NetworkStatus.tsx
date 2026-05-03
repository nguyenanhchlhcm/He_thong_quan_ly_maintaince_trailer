'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return null // Hoặc có thể render một dải màu xanh mỏng rồi fade out
  }

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-red-500 text-white text-xs py-1.5 px-4 flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top-2">
      <WifiOff className="w-4 h-4" />
      <span className="font-semibold">Đang ngoại tuyến. Dữ liệu sẽ được lưu nháp.</span>
    </div>
  )
}
