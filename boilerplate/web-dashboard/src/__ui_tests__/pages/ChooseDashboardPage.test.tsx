import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ user: { name: 'Budi Santoso' }, logout: vi.fn() }),
}))

vi.mock('@/services/auth.service', () => ({
  authService: { logout: vi.fn().mockResolvedValue(undefined) },
}))

import ChooseDashboardPage from '@/pages/ChooseDashboard/ChooseDashboardPage'

describe('ChooseDashboardPage', () => {
  beforeEach(() => { mockNavigate.mockClear() })

  it('renders heading and two dashboard cards', () => {
    render(<MemoryRouter><ChooseDashboardPage /></MemoryRouter>)
    expect(screen.getByText('Pilih Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Sekolah')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Koperasi')).toBeInTheDocument()
  })

  it('navigates to /sekolah/dashboard when Sekolah card is clicked', () => {
    render(<MemoryRouter><ChooseDashboardPage /></MemoryRouter>)
    fireEvent.click(screen.getByText('Dashboard Sekolah'))
    expect(mockNavigate).toHaveBeenCalledWith('/sekolah/dashboard', { replace: true })
  })

  it('navigates to /koperasi/dashboard when Koperasi card is clicked', () => {
    render(<MemoryRouter><ChooseDashboardPage /></MemoryRouter>)
    fireEvent.click(screen.getByText('Dashboard Koperasi'))
    expect(mockNavigate).toHaveBeenCalledWith('/koperasi/dashboard', { replace: true })
  })

  it('shows logged-in user name', () => {
    render(<MemoryRouter><ChooseDashboardPage /></MemoryRouter>)
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
  })
})
