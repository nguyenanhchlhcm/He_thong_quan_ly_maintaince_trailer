'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Package, Truck, User, Wrench, MapPin, FileText } from 'lucide-react'
import { Xe, VatTuSKU, Profile, LoaiPhieu, LoaiSuaNgoai } from '@/types/database'
import { logAction } from '@/lib/supabase/audit'
import { useAuthStore } from '@/store/authStore'
import { VehicleDialog } from '@/features/master-data/components/VehicleDialog'
import { UserRoleDialog } from '@/features/master-data/components/UserRoleDialog'
import { PartDialog } from '@/features/master-data/components/PartDialog'
import { PhotoUploader } from '@/features/maintenance/components/mechanic/PhotoUploader'

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
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

export function CreateTicketDialog({ open, onOpenChange, onSuccess }: CreateTicketDialogProps) {
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

  useEffect(() => {
    if (open) {
      fetchMasterData()
    }
  }, [open])

  const fetchMasterData = async (autoSelectId?: string, type?: 'vehicle' | 'mechanic' | 'sku') => {
    setIsLoading(true)
    try {
      const [vRes, mRes, sRes] = await Promise.all([
        supabase.from('danh_sach_xe').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('danh_muc_vat_tu_sku').select('*')
      ])
      setVehicles(vRes.data || [])
      setMechanics(mRes.data || [])
      setSkus(sRes.data || [])

      if (autoSelectId) {
        if (type === 'vehicle') setSelectedVehicle(autoSelectId)
        if (type === 'mechanic') setSelectedMechanic(autoSelectId)
        if (type === 'sku') {
          const newSku = (sRes.data || []).find((s: VatTuSKU) => s.id === autoSelectId)
          if (newSku && !selectedItems.find(item => item.id_sku === autoSelectId)) {
            setSelectedItems(prev => [...prev, {
              id_sku: newSku.id,
              name: newSku.ten_vat_tu,
              so_luong: 1,
              don_gia: newSku.gia_tham_khao || 0,
              loai: newSku.loai || 'Vật tư',
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
      name: sku.ten_vat_tu,
      so_luong: 1,
      don_gia: sku.gia_tham_khao || 0,
      loai: sku.loai || 'Vật tư',
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

  const { user: authUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle) return toast.error('Vui lòng chọn xe')
    if (selectedItems.length === 0) {
      return toast.error('Vui lòng thêm ít nhất 1 hạng mục (Vật tư hoặc Dịch vụ)')
    }

    setIsSubmitting(true)
    const totalVatTu = calculateTotalVatTu()

    try {
      // 1. Tạo Phiếu chính
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
          tong_vat_tu: totalVatTu,
          tien_cong: laborCost,
          tong_chi_phi: totalVatTu + laborCost
        }])
        .select()
        .single()

      if (phieuError) throw phieuError

      // 2. Tạo các Chi tiết phiếu
      const chiTietData = selectedItems.map(item => ({
        id_phieu: phieu.id,
        id_sku: item.id_sku,
        so_luong: item.so_luong,
        don_gia: item.don_gia,
        thanh_tien: item.so_luong * item.don_gia,
        anh_vat_tu_cu_url: item.anh_cu || null,
        anh_vat_tu_moi_url: item.anh_moi || null
      }))

      const { error: ctError } = await supabase
        .from('chi_tiet_vat_tu_su_dung')
        .insert(chiTietData)

      if (ctError) throw ctError

      // Ghi nhật ký
      await logAction(
        authUser?.email, 
        'TẠO MỚI', 
        'Phiếu', 
        `Lập phiếu bảo trì mới cho xe ${selectedVehicle}`
      )

      toast.success('Lập phiếu bảo trì thành công!')
      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setSelectedItems([])
      setLaborCost(0)
      setLoaiPhieu('Nội bộ')
      setLoaiSuaNgoai('')
      setDonViSuaNgoai('')
      setGhiChuNgoai('')
    } catch (error: any) {
      console.error('Submit Error:', error)
      toast.error('Lỗi khi lập phiếu: ' + error.message)
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
              <Plus className="w-6 h-6 text-primary" />
              Lập phiếu bảo trì mới
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Admin tạo phiếu trực tiếp cho phương tiện và gán người thực hiện (Thợ máy/Tài xế/Điều độ).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Truck className="w-4 h-4 text-slate-500" /> Chọn phương tiện</Label>
                <div className="flex gap-2">
                  <Select value={selectedVehicle} onValueChange={(val: any) => setSelectedVehicle(val)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Chọn biển số xe..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      {vehicles.map(v => (
                        <SelectItem key={v.id_xe} value={v.id_xe}>{v.bien_so}</SelectItem>
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
                      <Label className="text-amber-400 text-xs font-bold uppercase tracking-wider">Tên đơn vị sửa (Tiệm/Gara ngoài)</Label>
                      <Input
                        value={donViSuaNgoai}
                        onChange={(e) => setDonViSuaNgoai(e.target.value)}
                        placeholder="VD: Vá vỏ lưu động ABC..."
                        className="bg-slate-800 border-amber-500/30 text-slate-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-400 text-xs font-bold uppercase tracking-wider">Loại sửa chữa</Label>
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
                      <div className="flex items-center gap-3 p-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${item.loai === 'Dịch vụ' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                              {item.loai === 'Dịch vụ' ? 'Dịch vụ' : 'Vật tư'}
                            </span>
                            <p className="text-sm font-medium truncate">{item.name}</p>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">#{item.id_sku.slice(0,8)}</p>
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
                      
                      {/* Ảnh minh chứng cho từng hạng mục */}
                      <div className="px-3 pb-3 pt-1 border-t border-slate-700/50 bg-slate-900/20">
                        <PhotoUploader 
                          onPhotosChange={(photos) => {
                            updateItem(item.id_sku, 'anh_cu', photos.oldPartBase64)
                            updateItem(item.id_sku, 'anh_moi', photos.newPartBase64)
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

          <DialogFooter className="border-t border-slate-800 pt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px] bg-primary hover:bg-primary/90 font-bold">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...</>
              ) : (
                'TẠO PHIẾU'
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
