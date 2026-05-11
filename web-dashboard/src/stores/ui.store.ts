import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Perspective } from '@/types/perspective.types'

type Theme = 'light' | 'dark' | 'system'
type Density = 'compact' | 'comfortable' | 'spacious'

interface UiState {
  theme: Theme
  sidebarOpen: boolean
  density: Density
  perspective: Perspective
}

interface UiActions {
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setDensity: (density: Density) => void
  setPerspective: (perspective: Perspective) => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export const useUiStore = create<UiState & UiActions>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      density: 'comfortable',
      perspective: 'saya',

      setTheme: (theme: Theme) => {
        applyTheme(theme)
        set({ theme })
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      setDensity: (density: Density) => set({ density }),
      setPerspective: (perspective: Perspective) => set({ perspective }),
    }),
    {
      name: 'dashboard-ui',
      partialize: (state) => ({
        theme: state.theme,
        density: state.density,
        perspective: state.perspective,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)
