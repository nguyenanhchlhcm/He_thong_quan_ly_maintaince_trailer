'use client'

import { TicketForm } from '@/features/maintenance/components/mechanic/TicketForm'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, useParams } from 'next/navigation'

export default function EditTicketPage() {
  const router = useRouter()
  const { id } = useParams()

  const ticketId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Page Header */}
      <div className="sticky top-14 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="text-slate-400 hover:text-slate-100 -ml-2"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h2 className="text-lg font-bold">Chỉnh Sửa Phiếu Bảo Trì</h2>
          <p className="text-xs text-slate-500">Cập nhật thông tin sửa chữa của phiếu</p>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        {ticketId ? (
          <TicketForm ticketId={ticketId} />
        ) : (
          <div className="text-slate-400 text-center py-12">Không tìm thấy mã phiếu bảo trì.</div>
        )}
      </div>
    </div>
  )
}
