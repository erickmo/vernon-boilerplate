import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AppNavbar } from '@/layouts/AppNavbar/AppNavbar'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useNotificationStore, type NotificationItem } from '@/stores/notification.store'

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function wrap({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/my-work']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function setUser(roles: string[]) {
  useAuthStore.setState({
    user: { id: '1', name: 'X', email: 'x@x', role: 'user', roles, permissions: [] },
    isAuthenticated: true,
  })
}

function seed(item: Partial<NotificationItem>) {
  useNotificationStore.setState({
    items: [{
      id: 'n1',
      title: 'Pemberitahuan',
      message: 'Detail isi',
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
      ...item,
    }],
    unreadCount: 1,
  })
}

function openDropdownAndClickFirstNotif() {
  const bellBtn = screen.getByLabelText('Notifikasi')
  fireEvent.click(bellBtn)
  const titleEl = screen.getByText('Pemberitahuan')
  const btn = titleEl.closest('button')!
  fireEvent.click(btn)
}

beforeEach(() => {
  navigateMock.mockReset()
  useAuthStore.setState({ user: null })
  useUiStore.setState({ perspective: 'saya' })
  useNotificationStore.setState({ items: [], unreadCount: 0 })
})

describe('AppNavbar notification click', () => {
  it('review request: switches perspective to tim and navigates', () => {
    setUser(['VT Member', 'VT Leader'])
    seed({ kind: 'task-review-requested', taskName: 'VT-7' })
    render(<AppNavbar />, { wrapper: wrap })

    openDropdownAndClickFirstNotif()

    expect(useUiStore.getState().perspective).toBe('tim')
    expect(navigateMock).toHaveBeenCalledWith('/leader-review?task=VT-7')
    expect(useNotificationStore.getState().items[0].isRead).toBe(true)
  })

  it('task assigned: navigates to /my-work, perspective stays saya', () => {
    setUser(['VT Member'])
    seed({ kind: 'task-assigned', taskName: 'VT-1' })
    render(<AppNavbar />, { wrapper: wrap })

    openDropdownAndClickFirstNotif()

    expect(useUiStore.getState().perspective).toBe('saya')
    expect(navigateMock).toHaveBeenCalledWith('/my-work?task=VT-1')
  })

  it('system notification: markRead, no navigate', () => {
    setUser(['VT Member'])
    seed({ kind: 'system' })
    render(<AppNavbar />, { wrapper: wrap })

    openDropdownAndClickFirstNotif()

    expect(navigateMock).not.toHaveBeenCalled()
    expect(useNotificationStore.getState().items[0].isRead).toBe(true)
  })

  it('legacy href: navigates without perspective change', () => {
    setUser(['VT Member', 'VT Leader'])
    useUiStore.setState({ perspective: 'tim' })
    seed({ href: '/some/legacy/path' })
    render(<AppNavbar />, { wrapper: wrap })

    openDropdownAndClickFirstNotif()

    expect(navigateMock).toHaveBeenCalledWith('/some/legacy/path')
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('empty notification: no navigate', () => {
    setUser(['VT Member'])
    seed({})
    render(<AppNavbar />, { wrapper: wrap })

    openDropdownAndClickFirstNotif()

    expect(navigateMock).not.toHaveBeenCalled()
  })
})
