'use client'

import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard'

export default function AdminPage() {
  return (
    <main className="p-6">
      <h1 className="sr-only">Bảng điều khiển quản trị - Admin Dashboard</h1>
      <AnalyticsDashboard />
    </main>
  )
}
