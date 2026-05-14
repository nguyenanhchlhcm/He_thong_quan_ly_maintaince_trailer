'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TireTable } from '@/features/master-data/tires/components/TireTable'
import { TireDialog } from '@/features/master-data/tires/components/TireDialog'
import { AssignTireDialog } from '@/features/master-data/tires/components/AssignTireDialog'
import { QuanLyVoXe } from '@/types/database'
import { Disc, AlertTriangle, Truck, RefreshCw, Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function TiresPage() {
  const [tires, setTires] = useState<QuanLyVoXe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [selectedTire, setSelectedTire] = useState<QuanLyVoXe | null>(null)
  const [isTireDialogOpen, setIsTireDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  const fetchTires = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('quan_ly_vo_xe')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTires(data || [])
    } catch (error: any) {
      console.error('Error fetching tires:', error)
      toast.error('Lỗi khi tải danh sách lốp: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTires()
  }, [fetchTires])

  const runningTires = tires.filter(t => t.trang_thai_vo === 'Đang chạy').length
  const retreadTires = tires.filter(t => t.trang_thai_vo === 'Chờ đắp').length
  const scrappedTires = tires.filter(t => t.trang_thai_vo === 'Thanh lý').length

  const handleDeleteTire = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lốp ${id} không?`)) return
    try {
      const { error } = await supabase.from('quan_ly_vo_xe').delete().eq('id_vo', id)
      if (error) throw error
      toast.success('Đã xóa lốp thành công')
      fetchTires()
    } catch (error: any) {
      toast.error('Lỗi khi xóa lốp: ' + error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-400">Đang tải danh sách lốp xe...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ... (existing stats cards) ... */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <Disc className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Tổng số lốp</p>
              <h3 className="text-2xl font-bold text-slate-100">{tires.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Đang hoạt động</p>
              <h3 className="text-2xl font-bold text-slate-100">{runningTires}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Chờ đắp</p>
              <h3 className="text-2xl font-bold text-slate-100">{retreadTires}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Thanh lý</p>
              <h3 className="text-2xl font-bold text-slate-100">{scrappedTires}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <CardTitle>Danh sách Serial Number</CardTitle>
          <CardDescription>
            Bảng theo dõi tình trạng lốp thực tế từ Database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TireTable 
            data={tires} 
            onEdit={(tire) => { setSelectedTire(tire); setIsTireDialogOpen(true); }} 
            onAssign={(tire) => { setSelectedTire(tire); setIsAssignDialogOpen(true); }} 
            onDelete={handleDeleteTire}
            onAdd={() => { setSelectedTire(null); setIsTireDialogOpen(true); }}
            onRefresh={fetchTires}
          />
        </CardContent>
      </Card>

      <TireDialog 
        key={selectedTire ? `edit-${selectedTire.id_vo}` : 'add-tire'}
        open={isTireDialogOpen}
        onOpenChange={(open) => { setIsTireDialogOpen(open); if (!open) setSelectedTire(null); }}
        onSuccess={fetchTires}
        initialData={selectedTire}
      />

      <AssignTireDialog 
        key={selectedTire ? `assign-${selectedTire.id_vo}` : 'assign-none'}
        open={isAssignDialogOpen}
        onOpenChange={(open) => { setIsAssignDialogOpen(open); if (!open) setSelectedTire(null); }}
        onSuccess={fetchTires}
        tire={selectedTire}
      />
    </div>
  )
}
