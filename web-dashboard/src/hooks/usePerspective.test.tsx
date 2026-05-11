import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useAvailablePerspectives,
  useNavItems,
  useBootstrapPerspective,
} from '@/hooks/usePerspective'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import type { UserProfile } from '@/types/auth.types'

function setUserRoles(roles: string[]) {
  const user: UserProfile = {
    id: '1', name: 'X', email: 'x@x', role: 'user', roles, permissions: [],
  }
  useAuthStore.setState({ user, isAuthenticated: true })
}

describe('useAvailablePerspectives', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it('returns ["saya"] for pure Member', () => {
    setUserRoles(['VT Member'])
    const { result } = renderHook(() => useAvailablePerspectives())
    expect(result.current).toEqual(['saya'])
  })

  it('returns ["saya","tim"] for Leader', () => {
    setUserRoles(['VT Member', 'VT Leader'])
    const { result } = renderHook(() => useAvailablePerspectives())
    expect(result.current).toEqual(['saya', 'tim'])
  })

  it('returns ["saya","tim","admin"] for Manager', () => {
    setUserRoles(['VT Member', 'VT Leader', 'VT Manager'])
    const { result } = renderHook(() => useAvailablePerspectives())
    expect(result.current).toEqual(['saya', 'tim', 'admin'])
  })

  it('returns ["admin"] for Administrator-only', () => {
    setUserRoles(['Administrator'])
    const { result } = renderHook(() => useAvailablePerspectives())
    expect(result.current).toEqual(['admin'])
  })

  it('returns ["saya"] for unauthenticated / no roles', () => {
    useAuthStore.setState({ user: null })
    const { result } = renderHook(() => useAvailablePerspectives())
    expect(result.current).toEqual(['saya'])
  })
})

describe('useNavItems', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null })
    useUiStore.setState({ perspective: 'saya' })
  })

  it('filters by current perspective', () => {
    setUserRoles(['VT Member', 'VT Leader'])
    useUiStore.setState({ perspective: 'tim' })
    const { result } = renderHook(() => useNavItems())
    expect(result.current.map((i) => i.key)).toEqual(['leader-dashboard', 'leader-review'])
  })
})

describe('useBootstrapPerspective', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null })
    useUiStore.setState({ perspective: 'saya' })
  })

  it('keeps perspective when it is in available set', () => {
    setUserRoles(['VT Member', 'VT Leader'])
    useUiStore.setState({ perspective: 'tim' })
    renderHook(() => useBootstrapPerspective())
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('downgrades tim -> saya when role revoked', () => {
    setUserRoles(['VT Member'])
    useUiStore.setState({ perspective: 'tim' })
    renderHook(() => useBootstrapPerspective())
    expect(useUiStore.getState().perspective).toBe('saya')
  })

  it('downgrades admin -> tim when admin role revoked but Leader remains', () => {
    setUserRoles(['VT Member', 'VT Leader'])
    useUiStore.setState({ perspective: 'admin' })
    renderHook(() => useBootstrapPerspective())
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('falls back to saya for unauthenticated user with persisted tim', () => {
    useUiStore.setState({ perspective: 'tim' })
    useAuthStore.setState({ user: null })
    renderHook(() => useBootstrapPerspective())
    expect(useUiStore.getState().perspective).toBe('saya')
  })
})
