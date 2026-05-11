import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AppNavbar } from '@/layouts/AppNavbar/AppNavbar'
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
    user: { id: '1', name: 'A', email: 'a@a', role: 'user', roles, permissions: [] },
    isAuthenticated: true,
  })
}

beforeEach(() => {
  useAuthStore.setState({ user: null })
  useUiStore.setState({ drawerOpen: false, perspective: 'saya' })
})

describe('AppNavbar mobile', () => {
  it('hamburger renders in DOM', () => {
    setUser(['VT Member'])
    render(<AppNavbar />, { wrapper: wrap })
    expect(screen.getByLabelText('Buka menu')).toBeInTheDocument()
  })

  it('hamburger click sets drawerOpen=true', () => {
    setUser(['VT Member'])
    render(<AppNavbar />, { wrapper: wrap })
    fireEvent.click(screen.getByLabelText('Buka menu'))
    expect(useUiStore.getState().drawerOpen).toBe(true)
  })

  it('drawer dialog appears in tree after hamburger click', () => {
    setUser(['VT Member'])
    render(<AppNavbar />, { wrapper: wrap })
    fireEvent.click(screen.getByLabelText('Buka menu'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
