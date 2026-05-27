'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ComboboxRoot,
  ComboboxInput,
  ComboboxPopup,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxInputGroup,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Package, Truck, User, Wrench, MapPin, FileText, Calendar, Search } from 'lucide-react'
import { Xe, VatTuSKU, Profile, LoaiPhieu, LoaiSuaNgoai } from '@/types/database'
import { logAction } from '@/lib/supabase/audit'
import { uploadBase64Image } from '@/lib/supabase/storage'
import { useAuthStore } from '@/store/authStore'
import { VehicleDialog } from '@/features/master-data/components/VehicleDialog'
import { UserRoleDialog } from '@/features/master-data/components/UserRoleDialog'
import { PartDialog } from '@/features/master-data/components/PartDialog'
import { SinglePhotoUploader } from '@/features/maintenance/components/mechanic/SinglePhotoUploader'
import { PhotoUploader } from '@/features/maintenance/components/mechanic/PhotoUploader'

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editTicket?: any | null
}

interface SelectedItem {
  id_sku: string
  so_luong: number
  don_gia: number
  name: string
  loai: 'Vật tư' | 'Dịch vụ'
  anh_cu?: string | null
  anh_moi?: string | null
}

export function CreateTicketDialog({ open, onOpenChange, onSuccess, editTicket }: CreateTicketDialogProps) {
  const [vehicles, setVehicles] = useState<Xe[]>([])
  const [mechanics, setMechanics] = useState<Profile[]>([])
  const [skus, setSkus] = useState<VatTuSKU[]>([])
  
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [selectedMechanic, setSelectedMechanic] = useState('')
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [laborCost, setLaborCost] = useState(0)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [showAddMechanic, setShowAddMechanic] = useState(false)
  const [showAddPart, setShowAddPart] = useState(false)

  // External repair fields
  const [loaiPhieu, setLoaiPhieu] = useState<LoaiPhieu>('Nội bộ')
  const [loaiSuaNgoai, setLoaiSuaNgoai] = useState<LoaiSuaNgoai | ''>('')
  const [donViSuaNgoai, setDonViSuaNgoai] = useState('')
  const [ghiChuNgoai, setGhiChuNgoai] = useState('')
  const [receiptPhotoBase64, setReceiptPhotoBase64] = useState<string | null>(null)
  const [ngayTiepNhan, setNgayTiepNhan] = useState('')
  const [nganHangNgoai, setNganHangNgoai] = useState('')
  const [soTaiKhoanNgoai, setSoTaiKhoanNgoai] = useState('')
  const [tenTaiKhoanNgoai, setTenTaiKhoanNgoai] = useState('')
  const [banks, setBanks] = useState<{ code: string; shortName: string; customLabel: string; bin: string }[]>([])
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [payeeAccounts, setPayeeAccounts] = useState<{ ten: string; ngan_hang: string; so_tk: string }[]>([])
  const [isNewPayee, setIsNewPayee] = useState(false)
  const [repairUnits, setRepairUnits] = useState<string[]>([])
  const [showAddRepairUnit, setShowAddRepairUnit] = useState(false)

  useEffect(() => {
    if (open) {
      fetchMasterData()
      fetchPayeeAccounts()
      fetchRepairUnits()
    }
  }, [open])

  useEffect(() => {
    if (open && banks.length === 0) {
      fetch('https://api.vietqr.io/v2/banks')
        .then(res => res.json())
        .then(res => {
          if (res.code === '00' && Array.isArray(res.data)) {
            const list = res.data.map((b: any) => ({
              code: b.code,
              shortName: b.shortName,
              customLabel: `${b.code} - ${b.shortName}`,
              bin: b.bin
            }))
            setBanks(list)
          }
        })
        .catch(err => {
          console.error('Failed to fetch banks:', err)
          setBanks([
            { code: 'VCB', shortName: 'Vietcombank', customLabel: 'VCB - Vietcombank', bin: '970436' },
            { code: 'TCB', shortName: 'Techcombank', customLabel: 'TCB - Techcombank', bin: '970407' },
            { code: 'MB', shortName: 'MBBank', customLabel: 'MB - MBBank', bin: '970422' },
            { code: 'ACB', shortName: 'ACB', customLabel: 'ACB - ACB', bin: '970416' },
            { code: 'BIDV', shortName: 'BIDV', customLabel: 'BIDV - BIDV', bin: '970418' },
            { code: 'CTG', shortName: 'VietinBank', customLabel: 'CTG - VietinBank', bin: '970415' },
            { code: 'VBA', shortName: 'Agribank', customLabel: 'VBA - Agribank', bin: '970405' },
            { code: 'VPB', shortName: 'VPBank', customLabel: 'VPB - VPBank', bin: '970432' },
            { code: 'STB', shortName: 'Sacombank', customLabel: 'STB - Sacombank', bin: '970403' },
            { code: 'TPB', shortName: 'TPBank', customLabel: 'TPB - TPBank', bin: '970423' }
          ])
        })
    }
  }, [open, banks.length])

  useEffect(() => {
    if (open) {
      if (editTicket) {
        setSelectedVehicle(editTicket.id_xe || '')
        setSelectedMechanic(editTicket.id_tho_may || '')
        setLoaiPhieu(editTicket.loai_phieu || 'Nội bộ')
        setLoaiSuaNgoai(editTicket.loai_sua_ngoai || '')
        setDonViSuaNgoai(editTicket.don_vi_sua_ngoai || '')
        setGhiChuNgoai(editTicket.ghi_chu_ngoai || '')
        setNganHangNgoai(editTicket.ngan_hang_ngoai || '')
        setSoTaiKhoanNgoai(editTicket.so_tai_khoan_ngoai || '')
        setTenTaiKhoanNgoai(editTicket.ten_tai_khoan_ngoai || '')
        setIsNewPayee(false)
        setLaborCost(editTicket.tien_cong || 0)
        setReceiptPhotoBase64(null)
        
        const dateVal = editTicket.ngay_tiep_nhan || editTicket.created_at
        setNgayTiepNhan(dateVal ? new Date(dateVal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
        
        fetchTicketParts(editTicket.id)
      } else {
        setSelectedVehicle('')
        setSelectedMechanic('')
        setSelectedItems([])
        setLaborCost(0)
        setLoaiPhieu('Nội bộ')
        setLoaiSuaNgoai('')
        setDonViSuaNgoai('')
        setGhiChuNgoai('')
        setNganHangNgoai('')
        setSoTaiKhoanNgoai('')
        setTenTaiKhoanNgoai('')
        setIsNewPayee(false)
        setReceiptPhotoBase64(null)
        setNgayTiepNhan(new Date().toISOString().split('T')[0])
      }
    }
  }, [open, editTicket])

  const fetchTicketParts = async (ticketId: string) => {
    setIsLoading(true)
    try {
      const { data: details, error } = await supabase
        .from('chi_tiet_vat_tu_su_dung')
        .select(`
          *,
          sku:skus!id_sku(id, ten_vat_tu:name, loai)
        `)
        .eq('id_phieu', ticketId)
      
      if (error) throw error
      
      if (details) {
        const items: SelectedItem[] = details.map(d => ({
          id_sku: d.id_sku,
          name: d.sku?.ten_vat_tu || '',
          so_luong: d.so_luong,
          don_gia: d.don_gia,
          loai: (d.sku?.loai as any) || 'Vật tư',
          anh_cu: d.anh_vat_tu_cu_url,
          anh_moi: d.anh_vat_tu_moi_url
        }))
        setSelectedItems(items)
      }
    } catch (err: any) {
      toast.error('Lỗi tải chi tiết vật tư: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMasterData = async (autoSelectId?: string, type?: 'vehicle' | 'mechanic' | 'sku') => {
    setIsLoading(true)
    try {
      const [vRes, mRes, sRes] = await Promise.all([
        supabase.from('vehicles').select('id, bien_so:id, loai_xe:model'),
        supabase.from('profiles').select('*'),
        supabase.from('skus').select('id, ten_vat_tu:name, don_vi_tinh:unit, gia_tham_khao:price, loai')
      ])
      setVehicles((vRes.data || []) as unknown as Xe[])
      setMechanics(mRes.data || [])
      setSkus((sRes.data || []) as unknown as VatTuSKU[])

      if (autoSelectId) {
        if (type === 'vehicle') setSelectedVehicle(autoSelectId)
        if (type === 'mechanic') setSelectedMechanic(autoSelectId)
        if (type === 'sku') {
          const newSku = ((sRes.data || []) as unknown as VatTuSKU[]).find(s => s.id === autoSelectId)
          if (newSku && !selectedItems.find(item => item.id_sku === autoSelectId)) {
            setSelectedItems(prev => [...prev, {
              id_sku: newSku.id,
              name: newSku.ten_vat_tu || '',
              so_luong: 1,
              don_gia: newSku.gia_tham_khao || 0,
              loai: (newSku.loai as any) || 'Vật tư',
              anh_cu: null,
              anh_moi: null
            }])
          }
        }
      }
    } catch (error: any) {
      toast.error('Lỗi tải danh mục: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = (skuId: string) => {
    const sku = skus.find(s => s.id === skuId)
    if (!sku) return
    
    if (selectedItems.find(item => item.id_sku === skuId)) {
      return toast.error('Vật tư này đã có trong danh sách')
    }

    setSelectedItems([...selectedItems, {
      id_sku: sku.id,
      name: sku.ten_vat_tu || '',
      so_luong: 1,
      don_gia: sku.gia_tham_khao || 0,
      loai: (sku.loai as any) || 'Vật tư',
      anh_cu: null,
      anh_moi: null
    }])
  }

  const removeItem = (skuId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id_sku !== skuId))
  }

  const updateItem = (skuId: string, field: keyof SelectedItem, value: any) => {
    setSelectedItems(selectedItems.map(item => 
      item.id_sku === skuId ? { ...item, [field]: value } : item
    ))
  }

  const calculateTotalVatTu = () => {
    return selectedItems.reduce((sum, item) => sum + (item.so_luong * item.don_gia), 0)
  }

  const fetchPayeeAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('phieu_bao_tri')
        .select('ten_tai_khoan_ngoai, ngan_hang_ngoai, so_tai_khoan_ngoai')
        .not('ten_tai_khoan_ngoai', 'is', null)
        .not('ten_tai_khoan_ngoai', 'eq', '')
      
      if (error) throw error
      
      // Lọc unique theo tên + ngân hàng + STK
      const uniqueMap = new Map<string, { ten: string; ngan_hang: string; so_tk: string }>()
      ;(data || []).forEach((row: any) => {
        const key = `${row.ten_tai_khoan_ngoai}|${row.ngan_hang_ngoai}|${row.so_tai_khoan_ngoai}`
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            ten: row.ten_tai_khoan_ngoai,
            ngan_hang: row.ngan_hang_ngoai,
            so_tk: row.so_tai_khoan_ngoai
          })
        }
      })
      setPayeeAccounts(Array.from(uniqueMap.values()))
    } catch (err) {
      console.error('Lỗi tải danh sách người thụ hưởng:', err)
    }
  }

  const fetchRepairUnits = async () => {
    try {
      const { data } = await supabase
        .from('phieu_bao_tri')
        .select('don_vi_sua_ngoai')
        .not('don_vi_sua_ngoai', 'is', null)
        .not('don_vi_sua_ngoai', 'eq', '')

      if (data) {
        const unique = [...new Set(data.map(r => r.don_vi_sua_ngoai as string))]
        setRepairUnits(unique.sort())
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đơn vị sửa chữa:', err)
    }
  }

  const handlePayeeSelect = (payeeName: string) => {
    if (payeeName === '__NEW__') {
      setIsNewPayee(true)
      setTenTaiKhoanNgoai('')
      setNganHangNgoai('')
      setSoTaiKhoanNgoai('')
      return
    }
    setIsNewPayee(false)
    setTenTaiKhoanNgoai(payeeName)
    // Tìm tài khoản theo tên và auto-fill ngân hàng + STK
    const matched = payeeAccounts.find(p => p.ten === payeeName)
    if (matched) {
      setNganHangNgoai(matched.ngan_hang || '')
      setSoTaiKhoanNgoai(matched.so_tk || '')
    }
  }

  const lookupAccountName = async () => {
    if (!nganHangNgoai || !soTaiKhoanNgoai) {
      return toast.error('Vui lòng chọn Ngân hàng và nhập Số tài khoản trước khi tra cứu');
    }

    const clientId = process.env.NEXT_PUBLIC_VIETQR_CLIENT_ID;
    const apiKey = process.env.NEXT_PUBLIC_VIETQR_API_KEY;

    const fallbackToDb = async () => {
      try {
        const { data, error } = await supabase
          .from('phieu_bao_tri')
          .select('ten_tai_khoan_ngoai')
          .eq('ngan_hang_ngoai', nganHangNgoai)
          .eq('so_tai_khoan_ngoai', soTaiKhoanNgoai)
          .not('ten_tai_khoan_ngoai', 'is', null)
          .not('ten_tai_khoan_ngoai', 'eq', '')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0 && data[0].ten_tai_khoan_ngoai) {
          setTenTaiKhoanNgoai(data[0].ten_tai_khoan_ngoai.toUpperCase());
          toast.success('Tìm thấy tên tài khoản từ lịch sử giao dịch cũ!');
          return true;
        }
        return false;
      } catch (err) {
        console.error('Lỗi khi tra cứu lịch sử database:', err);
        return false;
      }
    };

    if (!clientId || !apiKey) {
      setIsLookingUp(true);
      const found = await fallbackToDb();
      setIsLookingUp(false);
      if (!found) {
        toast.warning('Chưa cấu hình API Key VietQR và không tìm thấy tài khoản này trong lịch sử. Vui lòng nhập tay.');
      }
      return;
    }

    const selectedBank = banks.find(b => b.code === nganHangNgoai);
    if (!selectedBank?.bin) return toast.error('Không tìm thấy mã BIN của ngân hàng này');

    setIsLookingUp(true);
    try {
      const response = await fetch('https://api.vietqr.io/v2/lookup', {
        method: 'POST',
        headers: {
          'x-client-id': clientId,
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bin: selectedBank.bin,
          accountNumber: soTaiKhoanNgoai
        })
      });

      const result = await response.json();
      
      if (result.code === '00' && result.data?.accountName) {
        setTenTaiKhoanNgoai(result.data.accountName.toUpperCase());
        toast.success('Tra cứu tên tài khoản thành công!');
      } else {
        const found = await fallbackToDb();
        if (!found) {
          toast.error(result.desc || 'Không tìm thấy tên tài khoản trên VietQR và lịch sử giao dịch.');
        }
      }
    } catch (error) {
      console.error('Lỗi tra cứu tài khoản:', error);
      const found = await fallbackToDb();
      if (!found) {
        toast.error('Có lỗi xảy ra khi kết nối mạng VietQR và không có lịch sử giao dịch cũ.');
      }
    } finally {
      setIsLookingUp(false);
    }
  }

  const { user: authUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle) return toast.error('Vui lòng chọn xe')
    if (selectedItems.length === 0) {
      return toast.error('Vui lòng thêm ít nhất 1 hạng mục (Vật tư hoặc Dịch vụ)')
    }
    if (loaiPhieu === 'Bên ngoài' && (soTaiKhoanNgoai || tenTaiKhoanNgoai) && !nganHangNgoai) {
      return toast.error('Vui lòng chọn Ngân hàng trước khi lưu thông tin thanh toán')
    }

    setIsSubmitting(true)
    const totalVatTu = calculateTotalVatTu()

    try {
      const ticketRef = `admin_ticket_${Date.now()}`

      let receiptPhotoUrl = editTicket?.receipt_photo_url || null
      if (receiptPhotoBase64) {
        receiptPhotoUrl = await uploadBase64Image('t2m-evidence', `admin_receipt_${Date.now()}`, receiptPhotoBase64)
      }

      let phieuId = ''

      if (editTicket) {
        // Cập nhật Phiếu bảo trì chính
        const { error: phieuError } = await supabase
          .from('phieu_bao_tri')
          .update({
            id_xe: selectedVehicle,
            id_tho_may: selectedMechanic || null,
            loai_phieu: loaiPhieu,
            loai_sua_ngoai: loaiPhieu === 'Bên ngoài' ? (loaiSuaNgoai || null) : null,
            don_vi_sua_ngoai: loaiPhieu === 'Bên ngoài' ? (donViSuaNgoai || null) : null,
            ghi_chu_ngoai: loaiPhieu === 'Bên ngoài' ? (ghiChuNgoai || null) : null,
            ngan_hang_ngoai: loaiPhieu === 'Bên ngoài' ? (nganHangNgoai || null) : null,
            so_tai_khoan_ngoai: loaiPhieu === 'Bên ngoài' ? (soTaiKhoanNgoai || null) : null,
            ten_tai_khoan_ngoai: loaiPhieu === 'Bên ngoài' ? (tenTaiKhoanNgoai || null) : null,
            receipt_photo_url: receiptPhotoUrl,
            tong_vat_tu: totalVatTu,
            tien_cong: laborCost,
            tong_chi_phi: totalVatTu + laborCost,
            ngay_tiep_nhan: ngayTiepNhan ? new Date(ngayTiepNhan).toISOString() : new Date().toISOString()
          })
          .eq('id', editTicket.id)

        if (phieuError) throw phieuError
        phieuId = editTicket.id
      } else {
        // Tạo mới Phiếu bảo trì
        const { data: phieu, error: phieuError } = await supabase
          .from('phieu_bao_tri')
          .insert([{
            id_xe: selectedVehicle,
            id_tho_may: selectedMechanic || null,
            trang_thai_phieu: 'Chờ duyệt',
            loai_phieu: loaiPhieu,
            loai_sua_ngoai: loaiPhieu === 'Bên ngoài' ? (loaiSuaNgoai || null) : null,
            don_vi_sua_ngoai: loaiPhieu === 'Bên ngoài' ? (donViSuaNgoai || null) : null,
            ghi_chu_ngoai: loaiPhieu === 'Bên ngoài' ? (ghiChuNgoai || null) : null,
            ngan_hang_ngoai: loaiPhieu === 'Bên ngoài' ? (nganHangNgoai || null) : null,
            so_tai_khoan_ngoai: loaiPhieu === 'Bên ngoài' ? (soTaiKhoanNgoai || null) : null,
            ten_tai_khoan_ngoai: loaiPhieu === 'Bên ngoài' ? (tenTaiKhoanNgoai || null) : null,
            receipt_photo_url: receiptPhotoUrl,
            tong_vat_tu: totalVatTu,
            tien_cong: laborCost,
            tong_chi_phi: totalVatTu + laborCost,
            ngay_tiep_nhan: ngayTiepNhan ? new Date(ngayTiepNhan).toISOString() : new Date().toISOString()
          }])
          .select()
          .single()

        if (phieuError) throw phieuError
        phieuId = phieu.id
      }

      // 2. Upload ảnh và tạo các Chi tiết phiếu
      const chiTietData = await Promise.all(selectedItems.map(async (item, index) => {
        let anhCuUrl = item.anh_cu || null
        let anhMoiUrl = item.anh_moi || null

        // Chỉ upload nếu là base64 (mới chụp)
        if (item.anh_cu?.startsWith('data:image')) {
          anhCuUrl = await uploadBase64Image('t2m-evidence', `parts/${ticketRef}_part${index}_old.webp`, item.anh_cu)
        }
        if (item.anh_moi?.startsWith('data:image')) {
          anhMoiUrl = await uploadBase64Image('t2m-evidence', `parts/${ticketRef}_part${index}_new.webp`, item.anh_moi)
        }

        return {
          id_phieu: phieuId,
          id_sku: item.id_sku,
          so_luong: item.so_luong,
          don_gia: item.don_gia,
          thanh_tien: item.so_luong * item.don_gia,
          anh_vat_tu_cu_url: anhCuUrl || "",
          anh_vat_tu_moi_url: anhMoiUrl || ""
        }
      }))

      // Nếu là edit, xóa các chi tiết vật tư cũ trước khi chèn mới để tránh trùng lặp
      if (editTicket) {
        const { error: delError } = await supabase
          .from('chi_tiet_vat_tu_su_dung')
          .delete()
          .eq('id_phieu', editTicket.id)
        if (delError) throw delError
      }

      const { error: ctError } = await supabase
        .from('chi_tiet_vat_tu_su_dung')
        .insert(chiTietData)

      if (ctError) throw ctError

      // Ghi nhật ký
      await logAction(
        authUser?.email, 
        editTicket ? 'CẬP NHẬT' : 'TẠO MỚI', 
        'Phiếu', 
        editTicket 
          ? `Cập nhật phiếu bảo trì ${editTicket.ma_phieu || editTicket.id.slice(0, 8)} cho xe ${selectedVehicle}`
          : `Lập phiếu bảo trì mới cho xe ${selectedVehicle}`
      )

      toast.success(editTicket ? 'Cập nhật phiếu bảo trì thành công!' : 'Lập phiếu bảo trì thành công!')
      
      // Trigger Telegram notification in the background
      try {
        const vehiclePlate = vehicles.find(v => v.id === selectedVehicle)?.bien_so || selectedVehicle
        const mechanicProfile = mechanics.find(m => m.id === selectedMechanic)
        const mechanicName = mechanicProfile ? (mechanicProfile.full_name || mechanicProfile.email) : 'Không chỉ định'
        
        let ticketCode = editTicket ? (editTicket.ma_phieu || '') : ''
        if (!editTicket) {
          const { data: newPhieu } = await supabase
            .from('phieu_bao_tri')
            .select('ma_phieu')
            .eq('id', phieuId)
            .single()
          ticketCode = newPhieu?.ma_phieu || ''
        }

        fetch('/api/telegram-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_ticket',
            ticket: {
              ma_phieu: ticketCode || 'N/A',
              bien_so: vehiclePlate,
              loai_phieu: loaiPhieu === 'Bên ngoài' ? `Sửa ngoài (${loaiSuaNgoai || 'Khác'})` : 'Phiếu bảo trì sửa chữa (Nội bộ)',
              tho_may: loaiPhieu === 'Bên ngoài' ? `${donViSuaNgoai || 'N/A'} (Đơn vị sửa ngoài)` : mechanicName,
              ngay_tiep_nhan: ngayTiepNhan ? new Date(ngayTiepNhan).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
              tong_chi_phi: totalVatTu + laborCost
            }
          })
        }).catch(err => console.error('Telegram notification error in Admin:', err))
      } catch (tgErr) {
        console.error('Failed to dispatch Telegram notification in Admin:', tgErr)
      }

      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setSelectedItems([])
      setLaborCost(0)
      setLoaiPhieu('Nội bộ')
      setLoaiSuaNgoai('')
      setDonViSuaNgoai('')
      setGhiChuNgoai('')
      setNganHangNgoai('')
      setSoTaiKhoanNgoai('')
      setTenTaiKhoanNgoai('')
      setReceiptPhotoBase64(null)
    } catch (error: any) {
      console.error('Submit Error:', error)
      toast.error('Lỗi khi lập/cập nhật phiếu: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              {editTicket ? <Wrench className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
              {editTicket ? 'Chỉnh sửa phiếu bảo trì' : 'Lập phiếu bảo trì mới'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editTicket 
                ? `Cập nhật thông tin chi tiết phiếu bảo trì cho xe ${vehicles.find(v => v.id === selectedVehicle)?.bien_so || ''}` 
                : 'Admin tạo phiếu trực tiếp cho phương tiện và gán người thực hiện (Thợ máy/Tài xế/Điều độ).'}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-slate-400">Đang tải thông tin...</p>
            </div>
          ) : (
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Truck className="w-4 h-4 text-slate-500" /> Chọn phương tiện</Label>
                  <div className="flex gap-2">
                    <Select value={selectedVehicle} onValueChange={(val: any) => setSelectedVehicle(val)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Chọn biển số xe..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        {vehicles.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.bien_so}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0 bg-slate-800 border-slate-700 hover:bg-primary/20 hover:border-primary/50"
                      onClick={() => setShowAddVehicle(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><User className="w-4 h-4 text-slate-500" /> Người thực hiện / Chịu trách nhiệm</Label>
                  <div className="flex gap-2">
                    <Select value={selectedMechanic} onValueChange={(val: any) => setSelectedMechanic(val)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue>
                          {selectedMechanic 
                            ? (mechanics.find(m => m.id === selectedMechanic)?.full_name || mechanics.find(m => m.id === selectedMechanic)?.email || "Đang tải tên...") 
                            : "Chọn người thực hiện..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        {mechanics.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                m.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                                m.role === 'MECHANIC' ? 'bg-orange-500/20 text-orange-400' : 
                                m.role === 'DRIVER' ? 'bg-blue-500/20 text-blue-400' : 
                                'bg-purple-500/20 text-purple-400'
                              }`}>
                                {m.role === 'ADMIN' ? 'Admin' : m.role === 'MECHANIC' ? 'Thợ' : m.role === 'DRIVER' ? 'Tài' : 'N.Sự'}
                              </span>
                              {m.full_name || m.email}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0 bg-slate-800 border-slate-700 hover:bg-primary/20 hover:border-primary/50"
                      onClick={() => setShowAddMechanic(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /> Ngày tiếp nhận</Label>
                  <Input 
                    type="date"
                    value={ngayTiepNhan}
                    onChange={(e) => setNgayTiepNhan(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="bg-slate-800 border-slate-700 text-slate-100 w-full [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Loại phiếu */}
              <div className="space-y-4 border-t border-slate-800 pt-6">
                <Label className="flex items-center gap-2 text-primary font-bold">
                  <FileText className="w-4 h-4" /> Loại phiếu bảo trì
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                      loaiPhieu === 'Nội bộ'
                        ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                    onClick={() => setLoaiPhieu('Nội bộ')}
                  >
                    <Wrench className="w-5 h-5 mx-auto mb-1" />
                    Nội bộ (Gara)
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                      loaiPhieu === 'Bên ngoài'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/10'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                    onClick={() => setLoaiPhieu('Bên ngoài')}
                  >
                    <MapPin className="w-5 h-5 mx-auto mb-1" />
                    Bên ngoài
                  </button>
                </div>

                {loaiPhieu === 'Bên ngoài' && (
                  <div className="space-y-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-amber-400 text-xs font-bold uppercase tracking-wider">Tên đơn vị sửa (Tiệm/Gara ngoài) <span className="text-red-500">*</span></Label>
                        <ComboboxRoot<string>
                          value={donViSuaNgoai || null}
                          onValueChange={(val) => {
                            if (val) setDonViSuaNgoai(val)
                          }}
                          onInputValueChange={(val) => setDonViSuaNgoai(val)}
                        >
                          <ComboboxInputGroup className="relative w-full">
                            <ComboboxInput
                              placeholder="VD: Vá vỏ lưu động ABC..."
                              className="bg-slate-800 border-amber-500/30 text-slate-100 w-full pr-10"
                              required
                            />
                            <ComboboxTrigger className="absolute right-0 top-0 h-full w-10 px-0 flex items-center justify-center bg-transparent border-none text-slate-400 hover:text-slate-200 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" />
                          </ComboboxInputGroup>
                          <ComboboxPopup className="bg-slate-900 border-slate-800 text-slate-100">
                            <ComboboxList>
                              {repairUnits.length > 0 ? (
                                repairUnits.map((unit) => (
                                  <ComboboxItem key={unit} value={unit}>
                                    {unit}
                                  </ComboboxItem>
                                ))
                              ) : (
                                <ComboboxEmpty>Chưa có đơn vị nào</ComboboxEmpty>
                              )}
                            </ComboboxList>
                          </ComboboxPopup>
                        </ComboboxRoot>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-amber-400 text-xs font-bold uppercase tracking-wider">Loại sửa chữa <span className="text-red-500">*</span></Label>
                        <Select value={loaiSuaNgoai} onValueChange={(val: any) => setLoaiSuaNgoai(val)}>
                          <SelectTrigger className="bg-slate-800 border-amber-500/30 text-slate-100">
                            <SelectValue placeholder="Chọn loại..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                            <SelectItem value="Vá vỏ">🔧 Vá vỏ</SelectItem>
                            <SelectItem value="Thay vỏ">🛞 Thay vỏ</SelectItem>
                            <SelectItem value="Bảo trì lớn">🏗️ Bảo trì lớn</SelectItem>
                            <SelectItem value="Khác">📋 Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-400 text-xs font-bold uppercase tracking-wider">Mô tả sự cố & Ghi chú</Label>
                      <textarea
                        value={ghiChuNgoai}
                        onChange={(e) => setGhiChuNgoai(e.target.value)}
                        placeholder="VD: Vỏ trước bên phải bị đinh, lòi bố..."
                        className="w-full min-h-[80px] bg-slate-800 border border-amber-500/30 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                      />
                    </div>
                    
                    {/* Thông tin chuyển khoản thanh toán */}
                    <div className="pt-3 border-t border-amber-500/20 space-y-3">
                      <Label className="text-amber-400 text-xs font-bold uppercase tracking-wider block">Thông tin thanh toán chuyển khoản (VietQR)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Bước 1: Chọn Tên chủ tài khoản */}
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-[11px]">Tên chủ tài khoản</Label>
                          {!isNewPayee ? (
                            <select
                              value={tenTaiKhoanNgoai}
                              onChange={(e) => handlePayeeSelect(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-100"
                            >
                              <option value="">Chọn người nhận...</option>
                              {payeeAccounts.map((p, idx) => (
                                <option key={`${p.ten}-${p.so_tk}-${idx}`} value={p.ten}>
                                  {p.ten} ({banks.find(b => b.code === p.ngan_hang)?.shortName || p.ngan_hang})
                                </option>
                              ))}
                              <option value="__NEW__">➕ Thêm người nhận mới...</option>
                            </select>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                value={tenTaiKhoanNgoai}
                                onChange={(e) => setTenTaiKhoanNgoai(e.target.value.toUpperCase())}
                                placeholder="NHẬP TÊN CHỦ TK MỚI..."
                                className="bg-slate-800 border-amber-500/30 text-slate-100 font-mono flex-1"
                                autoFocus
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0"
                                onClick={() => {
                                  setIsNewPayee(false)
                                  setTenTaiKhoanNgoai('')
                                  setNganHangNgoai('')
                                  setSoTaiKhoanNgoai('')
                                }}
                                title="Quay lại chọn từ danh sách"
                              >
                                ✕
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* Bước 2: Ngân hàng (tự điền hoặc chọn) */}
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-[11px]">Ngân hàng</Label>
                          <select
                            value={nganHangNgoai}
                            onChange={(e) => setNganHangNgoai(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-slate-100"
                          >
                            <option value="">Chọn ngân hàng...</option>
                            {banks.map(b => (
                              <option key={b.code} value={b.code}>{b.customLabel}</option>
                            ))}
                          </select>
                        </div>
                        {/* Bước 3: Số tài khoản (tự điền, cho phép sửa) */}
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-[11px]">Số tài khoản</Label>
                          <div className="flex gap-2">
                            <Input
                              value={soTaiKhoanNgoai}
                              onChange={(e) => setSoTaiKhoanNgoai(e.target.value)}
                              placeholder="Nhập số tài khoản..."
                              className="bg-slate-800 border-slate-700 text-slate-100 flex-1"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white px-3"
                              onClick={lookupAccountName}
                              disabled={isLookingUp || !nganHangNgoai || !soTaiKhoanNgoai}
                              title="Tra cứu tự động tên chủ tài khoản"
                            >
                              {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Search className="w-4 h-4 text-amber-500" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-500/20">
                      <Label className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 block">Ảnh Hóa Đơn / Phiếu Thu (Nếu có)</Label>
                      <SinglePhotoUploader 
                        title="Chụp/Tải lên hóa đơn" 
                        required={false}
                        initialUrl={editTicket?.receipt_photo_url}
                        onPhotoChange={setReceiptPhotoBase64}
                      />
                    </div>
                  </div>
                )}

                {loaiPhieu === 'Nội bộ' && (
                  <div className="space-y-3 bg-primary/5 border border-primary/20 rounded-xl p-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <Label className="text-primary text-xs font-bold uppercase tracking-wider mb-2 block">Ảnh Hóa Đơn / Phiếu Thu (Nếu có)</Label>
                    <SinglePhotoUploader 
                      title="Chụp/Tải lên hóa đơn" 
                      required={false}
                      initialUrl={editTicket?.receipt_photo_url}
                      onPhotoChange={setReceiptPhotoBase64}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t border-slate-800 pt-6">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-primary font-bold">
                    <Package className="w-4 h-4" /> Danh mục Vật tư & Dịch vụ
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(val: any) => addItem(val)}>
                      <SelectTrigger className="w-[250px] h-8 bg-primary/10 border-primary/20 text-primary text-xs">
                        <SelectValue placeholder="+ Thêm Vật tư / Dịch vụ" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <div className="px-2 py-1 text-[10px] text-slate-500 font-bold uppercase">Vật tư</div>
                        {skus.filter(s => s.loai !== 'Dịch vụ').map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.ten_vat_tu} ({s.don_vi_tinh})</SelectItem>
                        ))}
                        <div className="px-2 py-1 mt-2 text-[10px] text-slate-500 font-bold uppercase border-t border-slate-800">Dịch vụ</div>
                        {skus.filter(s => s.loai === 'Dịch vụ').map(s => (
                          <SelectItem key={s.id} value={s.id}>🛠️ {s.ten_vat_tu}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0 h-8 w-8 bg-slate-800 border-slate-700 hover:bg-primary/20 hover:border-primary/50"
                      onClick={() => setShowAddPart(true)}
                      title="Tạo danh mục vật tư mới"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedItems.length > 0 ? (
                    selectedItems.map((item) => (
                      <div key={item.id_sku} className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                        {/* Desktop & Tablet View */}
                        <div className="hidden md:flex items-center gap-3 p-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${item.loai === 'Dịch vụ' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                                {item.loai === 'Dịch vụ' ? 'Dịch vụ' : 'Vật tư'}
                              </span>
                              <p className="text-sm font-medium truncate">{item.name}</p>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">#{item.id_sku.slice(0, 8)}</p>
                          </div>
                          <div className="w-20">
                            <Input 
                              type="number" 
                              value={item.so_luong} 
                              onChange={(e) => updateItem(item.id_sku, 'so_luong', Number(e.target.value))}
                              className="h-8 bg-slate-900 border-slate-700 text-center"
                              min={1}
                              onFocus={(e) => e.target.select()}
                            />
                          </div>
                          <div className="w-28">
                            <Input 
                              type="number" 
                              value={item.don_gia} 
                              onChange={(e) => updateItem(item.id_sku, 'don_gia', Number(e.target.value))}
                              className="h-8 bg-slate-900 border-slate-700 text-right font-mono"
                              onFocus={(e) => e.target.select()}
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-red-400"
                            onClick={() => removeItem(item.id_sku)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Mobile Card Layout */}
                        <div className="flex md:hidden flex-col gap-3 p-3 animate-in fade-in-20 duration-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase ${item.loai === 'Dịch vụ' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                                  {item.loai === 'Dịch vụ' ? 'Dịch vụ' : 'Vật tư'}
                                </span>
                                <p className="text-xs font-semibold text-slate-200 line-clamp-2">{item.name}</p>
                              </div>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">#{item.id_sku.slice(0, 8)}</p>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-red-400 shrink-0 bg-slate-900/30 hover:bg-red-500/10"
                              onClick={() => removeItem(item.id_sku)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-slate-900/30 p-2.5 rounded-md border border-slate-700/50">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-400 font-bold uppercase">Số lượng</Label>
                              <Input 
                                type="number" 
                                value={item.so_luong} 
                                onChange={(e) => updateItem(item.id_sku, 'so_luong', Number(e.target.value))}
                                className="h-8 bg-slate-900 border-slate-700 text-center text-xs"
                                min={1}
                                onFocus={(e) => e.target.select()}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-400 font-bold uppercase">Đơn giá (đ)</Label>
                              <Input 
                                type="number" 
                                value={item.don_gia} 
                                onChange={(e) => updateItem(item.id_sku, 'don_gia', Number(e.target.value))}
                                className="h-8 bg-slate-900 border-slate-700 text-right font-mono text-xs"
                                onFocus={(e) => e.target.select()}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Ảnh minh chứng cho từng hạng mục */}
                        <div className="px-3 pb-3 pt-1 border-t border-slate-700/50 bg-slate-900/20">
                          <PhotoUploader 
                            initialOldUrl={item.anh_cu}
                            initialNewUrl={item.anh_moi}
                            onPhotosChange={(photos) => {
                              updateItem(item.id_sku, 'anh_cu', photos.oldPartBase64 || item.anh_cu)
                              updateItem(item.id_sku, 'anh_moi', photos.newPartBase64 || item.anh_moi)
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-20 border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-sm">
                      Chưa có hạng mục nào được chọn.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
                <div className="space-y-2">
                  <Label>Tiền công thợ (đ)</Label>
                  <Input 
                    type="number" 
                    value={laborCost} 
                    onChange={(e) => setLaborCost(Number(e.target.value))}
                    className="bg-slate-800 border-slate-700 font-mono"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div className="flex flex-col items-end justify-center">
                  <p className="text-xs text-slate-500 uppercase font-bold">Tổng chi phí dự kiến</p>
                  <p className="text-2xl font-bold text-primary font-mono">
                    {(calculateTotalVatTu() + laborCost).toLocaleString()} đ
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-800 pt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading} className="min-w-[120px] bg-primary hover:bg-primary/90 font-bold">
              {isSubmitting ? (
                editTicket ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang cập nhật...</>
                ) : (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...</>
                )
              ) : (
                editTicket ? 'CẬP NHẬT PHIẾU' : 'TẠO PHIẾU'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <VehicleDialog 
      open={showAddVehicle} 
      onOpenChange={setShowAddVehicle} 
      onSuccess={(id) => fetchMasterData(id, 'vehicle')} 
    />
    
    <UserRoleDialog 
      open={showAddMechanic} 
      onOpenChange={setShowAddMechanic} 
      onSuccess={(id) => fetchMasterData(id, 'mechanic')}
      user={null}
    />

    <PartDialog 
      open={showAddPart} 
      onOpenChange={setShowAddPart} 
      onSuccess={(id) => fetchMasterData(id, 'sku')}
    />
    </>
  )
}
