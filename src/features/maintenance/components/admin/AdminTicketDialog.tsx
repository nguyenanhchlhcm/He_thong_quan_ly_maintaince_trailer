'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Truck, User, Calendar, CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon, FileText, MapPin, Wrench, Trash2 } from 'lucide-react'
import { PhieuBaoTri, ChiTietVatTu } from '@/types/database'
import { logAction } from '@/lib/supabase/audit'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

const isValidImageUrl = (url: any) => {
  if (!url) return false
  const str = String(url).trim().toLowerCase()
  return str !== '' && str !== 'null' && str !== 'undefined'
}

interface AdminTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  ticket: PhieuBaoTri | null
  onEditClick?: (ticket: PhieuBaoTri) => void
}

export function AdminTicketDialog({ open, onOpenChange, onSuccess, ticket, onEditClick }: AdminTicketDialogProps) {
  const [details, setDetails] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

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
        .from('chi_tiet_vat_tu_su_dung')
        .select(`
          *,
          skus!id_sku (
            ten_vat_tu:name
          )
        `)
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

  const handleDeleteTicket = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa phiếu bảo trì này? Hành động này sẽ xóa vĩnh viễn phiếu và toàn bộ danh sách vật tư đính kèm.')) {
      return
    }

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('phieu_bao_tri')
        .delete()
        .eq('id', ticket!.id)
      
      if (error) throw error

      // Ghi nhật ký
      await logAction(
        authUser?.email, 
        'XÓA', 
        'Phiếu', 
        `Xóa phiếu bảo trì ${ticket!.ma_phieu || ticket!.id.slice(0,8)}`
      )

      toast.success('Xóa phiếu bảo trì thành công!')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Lỗi khi xóa phiếu: ' + error.message)
    } finally {
      setIsDeleting(false)
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Phương tiện</p>
            <p className="text-lg font-bold text-primary">
              {ticket.vehicles?.bien_so || ticket.id_xe || 'N/A'}
            </p>
            {ticket.vehicles?.loai_xe && (
              <p className="text-xs text-slate-500">{ticket.vehicles.loai_xe}</p>
            )}
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Người thực hiện / Chịu trách nhiệm</p>
            <p className="text-sm font-medium text-slate-200">
              {ticket.profiles?.full_name || ticket.profiles?.email || 'Chưa gán'}
            </p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Ngày tiếp nhận</p>
            <p className="text-sm font-bold text-emerald-400">
              {new Date(ticket.ngay_tiep_nhan || ticket.created_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ngày lập phiếu</p>
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

        {/* Thông tin sửa chữa bên ngoài */}
        {ticket.loai_phieu === 'Bên ngoài' && (
          <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <MapPin className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm font-bold text-amber-400">Sửa chữa bên ngoài</p>
              {ticket.loai_sua_ngoai && (
                <span className="ml-auto px-2.5 py-0.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                  {ticket.loai_sua_ngoai}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Đơn vị sửa chữa</p>
                <p className="text-sm font-medium text-slate-200">{ticket.don_vi_sua_ngoai || 'Chưa xác định'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mô tả sự cố / Ghi chú</p>
                <p className="text-sm text-slate-300 italic">"{ticket.ghi_chu_ngoai || 'Không có mô tả'}"</p>
              </div>
            </div>
            
            {ticket.receipt_photo_url && (
              <div className="pt-4 border-t border-amber-500/20">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Ảnh Hóa Đơn / Phiếu Thu</p>
                <a href={ticket.receipt_photo_url} target="_blank" rel="noreferrer" className="block w-32 h-32 overflow-hidden rounded-lg border border-amber-500/30 hover:border-amber-500 transition-colors">
                  <img src={ticket.receipt_photo_url} alt="Hóa đơn" className="w-full h-full object-cover" />
                </a>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Danh sách vật tư thay thế</h4>
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-900">
                <TableRow className="border-slate-800">
                  <TableHead>Hạng mục (Vật tư/Dịch vụ)</TableHead>
                  <TableHead className="text-center">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead className="text-center w-[120px]">Minh chứng</TableHead>
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
                      <TableCell className="font-medium text-slate-200">
                        <p className="text-sm font-bold text-slate-100">
                          {item.skus?.ten_vat_tu || 'Không rõ'}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">{item.id_sku?.slice(0, 8)}</p>
                      </TableCell>
                      <TableCell className="text-center">{item.so_luong}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{item.don_gia.toLocaleString()} đ</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">{item.thanh_tien.toLocaleString()} đ</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-3">
                          {isValidImageUrl(item.anh_vat_tu_cu_url) && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[8px] text-slate-500 uppercase">Trước</span>
                              <img src={item.anh_vat_tu_cu_url} alt="Cũ" className="w-10 h-10 object-cover rounded border border-slate-700 cursor-pointer hover:scale-150 transition-transform" />
                            </div>
                          )}
                          {isValidImageUrl(item.anh_vat_tu_moi_url) && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[8px] text-slate-500 uppercase">Sau</span>
                              <img src={item.anh_vat_tu_moi_url} alt="Mới" className="w-10 h-10 object-cover rounded border border-slate-700 cursor-pointer hover:scale-150 transition-transform" />
                            </div>
                          )}
                          {!isValidImageUrl(item.anh_vat_tu_cu_url) && !isValidImageUrl(item.anh_vat_tu_moi_url) && (
                            <span className="text-xs text-slate-500 italic">Không có</span>
                          )}
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

        <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-between mt-6 border-t border-slate-800 pt-6 w-full">
          <div className="flex gap-2">
            {/* Delete button - always visible for Admin */}
            <Button 
              variant="destructive"
              className="font-bold flex items-center gap-2"
              onClick={handleDeleteTicket}
              disabled={isDeleting || isUpdating}
            >
              <Trash2 className="w-4 h-4" /> XÓA PHIẾU
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">Đóng</Button>
          </div>
          
          <div className="flex gap-2">
            {/* Edit button - always visible for Admin */}
            <Button 
              variant="outline"
              className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10 font-bold flex items-center gap-2"
              onClick={() => {
                onOpenChange(false)
                if (onEditClick) {
                  onEditClick(ticket)
                }
              }}
              disabled={isUpdating || isDeleting}
            >
              <Wrench className="w-4 h-4" /> SỬA PHIẾU
            </Button>

            {ticket.trang_thai_phieu === 'Chờ duyệt' && (
              <>
                <Button 
                  variant="outline" 
                  className="border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold"
                  onClick={() => updateStatus('Báo giá')}
                  disabled={isUpdating || isDeleting}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Từ chối
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-8"
                  onClick={() => updateStatus('Đang sửa')}
                  disabled={isUpdating || isDeleting}
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
