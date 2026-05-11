import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AppDrawer } from './AppDrawer'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

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
    user: { id: '1', name: 'Andi', email: 'andi@vt.id', role: 'user', roles, permissions: [] },
    isAuthenticated: true,
  })
}

beforeEach(() => {
  useAuthStore.setState({ user: null })
  useUiStore.setState({ drawerOpen: true, perspective: 'saya' })
})

describe('AppDrawer', () => {
  it('renders nothing when drawerOpen is false', () => {
    useUiStore.setState({ drawerOpen: false })
    setUser(['VT Member'])
    const { container } = render(<AppDrawer />, { wrapper: wrap })
    expect(container.firstChild).toBeNull()
  })

  it('renders user info + dialog when open', () => {
    setUser(['VT Member', 'VT Leader'])
    render(<AppDrawer />, { wrapper: wrap })
    expect(screen.getByText('Andi')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('closes on Esc', () => {
    setUser(['VT Member'])
    render(<AppDrawer />, { wrapper: wrap })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('closes on backdrop click', () => {
    setUser(['VT Member'])
    render(<AppDrawer />, { wrapper: wrap })
    fireEvent.click(screen.getByTestId('drawer-backdrop'))
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('shows logout button', () => {
    setUser(['VT Member'])
    render(<AppDrawer />, { wrapper: wrap })
    expect(screen.getByRole('button', { name: /keluar/i })).toBeInTheDocument()
  })
})
