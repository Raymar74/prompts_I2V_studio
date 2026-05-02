import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Paquete } from '../types'

interface BibliotecaStore {
  paquetes: Paquete[]
  add: (paquete: Paquete) => void
  remove: (id: string) => void
  updatePublicado: (id: string, publicado: boolean, url?: string) => void
  getByCharacter: (characterId: string) => Paquete[]
}

export const useBibliotecaStore = create<BibliotecaStore>()(
  persist(
    (set, get) => ({
      paquetes: [],

      add: (paquete) =>
        set((state) => ({ paquetes: [paquete, ...state.paquetes] })),

      remove: (id) =>
        set((state) => ({
          paquetes: state.paquetes.filter((p) => p.id !== id),
        })),

      updatePublicado: (id, publicado, url) =>
        set((state) => ({
          paquetes: state.paquetes.map((p) =>
            p.id === id ? { ...p, publicado, publicadoUrl: url } : p
          ),
        })),

      getByCharacter: (characterId) => {
        const { paquetes } = get()
        return paquetes.filter((p) => p.characterId === characterId)
      },
    }),
    { name: 'studio-biblioteca-v3' }
  )
)
