'use client'

import { TicketForm } from '@/features/maintenance/components/mechanic/TicketForm'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function NewTicketPage() {
  const router = useRouter()

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
          <h2 className="text-lg font-bold">Tạo Phiếu Bảo Trì</h2>
          <p className="text-xs text-slate-500">Khai báo thông tin sửa chữa tại Gara</p>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <TicketForm />
      </div>
    </div>
  )
}
