import { render, screen, fireEvent, waitFor } from '../test-utils'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import LoginPage from '@/pages/Login/LoginPage'

describe('LoginPage — rendering', () => {
  it('renders usr field as type text (bukan email)', () => {
    render(<LoginPage />)
    const input = screen.getByPlaceholderText(/nama@sekolah.com \/ username/i)
    expect(input).toHaveAttribute('type', 'text')
  })

  it('renders password field', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('Masukkan kata sandi')).toBeInTheDocument()
  })

  it('renders remember me checkbox', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/ingat saya/i)).toBeInTheDocument()
  })

  it('renders lupa kata sandi button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /lupa kata sandi/i })).toBeInTheDocument()
  })

  it('shows app name from config', () => {
    render(<LoginPage />)
    // appConfig.appName default is 'Dashboard'
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})

describe('LoginPage — forgot password modal', () => {
  it('opens modal on lupa kata sandi click', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /lupa kata sandi/i }))
    expect(screen.getByText(/hubungi administrator/i)).toBeInTheDocument()
  })

  it('closes modal on tutup click', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /lupa kata sandi/i }))
    fireEvent.click(screen.getByRole('button', { name: /tutup/i }))
    expect(screen.queryByText(/hubungi administrator/i)).not.toBeInTheDocument()
  })
})

describe('LoginPage — form validation', () => {
  it('shows error when usr is empty on submit', async () => {
    render(<LoginPage />)
    fireEvent.submit(screen.getByRole('form'))
    await waitFor(() => {
      expect(screen.getByText('Username atau email wajib diisi')).toBeInTheDocument()
    })
  })

  it('shows error when password is empty on submit', async () => {
    render(<LoginPage />)
    fireEvent.submit(screen.getByRole('form'))
    await waitFor(() => {
      expect(screen.getByText('Kata sandi wajib diisi')).toBeInTheDocument()
    })
  })
})

describe('LoginPage — login flow', () => {
  it('calls authService with usr, pwd, remember and redirects to /dashboard', async () => {
    render(<LoginPage />, { initialEntries: ['/login'] })

    fireEvent.change(screen.getByPlaceholderText(/nama@sekolah.com \/ username/i), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByPlaceholderText('Masukkan kata sandi'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByLabelText(/ingat saya/i))
    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  it('shows server error on failed login', async () => {
    server.use(
      http.post('http://localhost:8080/api/auth/login', () => {
        return HttpResponse.json({ message: 'Username atau kata sandi salah' }, { status: 401 })
      })
    )

    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText(/nama@sekolah.com \/ username/i), {
      target: { value: 'wrong' },
    })
    fireEvent.change(screen.getByPlaceholderText('Masukkan kata sandi'), {
      target: { value: 'wrong' },
    })
    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
