import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '@/stores/ui.store'

describe('ui.store drawer', () => {
  beforeEach(() => {
    useUiStore.setState({ drawerOpen: false })
    localStorage.clear()
  })

  it('drawerOpen defaults to false', () => {
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('setDrawerOpen toggles state', () => {
    useUiStore.getState().setDrawerOpen(true)
    expect(useUiStore.getState().drawerOpen).toBe(true)
    useUiStore.getState().setDrawerOpen(false)
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('toggleDrawer flips state', () => {
    expect(useUiStore.getState().drawerOpen).toBe(false)
    useUiStore.getState().toggleDrawer()
    expect(useUiStore.getState().drawerOpen).toBe(true)
    useUiStore.getState().toggleDrawer()
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('drawerOpen is NOT persisted', () => {
    useUiStore.getState().setDrawerOpen(true)
    const raw = localStorage.getItem('dashboard-ui')
    if (raw) {
      const parsed = JSON.parse(raw)
      expect(parsed.state.drawerOpen).toBeUndefined()
    }
  })
})
