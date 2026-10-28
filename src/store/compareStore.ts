import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MAX_COMPARE = 5

interface CompareState {
  ids: number[]
  add: (id: number) => void
  remove: (id: number) => void
  toggle: (id: number) => void
  clear: () => void
  setIds: (ids: number[]) => void
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      ids: [],
      add: (id) =>
        set((state) =>
          state.ids.includes(id)
            ? state
            : { ids: [...state.ids, id].slice(-MAX_COMPARE) },
        ),
      remove: (id) => set((state) => ({ ids: state.ids.filter((i) => i !== id) })),
      toggle: (id) =>
        set((state) =>
          state.ids.includes(id)
            ? { ids: state.ids.filter((i) => i !== id) }
            : { ids: [...state.ids, id].slice(-MAX_COMPARE) },
        ),
      clear: () => set({ ids: [] }),
      setIds: (ids) => set({ ids: [...new Set(ids)].filter((id) => id > 0).slice(0, MAX_COMPARE) }),
    }),
    {
      name: 'compare-storage',
      partialize: (state) => ({ ids: state.ids }),
    },
  ),
)