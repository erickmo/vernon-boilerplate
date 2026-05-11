import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/stores/auth.store', () => {
  const state = {
    user: null,
    selectedCompany: null,
    selectedGroup: null,
    logout: vi.fn(),
  }
  return {
    useAuthStore: (selector?: (s: typeof state) => unknown) =>
      typeof selector === 'function' ? selector(state) : state,
  }
})
vi.mock('@/stores/notification.store', () => ({
  useNotificationStore: () => ({ items: [], unreadCount: 0, markAllRead: vi.fn(), markRead: vi.fn() }),
}))
vi.mock('@/config/app.config', () => ({
  appConfig: { appName: 'Test', isMultiTenant: false, appLogo: null },
}))

import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('renders AppNavbar', () => {
    render(
      <MemoryRouter initialEntries={['/sekolah/dashboard']}>
        <AppShell context="sekolah" />
      </MemoryRouter>,
    )
    expect(document.querySelector('nav')).toBeInTheDocument()
  })

  it('renders AppSubNav when nav1 has subnav config', () => {
    render(
      <MemoryRouter initialEntries={['/sekolah/siswa']}>
        <AppShell context="sekolah" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('navigation', { name: 'Sub-navigasi' })).toBeInTheDocument()
  })

  it('does NOT render AppSubNav on dashboard route', () => {
    render(
      <MemoryRouter initialEntries={['/sekolah/dashboard']}>
        <AppShell context="sekolah" />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('navigation', { name: 'Sub-navigasi' })).not.toBeInTheDocument()
  })
})
