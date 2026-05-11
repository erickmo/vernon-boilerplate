import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '@/stores/ui.store'

describe('ui.store perspective', () => {
  beforeEach(() => {
    localStorage.clear()
    useUiStore.setState({ perspective: 'saya' })
  })

  it('defaults to "saya"', () => {
    expect(useUiStore.getState().perspective).toBe('saya')
  })

  it('setPerspective updates state synchronously', () => {
    useUiStore.getState().setPerspective('tim')
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('persists perspective under dashboard-ui key', () => {
    useUiStore.getState().setPerspective('admin')
    const raw = localStorage.getItem('dashboard-ui')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.perspective).toBe('admin')
  })
})
