import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSayaBadgeCount, useTimBadgeCount } from '@/hooks/usePerspectiveBadges'
import { useNotificationStore } from '@/stores/notification.store'
import { apiClient } from '@/services/api.client'

vi.mock('@/services/api.client', () => ({
  apiClient: { get: vi.fn() },
}))

function wrap({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useSayaBadgeCount', () => {
  beforeEach(() => {
    useNotificationStore.setState({ items: [], unreadCount: 0 })
  })

  it('returns unread notification count', () => {
    useNotificationStore.setState({
      items: [
        { id: '1', title: 'a', message: 'b', type: 'info', isRead: false, createdAt: '' },
        { id: '2', title: 'a', message: 'b', type: 'info', isRead: true, createdAt: '' },
      ],
      unreadCount: 1,
    })
    const { result } = renderHook(() => useSayaBadgeCount())
    expect(result.current).toBe(1)
  })

  it('returns 0 when no unread items', () => {
    const { result } = renderHook(() => useSayaBadgeCount())
    expect(result.current).toBe(0)
  })
})

describe('useTimBadgeCount', () => {
  it('returns review-queue length from API', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      message: { items: [{ id: 'T1' }, { id: 'T2' }, { id: 'T3' }] },
    } as never)
    const { result } = renderHook(() => useTimBadgeCount(), { wrapper: wrap })
    await waitFor(() => expect(result.current).toBe(3))
  })

  it('returns 0 silently when API errors', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useTimBadgeCount(), { wrapper: wrap })
    await waitFor(() => expect(result.current).toBe(0))
  })
})
