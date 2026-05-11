import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@/__ui_tests__/test-utils'
import { useAuthStore } from '@/stores/auth.store'
import DashboardPage from '@/pages/Dashboard/DashboardPage'

describe('DashboardPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Maya Santoso',
        email: 'maya@example.com',
        role: 'admin',
        roles: [],
        permissions: [],
      },
    })
  })

  it('renders an empathy-guided workspace for the current user', () => {
    render(<DashboardPage />)

    expect(screen.getByRole('heading', { name: /selamat datang, maya santoso/i })).toBeInTheDocument()
    expect(screen.getByText(/mulai dari hal yang paling membantu tim anda hari ini/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /prioritas yang perlu dibantu/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /review pending approvals/i })).toBeInTheDocument()
    expect(screen.getByText(/kesiapan workspace/i)).toBeInTheDocument()
    expect(screen.getByText(/6 dari 8 langkah sudah selesai/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /cara membantu tim/i })).toBeInTheDocument()
    expect(screen.getByText(/rapikan data produk/i)).toBeInTheDocument()
    expect(screen.getByText(/undang rekan kerja/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /aktivitas terbaru/i })).toBeInTheDocument()
    expect(screen.getByText(/audit perubahan kategori selesai direview/i)).toBeInTheDocument()
  })
})
