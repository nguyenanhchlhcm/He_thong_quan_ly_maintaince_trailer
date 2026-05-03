'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Truck, User, Calendar, CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon, FileText } from 'lucide-react'
import { PhieuBaoTri, ChiTietVatTu } from '@/types/database'
import { logAction } from '@/lib/supabase/audit'
import { useAuthStore } from '@/store/authStore'

interface AdminTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  ticket: PhieuBaoTri | null
}

export function AdminTicketDialog({ open, onOpenChange, onSuccess, ticket }: AdminTicketDialogProps) {
  const [details, setDetails] = useState<ChiTietVatTu[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (open && ticket) {
      fetchDetails()
    }
  }, [open, ticket])

  const fetchDetails = async () => {
    if (!ticket) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('chi_tiet_phieu_bao_tri')
        .select('*')
        .eq('id_phieu', ticket.id)
      
      if (error) throw error
      setDetails(data || [])
    } catch (error: any) {
      toast.error('Lỗi tải chi tiết phiếu: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const { user: authUser } = useAuthStore()

  const updateStatus = async (newStatus: string) => {
    if (!ticket) return
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('phieu_bao_tri')
        .update({ trang_thai_phieu: newStatus })
        .eq('id', ticket.id)

      if (error) throw error
      
      // Ghi nhật ký
      await logAction(
        authUser?.email, 
        'CẬP NHẬT', 
        'Phiếu', 
        `Đổi trạng thái phiếu ${ticket.ma_phieu || ticket.id.slice(0,8)} sang ${newStatus}`
      )

      toast.success(`Đã chuyển trạng thái phiếu sang: ${newStatus}`)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Lỗi cập nhật trạng thái: ' + error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            Phiếu Bảo Trì: {ticket.ma_phieu || ticket.id.slice(0, 8)}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Xem xét các hạng mục vật tư và phê duyệt yêu cầu sửa chữa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Phương tiện</p>
            <p className="text-lg font-bold text-primary">{ticket.id_xe}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Người lập phiếu</p>
            <p className="text-sm font-medium">{ticket.id_tho_may || 'N/A'}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ngày lập</p>
            <p className="text-sm font-medium">{new Date(ticket.created_at).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        {ticket.canh_bao_gps && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-500">Cảnh báo vị trí (GPS Fraud Check)</p>
              <p className="text-xs text-red-400/80">Vị trí thợ máy lập phiếu lệch quá 1km so với tọa độ GPS của xe.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Danh sách vật tư thay thế</h4>
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-900">
                <TableRow className="border-slate-800">
                  <TableHead>Vật tư / SKU</TableHead>
                  <TableHead className="text-center">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead className="text-center">Ảnh chứng minh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : details.length > 0 ? (
                  details.map((item) => (
                    <TableRow key={item.id} className="border-slate-800">
                      <TableCell className="font-medium text-slate-200">{item.id_sku}</TableCell>
                      <TableCell className="text-center">{item.so_luong}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{item.don_gia.toLocaleString()} đ</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">{item.thanh_tien.toLocaleString()} đ</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {item.anh_vat_tu_cu_url && <span title="Ảnh cũ"><ImageIcon className="w-4 h-4 text-blue-400" /></span>}
                          {item.anh_vat_tu_moi_url && <span title="Ảnh mới"><ImageIcon className="w-4 h-4 text-green-400" /></span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">Không có chi tiết vật tư.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-end gap-2 px-4 py-2 bg-slate-900/30 rounded-xl">
            <div className="flex justify-between w-full max-w-[250px] text-sm">
              <span className="text-slate-400">Tổng vật tư:</span>
              <span className="font-mono">{ticket.tong_vat_tu.toLocaleString()} đ</span>
            </div>
            <div className="flex justify-between w-full max-w-[250px] text-sm">
              <span className="text-slate-400">Tiền công:</span>
              <span className="font-mono">{ticket.tien_cong.toLocaleString()} đ</span>
            </div>
            <div className="flex justify-between w-full max-w-[250px] text-lg font-bold text-primary border-t border-slate-800 pt-2 mt-2">
              <span>TỔNG CỘNG:</span>
              <span>{ticket.tong_chi_phi.toLocaleString()} đ</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-6 border-t border-slate-800 pt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">Đóng</Button>
          
          <div className="flex gap-2">
            {ticket.trang_thai_phieu === 'Chờ duyệt' && (
              <>
                <Button 
                  variant="outline" 
                  className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                  onClick={() => updateStatus('Báo giá')}
                  disabled={isUpdating}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Từ chối
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-8"
                  onClick={() => updateStatus('Đang sửa')}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  PHÊ DUYỆT PHIẾU
                </Button>
              </>
            )}
            {ticket.trang_thai_phieu === 'Đang sửa' && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
                onClick={() => updateStatus('Đã xong')}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                NGHIỆM THU XONG
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
