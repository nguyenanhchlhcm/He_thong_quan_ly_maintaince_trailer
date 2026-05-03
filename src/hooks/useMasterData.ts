'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Xe, VatTuSKU, Gara, Profile } from '@/types/database'

export const MASTER_DATA_KEYS = {
  all: ['master-data'] as const,
  vehicles: ['master-data', 'vehicles'] as const,
  parts: ['master-data', 'parts'] as const,
  garages: ['master-data', 'garages'] as const,
  users: ['master-data', 'users'] as const,
  logs: ['master-data', 'logs'] as const,
}

export function useVehicles() {
  return useQuery({
    queryKey: MASTER_DATA_KEYS.vehicles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
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
        .select('*')
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
        .select('*')
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

export function useAuditLogs() {
  return useQuery({
    queryKey: MASTER_DATA_KEYS.logs,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
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

