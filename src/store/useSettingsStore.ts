import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types'

interface SettingsStore {
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  ollamaUrl: 'http://localhost:11434',
  model: 'llama3.1:8b',
  temperature: 0.8,
  maxTokens: 4096,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    { name: 'studio-settings-v3' }
  )
)
