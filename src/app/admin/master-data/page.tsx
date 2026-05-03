'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Truck, Users, Warehouse, Package, Loader2, History } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VehicleTable } from '@/features/master-data/components/VehicleTable'
import { PartTable } from '@/features/master-data/components/PartTable'
import { GarageTable } from '@/features/master-data/components/GarageTable'
import { UserTable } from '@/features/master-data/components/UserTable'
import { VehicleDialog } from '@/features/master-data/components/VehicleDialog'
import { PartDialog } from '@/features/master-data/components/PartDialog'
import { GarageDialog } from '@/features/master-data/components/GarageDialog'
import { UserRoleDialog } from '@/features/master-data/components/UserRoleDialog'
import { Xe, VatTuSKU, Gara, Profile } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  user_email: string
  action: string
  target: string
  description: string
  created_at: string
}

function MasterDataContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'vehicles'
  const [activeTab, setActiveTab] = useState(initialTab)
  
  const [vehicles, setVehicles] = useState<Xe[]>([])
  const [parts, setParts] = useState<VatTuSKU[]>([])
  const [garages, setGarages] = useState<Gara[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  
  const [selectedVehicle, setSelectedVehicle] = useState<Xe | null>(null)
  const [selectedPart, setSelectedPart] = useState<VatTuSKU | null>(null)
  const [selectedGarage, setSelectedGarage] = useState<Gara | null>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false)
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false)
  const [isGarageDialogOpen, setIsGarageDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [vRes, pRes, gRes, uRes, lRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('skus').select('*').order('created_at', { ascending: false }),
        supabase.from('garages').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ])

      // Xử lý từng phần
      if (vRes.error) toast.error('Không thể tải danh sách xe') 
      else setVehicles(vRes.data || [])

      if (pRes.error) toast.error('Không thể tải danh sách vật tư')
      else setParts(pRes.data || [])

      if (gRes.error) toast.error('Không thể tải danh sách Gara')
      else setGarages(gRes.data || [])

      if (uRes.error) console.warn('Profiles fetch skipped:', uRes.error.message)
      else setUsers(uRes.data || [])

      if (lRes.error) console.warn('Logs fetch failed:', lRes.error.message)
      else setLogs(lRes.data || [])
      
    } catch (error: any) {
      console.error('Critical Fetch Error:', error)
      toast.error('Lỗi kết nối nghiêm trọng: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa xe ${id} không?`)) return
    
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id)
      if (error) throw error
      toast.success('Đã xóa xe thành công')
      fetchData()
    } catch (error: any) {
      toast.error('Lỗi khi xóa xe: ' + error.message)
    }
  }

  const handleDeletePart = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vật tư này không?`)) return
    try {
      const { error } = await supabase.from('skus').delete().eq('id', id)
      if (error) throw error
      toast.success('Đã xóa vật tư thành công')
      fetchData()
    } catch (error: any) {
      toast.error('Lỗi khi xóa vật tư: ' + error.message)
    }
  }

  const handleDeleteGarage = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Gara này không?`)) return
    try {
      const { error } = await supabase.from('garages').delete().eq('id', id)
      if (error) throw error
      toast.success('Đã xóa Gara thành công')
      fetchData()
    } catch (error: any) {
      toast.error('Lỗi khi xóa Gara: ' + error.message)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên này không?`)) return
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      toast.success('Đã xóa nhân viên thành công')
      fetchData()
    } catch (error: any) {
      toast.error('Lỗi khi xóa nhân viên: ' + error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-400 animate-pulse">Đang kết nối với cơ sở dữ liệu Supabase...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Quản lý Danh mục</h1>
        <p className="text-slate-400">Dữ liệu thực tế từ hệ thống quản trị C.H.L.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1">
          <TabsTrigger value="vehicles" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Truck className="w-4 h-4" />
            Đội xe
          </TabsTrigger>
          <TabsTrigger value="parts" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="w-4 h-4" />
            Vật tư/Phụ tùng
          </TabsTrigger>
          <TabsTrigger value="garages" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Warehouse className="w-4 h-4" />
            Gara
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4" />
            Nhân viên
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <History className="w-4 h-4" />
            Nhật ký
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="outline-none">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Danh sách Đội xe</CardTitle>
              <CardDescription>Quản lý thông tin xe đầu kéo, rơ-moóc và xe tải.</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleTable 
                data={vehicles} 
                onEdit={(xe) => { setSelectedVehicle(xe); setIsVehicleDialogOpen(true); }} 
                onDelete={handleDeleteVehicle} 
                onAdd={() => { setSelectedVehicle(null); setIsVehicleDialogOpen(true); }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="outline-none">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Danh mục Vật tư & SKU</CardTitle>
              <CardDescription>Danh sách phụ tùng và vật tư tiêu hao.</CardDescription>
            </CardHeader>
            <CardContent>
              <PartTable 
                data={parts} 
                onEdit={(part) => { setSelectedPart(part); setIsPartDialogOpen(true); }} 
                onDelete={handleDeletePart} 
                onAdd={() => { setSelectedPart(null); setIsPartDialogOpen(true); }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="garages" className="outline-none">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Danh sách Gara</CardTitle>
              <CardDescription>Quản lý các điểm sửa chữa nội bộ và đối tác.</CardDescription>
            </CardHeader>
            <CardContent>
              <GarageTable 
                data={garages} 
                onEdit={(gara) => { setSelectedGarage(gara); setIsGarageDialogOpen(true); }} 
                onDelete={handleDeleteGarage} 
                onAdd={() => { setSelectedGarage(null); setIsGarageDialogOpen(true); }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="outline-none">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Quản lý Nhân sự & Phân quyền</CardTitle>
              <CardDescription>Thiết lập vai trò cho nhân viên trong hệ thống.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable 
                data={users} 
                onEditRole={(user) => { setSelectedUser(user); setIsUserDialogOpen(true); }} 
                onDelete={handleDeleteUser}
                onAdd={() => { setSelectedUser(null); setIsUserDialogOpen(true); }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="outline-none">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Nhật ký Hoạt động Hệ thống</CardTitle>
              <CardDescription>Theo dõi các thao tác quan trọng từ đội ngũ Admin và Thợ máy.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-900">
                    <TableRow className="border-slate-800">
                      <TableHead className="w-[180px]">Thời gian</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Hành động</TableHead>
                      <TableHead>Đối tượng</TableHead>
                      <TableHead>Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-slate-800 text-sm">
                        <TableCell className="text-slate-500 font-mono text-xs">
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="font-medium text-slate-300">{log.user_email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-primary font-medium">{log.target}</TableCell>
                        <TableCell className="text-slate-400">{log.description}</TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-20 text-center text-slate-500 italic">
                          Chưa có nhật ký hoạt động nào.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cửa sổ nhập liệu (Dialogs) - Có Key để đảm bảo làm mới dữ liệu */}
      <VehicleDialog 
        key={selectedVehicle ? `edit-${selectedVehicle.id}` : 'add-vehicle'}
        open={isVehicleDialogOpen} 
        onOpenChange={(open) => { setIsVehicleDialogOpen(open); if (!open) setSelectedVehicle(null); }} 
        onSuccess={fetchData}
        initialData={selectedVehicle}
      />
      <PartDialog 
        key={selectedPart ? `edit-${selectedPart.id}` : 'add-part'}
        open={isPartDialogOpen} 
        onOpenChange={(open) => { setIsPartDialogOpen(open); if (!open) setSelectedPart(null); }} 
        onSuccess={fetchData}
        initialData={selectedPart}
      />
      <GarageDialog 
        key={selectedGarage ? `edit-${selectedGarage.id}` : 'add-garage'}
        open={isGarageDialogOpen} 
        onOpenChange={(open) => { setIsGarageDialogOpen(open); if (!open) setSelectedGarage(null); }} 
        onSuccess={fetchData}
        initialData={selectedGarage}
      />
      <UserRoleDialog 
        key={selectedUser ? `edit-${selectedUser.id}` : 'add-user'}
        open={isUserDialogOpen} 
        onOpenChange={(open) => { setIsUserDialogOpen(open); if (!open) setSelectedUser(null); }} 
        onSuccess={fetchData}
        user={selectedUser}
      />
    </div>
  )
}

export default function MasterDataPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Đang chuẩn bị dữ liệu...</div>}>
      <MasterDataContent />
    </Suspense>
  )
}
