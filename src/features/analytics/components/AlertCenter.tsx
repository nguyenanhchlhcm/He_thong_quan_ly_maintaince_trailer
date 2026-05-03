'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { AlertTriangle, ShieldAlert, Clock, ChevronRight, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SystemAlert {
  target_id: string
  type: 'BẢO TRÌ' | 'GIAN LẬN'
  message: string
  severity: 'HIGH' | 'CRITICAL'
  created_at: string
}

export function AlertCenter() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAlerts(data || [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="p-4 text-slate-500 animate-pulse">Đang quét hệ thống...</div>

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Bell className="w-5 h-5 text-amber-500" />
            Trung tâm Cảnh báo
          </CardTitle>
          <CardDescription>Các vấn đề cần xử lý ngay lập tức.</CardDescription>
        </div>
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          {alerts.length} Cảnh báo
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <div 
              key={`${alert.target_id}-${index}`}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:bg-slate-800/50 ${
                alert.severity === 'CRITICAL' 
                ? 'bg-red-500/5 border-red-500/20' 
                : 'bg-amber-500/5 border-amber-500/20'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {alert.type === 'GIAN LẬN' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    alert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {alert.type}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-200">{alert.message}</p>
                
                <div className="pt-2">
                  <Link 
                    href={alert.type === 'GIAN LẬN' ? '/admin/tickets' : '/admin/master-data?tab=vehicles'}
                  >
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-slate-400 hover:text-primary p-0">
                      Xử lý ngay <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
            Hệ thống đang ở trạng thái an toàn. Chưa có cảnh báo nào.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
