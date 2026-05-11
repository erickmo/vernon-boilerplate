import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PerspectiveSwitcher } from './PerspectiveSwitcher'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

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

function setRoles(roles: string[]) {
  useAuthStore.setState({
    user: { id: '1', name: 'X', email: 'x@x', role: 'user', roles, permissions: [] },
    isAuthenticated: true,
  })
}

beforeEach(() => {
  navigateMock.mockReset()
  useUiStore.setState({ perspective: 'saya' })
  useAuthStore.setState({ user: null })
})

describe('PerspectiveSwitcher visibility', () => {
  it('renders nothing for pure Member (one available perspective)', () => {
    setRoles(['VT Member'])
    const { container } = render(<PerspectiveSwitcher />, { wrapper: wrap })
    expect(container.firstChild).toBeNull()
  })

  it('renders 2 buttons for Leader', () => {
    setRoles(['VT Member', 'VT Leader'])
    render(<PerspectiveSwitcher />, { wrapper: wrap })
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('renders 3 buttons for Manager', () => {
    setRoles(['VT Member', 'VT Leader', 'VT Manager'])
    render(<PerspectiveSwitcher />, { wrapper: wrap })
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })
})

describe('PerspectiveSwitcher behavior', () => {
  it('clicking Tim updates state and navigates to /leader-review', () => {
    setRoles(['VT Member', 'VT Leader'])
    render(<PerspectiveSwitcher />, { wrapper: wrap })
    fireEvent.click(screen.getByRole('tab', { name: /tim/i }))
    expect(useUiStore.getState().perspective).toBe('tim')
    expect(navigateMock).toHaveBeenCalledWith('/leader-review')
  })

  it('marks active perspective with aria-selected="true"', () => {
    setRoles(['VT Member', 'VT Leader'])
    useUiStore.setState({ perspective: 'tim' })
    render(<PerspectiveSwitcher />, { wrapper: wrap })
    const tim = screen.getByRole('tab', { name: /tim/i })
    expect(tim.getAttribute('aria-selected')).toBe('true')
  })
})
