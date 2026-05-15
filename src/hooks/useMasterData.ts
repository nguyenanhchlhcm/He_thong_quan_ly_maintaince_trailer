'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Xe, VatTuSKU, Gara, Profile, DichVu, KhachHang, NhaCungCap } from '@/types/database'

export const MASTER_DATA_KEYS = {
  all: ['master-data'] as const,
  vehicles: ['master-data', 'vehicles'] as const,
  parts: ['master-data', 'parts'] as const,
  garages: ['master-data', 'garages'] as const,
  users: ['master-data', 'users'] as const,
  logs: ['master-data', 'logs'] as const,
  services: ['master-data', 'services'] as const,
  customers: ['master-data', 'customers'] as const,
  suppliers: ['master-data', 'suppliers'] as const,
}

export function useVehicles() {
  return useQuery({
    queryKey: MASTER_DATA_KEYS.vehicles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          bien_so:id,
          model,
          loai_xe:model,
          odometer,
          so_km_hien_tai:odometer,
          created_at
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Xe[]
    }
  })
}

export function useParts() {
  return useQuery({
    queryKey: MASTER_DATA_KEYS.parts,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skus')
        .select(`
          id,
          name,
          ten_vat_tu:name,
          nhom_vat_tu,
          unit,
          don_vi_tinh:unit,
          price,
          gia_tham_khao:price,
          loai,
          created_at
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as VatTuSKU[]
    }
  })
}

export function useGarages() {
  return useQuery({
    queryKey: MASTER_DATA_KEYS.garages,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('garages')
        .select(`
          id,
          name,
          ten_gara:name,
          address,
          dia_chi:address,
          lat,
          toa_do_lat:lat,
          lng,
          toa_do_lng:lng,
          created_at
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Gara[]
    }
  })
}

export function useUsers() {
  return useQuery({
    queryKey: MASTER_DATA_KEYS.users,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    }
  })
}

export function useServices() {
  return useQuery({
    queryKey: MASTER_DATA_KEYS.services,
    queryFn: async () => {
      // Bảng danh_muc_dich_vu chưa tồn tại trong DB mới
      return [] as DichVu[]
    }
  })
}

export function useCustomers() {
  return useQuery({
    queryKey: MASTER_DATA_KEYS.customers,
    queryFn: async () => {
      // Bảng danh_muc_khach_hang chưa tồn tại trong DB mới
      return [] as KhachHang[]
    }
  })
}

export function useSuppliers() {
  return useQuery({
    queryKey: MASTER_DATA_KEYS.suppliers,
    queryFn: async () => {
      // Bảng danh_muc_nha_cung_cap chưa tồn tại trong DB mới
      return [] as NhaCungCap[]
    }
  })
}

export function useAuditLogs() {
  return useQuery({
    queryKey: MASTER_DATA_KEYS.logs,
    queryFn: async () => {
      // Bảng audit_logs chưa tồn tại trong DB mới
      return [] as any[]
    }
  })
}

// Mutations
export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.vehicles })
      toast.success('Đã xóa xe thành công')
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa xe: ' + error.message)
    }
  })
}

export function useDeletePart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('skus').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.parts })
      toast.success('Đã xóa vật tư thành công')
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa vật tư: ' + error.message)
    }
  })
}

export function useDeleteGarage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('garages').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.garages })
      toast.success('Đã xóa Gara thành công')
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa Gara: ' + error.message)
    }
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.users })
      toast.success('Đã xóa nhân viên thành công')
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa nhân viên: ' + error.message)
    }
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('danh_muc_dich_vu').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.services })
      toast.success('Đã xóa dịch vụ thành công')
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa dịch vụ: ' + error.message)
    }
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('danh_muc_khach_hang').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.customers })
      toast.success('Đã xóa khách hàng thành công')
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa khách hàng: ' + error.message)
    }
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('danh_muc_nha_cung_cap').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.suppliers })
      toast.success('Đã xóa nhà cung cấp thành công')
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa nhà cung cấp: ' + error.message)
    }
  })
}
