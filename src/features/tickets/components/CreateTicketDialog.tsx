'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Package, Truck, User } from 'lucide-react'
import { Xe, VatTuSKU, Profile } from '@/types/database'
import { logAction } from '@/lib/supabase/audit'
import { useAuthStore } from '@/store/authStore'
import { VehicleDialog } from '@/features/master-data/components/VehicleDialog'
import { UserRoleDialog } from '@/features/master-data/components/UserRoleDialog'

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

  useEffect(() => {
    if (open) {
      fetchMasterData()
    }
  }, [open])

  const fetchMasterData = async (autoSelectId?: string, type?: 'vehicle' | 'mechanic') => {
    setIsLoading(true)
    try {
      const [vRes, mRes, sRes] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('profiles').select('*').eq('role', 'mechanic'),
        supabase.from('skus').select('*')
      ])
      setVehicles(vRes.data || [])
      setMechanics(mRes.data || [])
      setSkus(sRes.data || [])

      if (autoSelectId) {
        if (type === 'vehicle') setSelectedVehicle(autoSelectId)
        if (type === 'mechanic') setSelectedMechanic(autoSelectId)
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
      name: sku.name,
      so_luong: 1,
      don_gia: sku.price || 0
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
    if (selectedItems.length === 0) return toast.error('Vui lòng thêm ít nhất 1 vật tư')

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
        thanh_tien: item.so_luong * item.don_gia
      }))

      const { error: ctError } = await supabase
        .from('chi_tiet_phieu_bao_tri')
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
    } catch (error: any) {
      console.error('Submit Error:', error)
      toast.error('Lỗi khi lập phiếu: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Plus className="w-6 h-6 text-primary" />
              Lập phiếu bảo trì mới
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Admin tạo phiếu trực tiếp cho phương tiện và gán thợ máy.
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
                        <SelectItem key={v.id} value={v.id}>{v.id} - {v.model}</SelectItem>
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
                <Label className="flex items-center gap-2"><User className="w-4 h-4 text-slate-500" /> Gán thợ máy (Không bắt buộc)</Label>
                <div className="flex gap-2">
                  <Select value={selectedMechanic} onValueChange={(val: any) => setSelectedMechanic(val)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Chọn thợ máy..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      {mechanics.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
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

            <div className="space-y-4 border-t border-slate-800 pt-6">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-primary font-bold">
                  <Package className="w-4 h-4" /> Danh mục vật tư
                </Label>
                <Select onValueChange={(val: any) => addItem(val)}>
                  <SelectTrigger className="w-[200px] h-8 bg-primary/10 border-primary/20 text-primary text-xs">
                    <SelectValue placeholder="+ Thêm vật tư" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    {skus.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item) => (
                    <div key={item.id_sku} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">#{item.id_sku.slice(0,8)}</p>
                      </div>
                      <div className="w-20">
                        <Input 
                          type="number" 
                          value={item.so_luong} 
                          onChange={(e) => updateItem(item.id_sku, 'so_luong', Number(e.target.value))}
                          className="h-8 bg-slate-900 border-slate-700 text-center"
                          min={1}
                        />
                      </div>
                      <div className="w-28 text-right font-mono text-sm">
                        {item.don_gia.toLocaleString()} đ
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
                  ))
                ) : (
                  <div className="h-20 border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-sm">
                    Chưa có vật tư nào được chọn.
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
    </>
  )
}
