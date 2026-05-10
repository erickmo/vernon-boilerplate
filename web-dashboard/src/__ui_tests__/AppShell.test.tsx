import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@/__ui_tests__/test-utils'
import { AppShell } from '@/layouts/AppShell/AppShell'

// Mock auth + notification stores for AppNavbar
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ user: { name: 'Test' }, selectedCompany: null, selectedGroup: null, logout: vi.fn() }),
}))
vi.mock('@/stores/notification.store', () => ({
  useNotificationStore: () => ({ items: [], unreadCount: 0, markAllRead: vi.fn(), markRead: vi.fn() }),
}))
vi.mock('@/config/app.config', () => ({
  appConfig: { appName: 'Test', isMultiTenant: false, appLogo: null },
}))

describe('AppShell', () => {
  it('renders AppNavbar', () => {
    render(
      <Routes>
        <Route element={<AppShell context="sekolah" />}>
          <Route path="/sekolah/dashboard" element={<div>Dashboard</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/sekolah/dashboard'] },
    )
    expect(document.querySelector('nav')).toBeInTheDocument()
  })

  it('renders AppSubNav when nav1 has subnav config', () => {
    render(
      <Routes>
        <Route element={<AppShell context="sekolah" />}>
          <Route path="/sekolah/siswa" element={<div>Siswa</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/sekolah/siswa'] },
    )
    expect(screen.getByRole('navigation', { name: 'Sub-navigasi' })).toBeInTheDocument()
  })

  it('does NOT render AppSubNav on dashboard route', () => {
    render(
      <Routes>
        <Route element={<AppShell context="sekolah" />}>
          <Route path="/sekolah/dashboard" element={<div>Dashboard</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/sekolah/dashboard'] },
    )
    expect(screen.queryByRole('navigation', { name: 'Sub-navigasi' })).not.toBeInTheDocument()
  })

  it('renders page content via Outlet', () => {
    render(
      <Routes>
        <Route element={<AppShell context="sekolah" />}>
          <Route path="/sekolah/dashboard" element={<div>Page content</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/sekolah/dashboard'] },
    )
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })
})
