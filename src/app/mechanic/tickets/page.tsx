'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Clock, Truck, MapPin, ChevronRight, Loader2 } from 'lucide-react'
import { PhieuBaoTri } from '@/types/database'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

// Mock data removed

export default function MechanicTicketsPage() {
  const { profile } = useAuthStore()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchTickets()
    }
  }, [profile?.id])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('phieu_bao_tri')
        .select(`
          *,
          xe:vehicles!id_xe(id, bien_so:id, loai_xe:model)
        `)
        .eq('id_tho_may', profile?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error: any) {
      console.error('Error fetching tickets:', error)
      toast.error('Lỗi khi tải danh sách phiếu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'Đang sửa':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Đang sửa</Badge>
      case 'Báo giá':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Chờ duyệt giá</Badge>
      case 'Đã xong':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Hoàn thành</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (isoString: string | undefined) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <main className="p-4 md:p-8 md:ml-16 space-y-6 relative min-h-[calc(100vh-3.5rem)] pb-24 md:pb-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Phiếu bảo trì của tôi</h1>
          <p className="text-sm text-slate-400">Danh sách các xe đang đảm nhận và sửa chữa</p>
        </div>
      </header>

      {/* Ticket List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-slate-400">Đang tải danh sách phiếu...</p>
        </div>
      ) : tickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm active:scale-[0.98] transition-transform cursor-pointer hover:border-primary/50">
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-4 h-4 text-slate-400" />
                    <CardTitle className="text-xl font-bold font-mono text-primary">
                      {ticket.xe?.bien_so || 'N/A'}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(ticket.created_at)}
                  </div>
                </div>
                {getStatusBadge(ticket.trang_thai_phieu)}
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{ticket.ten_gara || 'N/A'}</span>
                </div>
                {ticket.trang_thai_phieu === 'Báo giá' && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <p className="text-xs text-amber-400 font-medium">Đang chờ quản lý phê duyệt vật tư.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 flex justify-end">
                <Link href={`/mechanic/tickets/${ticket.id}`}>
                  <Button variant="ghost" className="text-slate-300 hover:text-primary gap-1 pl-2 pr-0">
                    Xem chi tiết <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Truck className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">Chưa có phiếu bảo trì nào</h3>
          <p className="text-sm text-slate-400 mb-6">Bạn chưa tạo hoặc được gán phiếu bảo trì nào.</p>
          <Link href="/mechanic/tickets/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Tạo phiếu đầu tiên
            </Button>
          </Link>
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-20 right-4 md:hidden z-40">
        <Link href="/mechanic/tickets/new">
          <Button size="icon" className="w-14 h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>

      {/* Desktop Add Button */}
      <div className="hidden md:block fixed bottom-8 right-8 z-40">
        <Link href="/mechanic/tickets/new">
          <Button size="lg" className="rounded-full shadow-lg shadow-primary/30 gap-2 hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-5 h-5" />
            Tạo phiếu mới
          </Button>
        </Link>
      </div>
    </main>
  )
}
