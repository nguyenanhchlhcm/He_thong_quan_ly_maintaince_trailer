'use client'

import { Wifi, WifiOff, Loader2, CheckCircle, AlertCircle, CloudUpload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSyncEngine, SyncStatus } from '@/hooks/useSyncEngine'

const statusConfig: Record<SyncStatus, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  idle: {
    icon: <Wifi className="w-3 h-3" />,
    label: 'Trực tuyến',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20'
  },
  syncing: {
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    label: 'Đang đồng bộ...',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20'
  },
  success: {
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Đã đồng bộ',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20'
  },
  error: {
    icon: <AlertCircle className="w-3 h-3" />,
    label: 'Lỗi đồng bộ',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20'
  },
  offline: {
    icon: <WifiOff className="w-3 h-3" />,
    label: 'Ngoại tuyến',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20'
  }
}

export function SyncStatusIndicator() {
  const { syncStatus, pendingCount, syncProgress, syncAll, lastSyncTime } = useSyncEngine()
  const config = statusConfig[syncStatus]

  if (pendingCount === 0 && syncStatus === 'idle') {
    return (
      <Badge variant="outline" className={`${config.bgColor} ${config.color} gap-1.5 text-xs`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`${config.bgColor} ${config.color} gap-1.5 text-xs`}>
        {config.icon}
        {config.label}
      </Badge>
      
      {pendingCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs gap-1.5">
            <CloudUpload className="w-3 h-3" />
            {pendingCount} phiếu chờ sync
          </Badge>
          
          {syncStatus === 'idle' && (
            <Button
              variant="outline"
              size="sm"
              onClick={syncAll}
              className="h-6 text-xs border-primary/30 text-primary hover:bg-primary/10"
            >
              Sync ngay
            </Button>
          )}
        </div>
      )}

      {syncStatus === 'syncing' && (
        <div className="text-[10px] text-slate-500">
          {syncProgress.current}/{syncProgress.total}
        </div>
      )}

      {lastSyncTime && syncStatus !== 'syncing' && (
        <div className="text-[10px] text-slate-600">
          Sync: {lastSyncTime.toLocaleTimeString('vi-VN')}
        </div>
      )}
    </div>
  )
}
