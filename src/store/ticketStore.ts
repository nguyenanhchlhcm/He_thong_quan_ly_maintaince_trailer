import { create } from 'zustand'
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'

// Custom storage engine using IndexedDB via idb-keyval
// This allows us to store much larger amounts of data (like base64 images) than localStorage
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

export type OfflineTicket = {
  id_xe: string
  id_gara: string
  tien_cong: number
  parts: {
    id_sku: string
    so_luong: number
    don_gia: number
    photos: {
      oldPartBase64: string | null
      newPartBase64: string | null
    }
  }[]
  createdAt: number
}

interface TicketStore {
  draftTicket: OfflineTicket | null
  saveDraft: (ticket: OfflineTicket) => void
  clearDraft: () => void
  pendingSyncQueue: OfflineTicket[]
  addToSyncQueue: (ticket: OfflineTicket) => void
  removeFromSyncQueue: (createdAt: number) => void
  clearSyncQueue: () => void
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set) => ({
      draftTicket: null,
      saveDraft: (ticket) => set({ draftTicket: ticket }),
      clearDraft: () => set({ draftTicket: null }),
      
      pendingSyncQueue: [],
      addToSyncQueue: (ticket) => 
        set((state) => ({ pendingSyncQueue: [...state.pendingSyncQueue, ticket] })),
      removeFromSyncQueue: (createdAt) => 
        set((state) => ({ 
          pendingSyncQueue: state.pendingSyncQueue.filter(t => t.createdAt !== createdAt) 
        })),
      clearSyncQueue: () => set({ pendingSyncQueue: [] })
    }),
    {
      name: 't2m-ticket-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => idbStorage),
    }
  )
)
