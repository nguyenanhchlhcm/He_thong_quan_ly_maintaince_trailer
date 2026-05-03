'use client'

import { useEffect, useState } from 'react'
import { useTicketStore } from '@/store/ticketStore'
import { toast } from 'sonner'
import { CloudUpload, CheckCircle2 } from 'lucide-react'

export function SyncEngine() {
  const { pendingSyncQueue, removeFromSyncQueue } = useTicketStore()
  const [isSyncing, setIsSyncing] = useState(false)

  // Prevent closing browser while syncing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSyncing) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isSyncing])

  useEffect(() => {
    const syncData = async () => {
      // Don't sync if already syncing, offline, or queue is empty
      if (isSyncing || !navigator.onLine || pendingSyncQueue.length === 0) return

      setIsSyncing(true)
      const total = pendingSyncQueue.length
      
      toast.info(
        <div className="flex items-center gap-2">
          <CloudUpload className="w-4 h-4 animate-bounce" />
          <span>Đang đồng bộ {total} phiếu bảo trì lên máy chủ...</span>
        </div>,
        { duration: 10000, id: 'sync-toast' } // Keep toast open
      )

      for (let i = 0; i < pendingSyncQueue.length; i++) {
        const ticket = pendingSyncQueue[i]
        
        try {
          // Simulate network request (2 seconds per ticket)
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // MOCK: Replace with actual Supabase insert:
          // await supabase.from('phieu_bao_tri').insert(...)
          console.log(`[SyncEngine] Successfully synced ticket created at ${ticket.createdAt}`)

          // Remove from local IndexedDB queue
          removeFromSyncQueue(ticket.createdAt)
          
        } catch (error) {
          console.error(`[SyncEngine] Failed to sync ticket ${ticket.createdAt}`, error)
          // If a ticket fails, we stop the sync process so it can retry later
          toast.error('Lỗi đồng bộ. Sẽ thử lại sau.', { id: 'sync-toast' })
          setIsSyncing(false)
          return 
        }
      }

      // All tickets synced
      setIsSyncing(false)
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Đã đồng bộ thành công tất cả dữ liệu!</span>
        </div>,
        { id: 'sync-toast', duration: 4000 }
      )
    }

    // Attempt to sync when the component mounts or when the queue/online state changes
    const handleOnline = () => {
      console.log('[SyncEngine] Network restored. Attempting sync...')
      syncData()
    }

    window.addEventListener('online', handleOnline)
    
    // Check periodically or immediately if already online and has queue
    if (navigator.onLine && pendingSyncQueue.length > 0 && !isSyncing) {
      syncData()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [pendingSyncQueue, removeFromSyncQueue, isSyncing])

  // This is a headless component, it renders nothing
  return null
}
