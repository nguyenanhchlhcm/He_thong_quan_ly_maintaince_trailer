'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Truck, Users, Warehouse, Package, Loader2, History, RefreshCcw } from 'lucide-react'
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
import { Xe, VatTuSKU, Gara, Profile } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { useVehicles, useParts, useGarages, useUsers, useAuditLogs, useDeleteVehicle, useDeletePart, useDeleteGarage, useDeleteUser, MASTER_DATA_KEYS } from '@/hooks/useMasterData'
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

  // Mutation Hooks
  const deleteVehicle = useDeleteVehicle()
  const deletePart = useDeletePart()
  const deleteGarage = useDeleteGarage()
  const deleteUser = useDeleteUser()
  
  const [selectedVehicle, setSelectedVehicle] = useState<Xe | null>(null)
  const [selectedPart, setSelectedPart] = useState<VatTuSKU | null>(null)
  const [selectedGarage, setSelectedGarage] = useState<Gara | null>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false)
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false)
  const [isGarageDialogOpen, setIsGarageDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)

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

  const isLoading = isLoadingVehicles || isLoadingParts || isLoadingGarages || isLoadingUsers || isLoadingLogs

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
          <TabsTrigger value="parts" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="w-4 h-4" />
            Vật tư/Phụ tùng
          </TabsTrigger>
          <TabsTrigger value="garages" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Warehouse className="w-4 h-4" />
            Gara
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
