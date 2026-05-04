import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@/__ui_tests__/test-utils'
import { useAuthStore } from '@/stores/auth.store'
import LoginPage from '@/pages/Login/LoginPage'

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('renders a modern playful login experience', () => {
    render(<LoginPage />)

    expect(screen.getByText(/workspace yang peduli/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /masuk dan bantu tim bergerak/i })).toBeInTheDocument()
    expect(screen.getByText(/mulai hari kerja dengan konteks yang jelas/i)).toBeInTheDocument()
    expect(screen.getByText(/team care/i)).toBeInTheDocument()
    expect(screen.getByText(/alur kerja lebih tenang/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/kata sandi/i, { selector: 'input' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /masuk ke workspace/i })).toBeInTheDocument()
  })

  it('can bypass login with a demo workspace session', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /masuk demo/i }))

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user?.email).toBe('demo@vernon.local')
  })
})
