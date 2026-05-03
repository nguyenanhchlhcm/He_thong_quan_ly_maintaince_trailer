'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Truck, Wrench, Clock, MapPin, Receipt } from 'lucide-react'

// Dummy data for demonstration since there's no real backend yet
const MOCK_TICKET_DETAIL = {
  id: '1',
  id_xe: '51C-123.45',
  trang_thai_phieu: 'Đang sửa',
  tong_vat_tu: 1500000,
  tien_cong: 300000,
  tong_chi_phi: 1800000,
  created_at: new Date().toISOString(),
  gara_name: 'Gara T2M - Quận 9',
  parts: [
    { id: '1', name: 'Nhớt động cơ Castrol 20L', qty: 1, price: 1500000 }
  ]
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  
  // In a real app, you would fetch the ticket details by `id` here.
  const ticket = MOCK_TICKET_DETAIL

  const getStatusBadge = (status: string) => {
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

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <main className="p-4 md:p-8 md:ml-16 space-y-6 relative min-h-[calc(100vh-3.5rem)] pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="text-slate-400 hover:text-slate-100 -ml-2"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Chi tiết Phiếu
            <span className="text-slate-500 text-lg font-mono">#{id}</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2 text-primary font-mono">
                    <Truck className="w-5 h-5 text-slate-400" />
                    {ticket.id_xe}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4" /> {ticket.gara_name}
                  </CardDescription>
                </div>
                {getStatusBadge(ticket.trang_thai_phieu)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                Được tạo lúc: {formatDate(ticket.created_at)}
              </div>
            </CardContent>
          </Card>

          {/* Parts List */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                Vật tư đã sử dụng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.parts.map(part => (
                  <div key={part.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div>
                      <p className="font-medium text-slate-200">{part.name}</p>
                      <p className="text-sm text-slate-400">Số lượng: {part.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-slate-300">{(part.qty * part.price).toLocaleString()} đ</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Summary */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-400" />
                Tổng chi phí
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Tổng vật tư:</span>
                <span className="font-mono">{ticket.tong_vat_tu.toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Tiền công:</span>
                <span className="font-mono">{ticket.tien_cong.toLocaleString()} đ</span>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="font-medium text-slate-200">Tổng cộng:</span>
                <span className="text-xl font-bold font-mono text-green-400">
                  {ticket.tong_chi_phi.toLocaleString()} đ
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          {ticket.trang_thai_phieu === 'Đang sửa' && (
            <Button className="w-full h-12 text-lg shadow-lg shadow-primary/20">
              Hoàn thành phiếu
            </Button>
          )}
          {ticket.trang_thai_phieu === 'Báo giá' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm text-center">
              Đang chờ Quản lý duyệt giá. Bạn không thể chỉnh sửa lúc này.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
