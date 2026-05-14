'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Truck, Users, Warehouse, Package, Loader2, History, RefreshCcw, Wrench } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VehicleTable } from '@/features/master-data/components/VehicleTable'
import { PartTable } from '@/features/master-data/components/PartTable'
import { GarageTable } from '@/features/master-data/components/GarageTable'
import { UserTable } from '@/features/master-data/components/UserTable'
import { VehicleDialog } from '@/features/master-data/components/VehicleDialog'
import { PartDialog } from '@/features/master-data/components/PartDialog'
import { GarageDialog } from '@/features/master-data/components/GarageDialog'
import { UserRoleDialog } from '@/features/master-data/components/UserRoleDialog'
import { ServiceTable } from '@/features/master-data/components/ServiceTable'
import { ServiceDialog } from '@/features/master-data/components/ServiceDialog'
import { CustomerTable } from '@/features/master-data/components/CustomerTable'
import { CustomerDialog } from '@/features/master-data/components/CustomerDialog'
import { SupplierTable } from '@/features/master-data/components/SupplierTable'
import { SupplierDialog } from '@/features/master-data/components/SupplierDialog'
import { Xe, VatTuSKU, Gara, Profile, DichVu, KhachHang, NhaCungCap } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { useVehicles, useParts, useGarages, useUsers, useAuditLogs, useServices, useCustomers, useSuppliers, useDeleteVehicle, useDeletePart, useDeleteGarage, useDeleteUser, useDeleteService, useDeleteCustomer, useDeleteSupplier, MASTER_DATA_KEYS } from '@/hooks/useMasterData'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

function MasterDataContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'vehicles'
  const [activeTab, setActiveTab] = useState(initialTab)
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const isAdmin = (profile?.role as string)?.toUpperCase() === 'ADMIN'
  
  // React Query Hooks
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles()
  const { data: parts = [], isLoading: isLoadingParts } = useParts()
  const { data: garages = [], isLoading: isLoadingGarages } = useGarages()
  const { data: users = [], isLoading: isLoadingUsers } = useUsers()
  const { data: logs = [], isLoading: isLoadingLogs } = useAuditLogs()
  const { data: services = [], isLoading: isLoadingServices } = useServices()
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers()
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers()

  // Mutation Hooks
  const deleteVehicle = useDeleteVehicle()
  const deletePart = useDeletePart()
  const deleteGarage = useDeleteGarage()
  const deleteUser = useDeleteUser()
  const deleteService = useDeleteService()
  const deleteCustomer = useDeleteCustomer()
  const deleteSupplier = useDeleteSupplier()
  
  const [selectedVehicle, setSelectedVehicle] = useState<Xe | null>(null)
  const [selectedPart, setSelectedPart] = useState<VatTuSKU | null>(null)
  const [selectedGarage, setSelectedGarage] = useState<Gara | null>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [selectedService, setSelectedService] = useState<DichVu | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<KhachHang | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<NhaCungCap | null>(null)

  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false)
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false)
  const [isGarageDialogOpen, setIsGarageDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const handleDeleteVehicle = (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa xe ${id} không?`)) return
    deleteVehicle.mutate(id)
  }

  const handleDeletePart = (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vật tư này không?`)) return
    deletePart.mutate(id)
  }

  const handleDeleteGarage = (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Gara này không?`)) return
    deleteGarage.mutate(id)
  }

  const handleDeleteUser = (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên này không?`)) return
    deleteUser.mutate(id)
  }

  const handleDeleteService = (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa dịch vụ này không?`)) return
    deleteService.mutate(id)
  }

  const handleDeleteCustomer = (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng này không?`)) return
    deleteCustomer.mutate(id)
  }

  const handleDeleteSupplier = (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp này không?`)) return
    deleteSupplier.mutate(id)
  }

  const isLoading = isLoadingVehicles || isLoadingParts || isLoadingGarages || isLoadingUsers || isLoadingLogs || isLoadingServices || isLoadingCustomers || isLoadingSuppliers

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-400 animate-pulse">Đang đồng bộ dữ liệu với cache React Query...</p>
      </div>
    )
  }

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.all })
    toast.success('Đã làm mới dữ liệu từ server')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Quản lý Danh mục</h1>
          <p className="text-slate-400">Dữ liệu thực tế từ hệ thống quản trị C.H.L.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshAll}
          className="border-slate-800 text-slate-400 hover:text-primary hover:border-primary/50 gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Làm mới bộ nhớ đệm
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1">
          <TabsTrigger value="vehicles" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Truck className="w-4 h-4" />
            Đội xe
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="w-4 h-4" />
            Vật tư
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Wrench className="w-4 h-4" />
            Dịch vụ
          </TabsTrigger>
          <TabsTrigger value="garages" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Warehouse className="w-4 h-4" />
            Gara
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4" />
            Khách hàng
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Truck className="w-4 h-4" />
            Nhà cung cấp
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              Nhân viên
            </TabsTrigger>
          )}
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

        <TabsContent value="materials" className="outline-none">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Danh mục Vật tư & SKU</CardTitle>
              <CardDescription>Quản lý danh sách phụ tùng và vật tư tiêu hao.</CardDescription>
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

        <TabsContent value="services" className="outline-none">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Danh mục Dịch vụ & Tiền công</CardTitle>
              <CardDescription>Quản lý bảng giá các loại dịch vụ sửa chữa (Vá vỏ, Thay nhớt...).</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceTable 
                data={services} 
                onEdit={(service) => { setSelectedService(service); setIsServiceDialogOpen(true); }} 
                onDelete={handleDeleteService} 
                onAdd={() => { setSelectedService(null); setIsServiceDialogOpen(true); }}
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

        <TabsContent value="customers" className="outline-none">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Danh sách Khách hàng</CardTitle>
              <CardDescription>Quản lý thông tin đối tác thuê xe và khách hàng vận tải.</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerTable 
                data={customers} 
                onEdit={(customer) => { setSelectedCustomer(customer); setIsCustomerDialogOpen(true); }} 
                onDelete={handleDeleteCustomer} 
                onAdd={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="outline-none">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Danh sách Nhà cung cấp</CardTitle>
              <CardDescription>Quản lý các đơn vị cung cấp vật tư và phụ tùng.</CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierTable 
                data={suppliers} 
                onEdit={(supplier) => { setSelectedSupplier(supplier); setIsSupplierDialogOpen(true); }} 
                onDelete={handleDeleteSupplier} 
                onAdd={() => { setSelectedSupplier(null); setIsSupplierDialogOpen(true); }}
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
        key={selectedVehicle ? `edit-${selectedVehicle.id_xe}` : 'add-vehicle'}
        open={isVehicleDialogOpen} 
        onOpenChange={(open) => { setIsVehicleDialogOpen(open); if (!open) setSelectedVehicle(null); }} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.vehicles })}
        initialData={selectedVehicle}
      />
      <PartDialog 
        key={selectedPart ? `edit-${selectedPart.id}` : 'add-part'}
        open={isPartDialogOpen} 
        onOpenChange={(open) => { setIsPartDialogOpen(open); if (!open) setSelectedPart(null); }} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.parts })}
        initialData={selectedPart}
      />
      <GarageDialog 
        key={selectedGarage ? `edit-${selectedGarage.id}` : 'add-garage'}
        open={isGarageDialogOpen} 
        onOpenChange={(open) => { setIsGarageDialogOpen(open); if (!open) setSelectedGarage(null); }} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.garages })}
        initialData={selectedGarage}
      />
      <UserRoleDialog 
        key={selectedUser ? `edit-${selectedUser.id}` : 'add-user'}
        open={isUserDialogOpen} 
        onOpenChange={(open) => { setIsUserDialogOpen(open); if (!open) setSelectedUser(null); }} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.users })}
        user={selectedUser}
      />
      <ServiceDialog 
        key={selectedService ? `edit-${selectedService.id}` : 'add-service'}
        open={isServiceDialogOpen} 
        onOpenChange={(open) => { setIsServiceDialogOpen(open); if (!open) setSelectedService(null); }} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.services })}
        initialData={selectedService}
      />
      <CustomerDialog 
        key={selectedCustomer ? `edit-${selectedCustomer.id}` : 'add-customer'}
        open={isCustomerDialogOpen} 
        onOpenChange={(open) => { setIsCustomerDialogOpen(open); if (!open) setSelectedCustomer(null); }} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.customers })}
        initialData={selectedCustomer}
      />
      <SupplierDialog 
        key={selectedSupplier ? `edit-${selectedSupplier.id}` : 'add-supplier'}
        open={isSupplierDialogOpen} 
        onOpenChange={(open) => { setIsSupplierDialogOpen(open); if (!open) setSelectedSupplier(null); }} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.suppliers })}
        initialData={selectedSupplier}
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
