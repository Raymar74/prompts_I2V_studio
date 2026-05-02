import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Character } from '../types'

interface CharacterStore {
  characters: Character[]
  activeId: string | null
  setActive: (id: string) => void
  upsert: (character: Character) => void
  remove: (id: string) => void
  getActive: () => Character | null
  createBlank: () => Character
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      characters: [],
      activeId: null,

      setActive: (id) => set({ activeId: id }),

      upsert: (character) =>
        set((state) => {
          const exists = state.characters.find((c) => c.id === character.id)
          if (exists) {
            return {
              characters: state.characters.map((c) =>
                c.id === character.id ? character : c
              ),
              activeId: character.id,
            }
          }
          return {
            characters: [...state.characters, character],
            activeId: character.id,
          }
        }),

      remove: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          activeId:
            state.activeId === id
              ? state.characters[0]?.id || null
              : state.activeId,
        })),

      getActive: () => {
        const { characters, activeId } = get()
        return characters.find((c) => c.id === activeId) || null
      },

      createBlank: (): Character => ({
        id: crypto.randomUUID(),
        nombre: 'Nuevo Personaje',
        ocupacion: '',
        descripcion: '',
        filosofia: '',
        frasesCaracteristicas: [],
        voz: {
          tono: '',
          latiguillos: [],
          muletillas: [],
          referentes: [],
          evitar: [],
          humorIntensidad: 50,
        },
        produccionVisual: {
          triggerWord: '',
          estiloRecurrente: '',
          estiloOutfit: '',
          expresionesFaciales: [],
          descripcionVisual: '',
          plantillasCamara: [],
          notasExtra: '',
          imagenesBase: [],
          ttsSpeed: 1.0,
          ttsPitch: 0,
        },
      }),
    }),
    { name: 'studio-characters-v3' }
  )
)
