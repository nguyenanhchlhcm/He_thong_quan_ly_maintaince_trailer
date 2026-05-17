'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTicketStore, OfflineTicket } from '@/store/ticketStore'
import { supabase } from '@/lib/supabase/client'
import { uploadBase64Image } from '@/lib/supabase/storage'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline'

interface SyncResult {
  success: number
  failed: number
  errors: string[]
}

export function useSyncEngine() {
  const { profile } = useAuthStore()
  const { pendingSyncQueue, removeFromSyncQueue, clearSyncQueue } = useTicketStore()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? 'idle' : 'offline')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 })
  const isSyncing = useRef(false)

  const syncTicket = async (ticket: OfflineTicket): Promise<boolean> => {
    try {
      const ticketRef = `ticket_${ticket.createdAt || Date.now()}`
      const userId = profile?.id

      // Upload ODO photo
      let odoUrl: string | null = null
      if (ticket.odometer_photo_base64) {
        odoUrl = await uploadBase64Image(
          't2m-evidence',
          `odometer/${ticketRef}_odo.webp`,
          ticket.odometer_photo_base64
        )
      }

      // Upload receipt photo
      let receiptUrl: string | null = null
      if (ticket.receipt_photo_base64) {
        receiptUrl = await uploadBase64Image(
          't2m-evidence',
          `receipts/${ticketRef}_receipt.webp`,
          ticket.receipt_photo_base64
        )
      }

      // Create ticket
      const totalVatTu = ticket.parts.reduce((sum, p) => sum + (p.so_luong * p.don_gia), 0)
      const { data: phieu, error: phieuError } = await supabase
        .from('phieu_bao_tri')
        .insert([{
          id_xe: ticket.id_xe,
          id_gara: ticket.id_gara,
          id_tho_may: userId,
          so_km_luc_sua: ticket.so_km_luc_sua || 0,
          trang_thai_phieu: 'Chờ duyệt',
          tong_vat_tu: totalVatTu,
          tien_cong: ticket.tien_cong || 0,
          tong_chi_phi: totalVatTu + (ticket.tien_cong || 0),
          odometer_photo_url: odoUrl,
          receipt_photo_url: receiptUrl,
          created_at: new Date(ticket.createdAt).toISOString()
        }])
        .select()
        .single()

      if (phieuError) throw phieuError

      // Upload part photos + create details
      if (ticket.parts.length > 0) {
        const chiTietData = await Promise.all(
          ticket.parts.map(async (part, i) => {
            const [anhCuUrl, anhMoiUrl] = await Promise.all([
              part.photos.oldPartBase64 
                ? uploadBase64Image('t2m-evidence', `parts/${ticketRef}_part${i}_old.webp`, part.photos.oldPartBase64)
                : null,
              part.photos.newPartBase64 
                ? uploadBase64Image('t2m-evidence', `parts/${ticketRef}_part${i}_new.webp`, part.photos.newPartBase64)
                : null
            ])
            return {
              id_phieu: phieu.id,
              id_sku: part.id_sku,
              so_luong: part.so_luong,
              don_gia: part.don_gia,
              thanh_tien: part.so_luong * part.don_gia,
              anh_vat_tu_cu_url: anhCuUrl || '',
              anh_vat_tu_moi_url: anhMoiUrl || ''
            }
          })
        )

        const { error: ctError } = await supabase
          .from('chi_tiet_vat_tu_su_dung')
          .insert(chiTietData)

        if (ctError) throw ctError
      }

      return true
    } catch (error: any) {
      console.error('Sync ticket failed:', error)
      return false
    }
  }

  const syncAll = useCallback(async () => {
    if (isSyncing.current || pendingSyncQueue.length === 0) return
    if (!navigator.onLine) {
      setSyncStatus('offline')
      return
    }

    isSyncing.current = true
    setSyncStatus('syncing')
    setSyncProgress({ current: 0, total: pendingSyncQueue.length })

    const result: SyncResult = { success: 0, failed: 0, errors: [] }

    for (let i = 0; i < pendingSyncQueue.length; i++) {
      const ticket = pendingSyncQueue[i]
      setSyncProgress({ current: i + 1, total: pendingSyncQueue.length })

      const success = await syncTicket(ticket)
      if (success) {
        removeFromSyncQueue(ticket.createdAt)
        result.success++
      } else {
        result.failed++
        result.errors.push(`Phiếu #${ticket.createdAt} không thể đồng bộ`)
      }
    }

    isSyncing.current = false
    setLastSyncTime(new Date())

    if (result.success > 0) {
      toast.success(`Đã đồng bộ ${result.success} phiếu thành công!`)
    }
    if (result.failed > 0) {
      toast.error(`${result.failed} phiếu không thể đồng bộ. Sẽ thử lại sau.`)
    }

    setSyncStatus(result.failed > 0 ? 'error' : 'success')
    setTimeout(() => setSyncStatus('idle'), 5000)
  }, [pendingSyncQueue, removeFromSyncQueue])

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('idle')
      if (pendingSyncQueue.length > 0) {
        toast.info('Kết nối mạng đã khôi phục. Đang đồng bộ...', { duration: 3000 })
        syncAll()
      }
    }

    const handleOffline = () => {
      setSyncStatus('offline')
      toast.warning('Mất kết nối mạng. Dữ liệu sẽ được lưu cục bộ.', { duration: 5000 })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [pendingSyncQueue.length, syncAll])

  // Auto-sync on mount if there are pending items and we're online
  useEffect(() => {
    if (navigator.onLine && pendingSyncQueue.length > 0) {
      syncAll()
    }
  }, [])

  return {
    syncStatus,
    lastSyncTime,
    syncProgress,
    pendingCount: pendingSyncQueue.length,
    syncAll,
    isOnline: navigator.onLine
  }
}
