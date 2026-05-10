import { render, screen, fireEvent, waitFor } from '../test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const { mockLogout, mockAuthServiceLogout } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
  mockAuthServiceLogout: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ user: { name: 'Budi Santoso' }, logout: mockLogout }),
}))

vi.mock('@/services/auth.service', () => ({
  authService: { logout: mockAuthServiceLogout },
}))

import ChooseDashboardPage from '@/pages/ChooseDashboard/ChooseDashboardPage'

describe('ChooseDashboardPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockLogout.mockClear()
    mockAuthServiceLogout.mockClear()
  })

  it('renders heading and two dashboard cards', () => {
    render(<ChooseDashboardPage />)
    expect(screen.getByText('Pilih Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Sekolah')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Koperasi')).toBeInTheDocument()
  })

  it('navigates to /sekolah/dashboard when Sekolah card is clicked', () => {
    render(<ChooseDashboardPage />)
    fireEvent.click(screen.getByText('Dashboard Sekolah'))
    expect(mockNavigate).toHaveBeenCalledWith('/sekolah/dashboard', { replace: true })
  })

  it('navigates to /koperasi/dashboard when Koperasi card is clicked', () => {
    render(<ChooseDashboardPage />)
    fireEvent.click(screen.getByText('Dashboard Koperasi'))
    expect(mockNavigate).toHaveBeenCalledWith('/koperasi/dashboard', { replace: true })
  })

  it('shows logged-in user name', () => {
    render(<ChooseDashboardPage />)
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
  })

  it('calls authService.logout, store logout(), and navigates to /login on Keluar click', async () => {
    render(<ChooseDashboardPage />)
    fireEvent.click(screen.getByRole('button', { name: /keluar/i }))
    await waitFor(() => {
      expect(mockAuthServiceLogout).toHaveBeenCalledOnce()
      expect(mockLogout).toHaveBeenCalledOnce()
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })
})
