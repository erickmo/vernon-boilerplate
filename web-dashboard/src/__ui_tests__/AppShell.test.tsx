import { Route, Routes } from 'react-router-dom'
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { render } from '@/__ui_tests__/test-utils'
import { AppShell } from '@/layouts/AppShell/AppShell'

describe('AppShell', () => {
  it('renders secondary navigation on authenticated app pages', () => {
    render(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<div>Dashboard body</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/dashboard'] },
    )

    const nav2 = screen.getByRole('navigation', { name: /secondary navigation/i })
    expect(nav2).toBeInTheDocument()
    expect(within(nav2).getByRole('link', { name: /overview/i })).toHaveAttribute('href', '/dashboard')
    expect(within(nav2).getByRole('link', { name: /examples/i })).toHaveAttribute('href', '/examples')
    expect(within(nav2).getByRole('link', { name: /audit log/i })).toHaveAttribute('href', '/audit-log')
    expect(within(nav2).getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile')
    expect(within(nav2).getByRole('link', { name: /security/i })).toHaveAttribute('href', '/change-password')
    expect(screen.getByText('Dashboard body')).toBeInTheDocument()
  })

  it('keeps examples active for nested example routes', () => {
    render(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/examples/:id" element={<div>Example detail body</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/examples/ex-001'] },
    )

    const nav2 = screen.getByRole('navigation', { name: /secondary navigation/i })
    expect(within(nav2).getByRole('link', { name: /examples/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Example detail body')).toBeInTheDocument()
  })
})
