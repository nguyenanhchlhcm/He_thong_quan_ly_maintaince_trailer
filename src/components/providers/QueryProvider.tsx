'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Dữ liệu cũ sau 1 phút
            gcTime: 5 * 60 * 1000, // Giữ trong cache 5 phút
            retry: 1,
            refetchOnWindowFocus: false, // Tránh refetch liên tục khi chuyển tab
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
