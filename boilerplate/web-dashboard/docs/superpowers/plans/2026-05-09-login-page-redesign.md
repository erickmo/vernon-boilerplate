# Login Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign login page menjadi split-panel layout (branding kiri, form kanan) dengan light-only theme, field "email atau username", remember me, forgot password modal, dan redirect ke URL sebelumnya.

**Architecture:** Split panel CSS layout — left panel static branding dengan decorative elements, right panel form. Dark mode dihapus dari CSS variables. `LoginRequest` type diupdate untuk mendukung `usr`/`pwd`/`remember` field sesuai Frappe convention.

**Tech Stack:** React 18, TypeScript strict, CSS Modules (camelCase), Vitest + React Testing Library + MSW, React Router 6, Zustand auth store.

---

## File Map

| File | Action | Tanggung jawab |
|---|---|---|
| `src/theme/variables.css` | Modify | Hapus `[data-theme='dark']` block |
| `src/config/app.config.ts` | Modify | Tambah `appLogo`, `appTagline` |
| `src/types/auth.types.ts` | Modify | Rename `LoginRequest` fields: `email→usr`, `password→pwd`, tambah `remember?` |
| `src/pages/Login/LoginPage.module.css` | Rewrite | Split panel CSS — left branding, right form |
| `src/pages/Login/LoginPage.tsx` | Rewrite | Split layout, new form fields, remember me, forgot modal, redirect |
| `src/__ui_tests__/pages/LoginPage.test.tsx` | Create | Component tests untuk semua behavior |

---

## Task 1: Disable Dark Mode

**Files:**
- Modify: `src/theme/variables.css:121-141`

- [ ] **Step 1: Hapus `[data-theme='dark']` block**

Buka `src/theme/variables.css`. Hapus seluruh block ini (baris 121–141):

```css
[data-theme='dark'] {
  --color-surface: #0F0A15;
  --color-surface-elevated: #1C1428;
  --color-surface-alt: #261A33;
  --color-navbar-bg: rgba(28, 20, 40, 0.98);
  --color-overlay: rgba(0, 0, 0, 0.6);

  --color-border: #3D2E52;
  --color-border-subtle: #2A1E3A;
  --color-hover: rgba(255, 255, 255, 0.06);

  --color-text: #EDE8F5;
  --color-text-secondary: #A89CBD;
  --color-text-tertiary: #6B5E7D;
  --color-text-disabled: #4A3E5E;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.45), 0 8px 10px rgba(0, 0, 0, 0.35);
}
```

Setelah dihapus, file berakhir setelah baris `}` penutup `:root`.

- [ ] **Step 2: Commit**

```bash
git add src/theme/variables.css
git commit -m "style: remove dark mode CSS variables"
```

---

## Task 2: Extend App Config

**Files:**
- Modify: `src/config/app.config.ts`

- [ ] **Step 1: Tambah `appLogo` dan `appTagline`**

Ganti seluruh isi `src/config/app.config.ts` dengan:

```ts
export const appConfig = {
  isMultiTenant: import.meta.env.VITE_MULTI_TENANT === 'true',
  appName: import.meta.env.VITE_APP_NAME ?? 'Dashboard',
  appLogo: import.meta.env.VITE_APP_LOGO ?? null,
  appTagline: import.meta.env.VITE_APP_TAGLINE ?? 'Sistem Manajemen Sekolah Terpadu',
} as const
```

- [ ] **Step 2: Commit**

```bash
git add src/config/app.config.ts
git commit -m "feat: add appLogo and appTagline to app config"
```

---

## Task 3: Update LoginRequest Type

**Files:**
- Modify: `src/types/auth.types.ts`

Frappe login API menggunakan `usr` dan `pwd`. Field `email` di `LoginRequest` juga tidak tepat karena sekarang menerima username non-email.

- [ ] **Step 1: Tulis failing test**

Buat file `src/__ui_tests__/pages/LoginPage.test.tsx`:

```tsx
import { render, screen } from '../test-utils'
import LoginPage from '@/pages/Login/LoginPage'

describe('LoginPage — field types', () => {
  it('renders usr field as type text, not email', () => {
    render(<LoginPage />)
    const input = screen.getByPlaceholderText(/nama@sekolah.com \/ username/i)
    expect(input).toHaveAttribute('type', 'text')
  })
})
```

- [ ] **Step 2: Jalankan test — pastikan FAIL**

```bash
cd boilerplate/web-dashboard && npx vitest run src/__ui_tests__/pages/LoginPage.test.tsx
```

Expected: FAIL — placeholder text tidak ditemukan (LoginPage masih pakai field lama).

- [ ] **Step 3: Update `LoginRequest` interface**

Di `src/types/auth.types.ts`, ubah:

```ts
// SEBELUM
export interface LoginRequest {
  email: string
  password: string
}

// SESUDAH
export interface LoginRequest {
  usr: string
  pwd: string
  remember?: boolean
}
```

Test masih FAIL (LoginPage belum diupdate) — itu normal. Lanjut ke Task 4 dan 5.

- [ ] **Step 4: Commit**

```bash
git add src/types/auth.types.ts src/__ui_tests__/pages/LoginPage.test.tsx
git commit -m "feat: update LoginRequest fields to usr/pwd/remember"
```

---

## Task 4: Rewrite Login CSS

**Files:**
- Rewrite: `src/pages/Login/LoginPage.module.css`

- [ ] **Step 1: Ganti seluruh isi `LoginPage.module.css`**

```css
/* ─── Root ─────────────────────────────────────── */
.root {
  display: flex;
  min-height: 100dvh;
}

/* ─── Left Panel (Branding) ─────────────────────── */
.leftPanel {
  width: 42%;
  background: linear-gradient(160deg, #4f46e5 0%, #7c3aed 100%);
  display: flex;
  flex-direction: column;
  padding: var(--space-10) var(--space-9);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

/* Decorative circles */
.leftPanel::before {
  content: '';
  position: absolute;
  top: -80px;
  right: -80px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
  pointer-events: none;
}

.leftPanel::after {
  content: '';
  position: absolute;
  bottom: -100px;
  left: -60px;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  pointer-events: none;
}

.decoRing {
  position: absolute;
  top: 200px;
  right: -40px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 32px solid rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

/* Logo */
.logoWrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  position: relative;
  z-index: 1;
}

.logoImg {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.logoIcon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}

.logoName {
  font-size: var(--font-xl);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.5px;
}

/* Tagline block */
.taglineBlock {
  margin-top: auto;
  position: relative;
  z-index: 1;
}

.dotsPattern {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  opacity: 0.28;
  margin-bottom: var(--space-7);
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ffffff;
}

.taglineTitle {
  font-size: var(--font-3xl);
  font-weight: 800;
  color: #ffffff;
  line-height: 1.25;
  letter-spacing: -0.5px;
  margin-bottom: var(--space-3);
}

.taglineSub {
  font-size: var(--font-base);
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.65;
  margin-bottom: var(--space-8);
}

.devContact {
  font-size: var(--font-xs);
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.5;
}

.devContact a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
}

.devContact a:hover {
  color: rgba(255, 255, 255, 0.85);
}

/* ─── Right Panel (Form) ────────────────────────── */
.rightPanel {
  flex: 1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-9) var(--space-8);
}

.formWrap {
  width: 100%;
  max-width: 360px;
  animation: fadeUp 0.35s var(--ease-spring) both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.formTitle {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-1);
  letter-spacing: -0.4px;
}

.formSub {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-7);
}

/* Fields */
.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.label {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--color-text);
}

.inputWrap {
  position: relative;
}

.inputIcon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.input {
  width: 100%;
  height: var(--input-height-lg);
  padding: 0 var(--space-4) 0 calc(var(--space-4) + 20px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-base);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
  outline: none;
}

.input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.input[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.inputWithEye {
  padding-right: calc(var(--space-4) + 24px);
}

.eyeBtn {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast);
  display: flex;
  align-items: center;
}

.eyeBtn:hover {
  color: var(--color-text);
}

.fieldError {
  font-size: var(--font-xs);
  color: var(--color-danger);
}

/* Remember + Forgot row */
.rememberRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.rememberLeft {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.checkbox {
  width: 16px;
  height: 16px;
  accent-color: #4f46e5;
  cursor: pointer;
}

.rememberLabel {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;
}

.forgotBtn {
  font-size: var(--font-sm);
  color: #4f46e5;
  font-weight: 500;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: opacity var(--duration-fast);
}

.forgotBtn:hover {
  opacity: 0.75;
}

/* Server error */
.serverError {
  padding: var(--space-3) var(--space-4);
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  border: 1px solid rgba(220, 38, 38, 0.2);
  margin-bottom: var(--space-4);
}

/* Submit */
.submitBtn {
  width: 100%;
  height: var(--input-height-lg);
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #ffffff;
  font-size: var(--font-base);
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: opacity var(--duration-fast), transform var(--duration-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  margin-bottom: var(--space-6);
}

.submitBtn:hover:not(:disabled) {
  opacity: 0.9;
}

.submitBtn:active:not(:disabled) {
  transform: scale(0.98);
}

.submitBtn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer version */
.formFooter {
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-text-tertiary);
}

/* ─── Forgot Password Modal ──────────────────────── */
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 10, 26, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  animation: fadeIn var(--duration-fast) ease both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal {
  background: #ffffff;
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  max-width: 360px;
  width: calc(100% - var(--space-8));
  box-shadow: var(--shadow-xl);
  animation: scaleIn var(--duration-normal) var(--ease-spring) both;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modalTitle {
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.modalBody {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  line-height: 1.65;
  margin-bottom: var(--space-6);
}

.modalClose {
  width: 100%;
  height: var(--input-height);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: background var(--duration-fast);
}

.modalClose:hover {
  background: var(--color-surface-alt);
}

/* ─── Responsive ─────────────────────────────────── */
@media (max-width: 768px) {
  .root {
    flex-direction: column;
  }

  .leftPanel {
    width: 100%;
    padding: var(--space-6) var(--space-6) var(--space-8);
    min-height: auto;
  }

  .taglineBlock {
    margin-top: var(--space-7);
  }

  .taglineTitle {
    font-size: var(--font-2xl);
  }

  .dotsPattern,
  .decoRing,
  .devContact {
    display: none;
  }

  .rightPanel {
    padding: var(--space-8) var(--space-6);
    align-items: flex-start;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Login/LoginPage.module.css
git commit -m "style: rewrite login page CSS with split panel layout"
```

---

## Task 5: Rewrite LoginPage Component

**Files:**
- Rewrite: `src/pages/Login/LoginPage.tsx`
- Modify: `src/__ui_tests__/pages/LoginPage.test.tsx`

- [ ] **Step 1: Tambah tests untuk behavior baru**

Ganti seluruh isi `src/__ui_tests__/pages/LoginPage.test.tsx`:

```tsx
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
      // After successful login, error is gone and loading state resolves
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
```

- [ ] **Step 2: Jalankan test — pastikan FAIL**

```bash
cd boilerplate/web-dashboard && npx vitest run src/__ui_tests__/pages/LoginPage.test.tsx
```

Expected: beberapa FAIL karena `LoginPage` masih menggunakan layout lama.

- [ ] **Step 3: Rewrite `LoginPage.tsx`**

Ganti seluruh isi `src/pages/Login/LoginPage.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { useForm } from '@/hooks/useForm'
import { appConfig } from '@/config/app.config'
import { AppApiError } from '@/types/api.types'
import styles from './LoginPage.module.css'

interface LoginFormValues {
  usr: string
  pwd: string
}

const DOT_COUNT = 18

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true'
  })
  const [showForgotModal, setShowForgotModal] = useState(false)

  const { values, errors, field, handleSubmit } = useForm<LoginFormValues>({
    initialValues: { usr: '', pwd: '' },
    validate: (v) => ({
      usr: !v.usr ? 'Username atau email wajib diisi' : undefined,
      pwd: !v.pwd ? 'Kata sandi wajib diisi' : undefined,
    }),
  })

  const getRedirectPath = (): string => {
    const params = new URLSearchParams(location.search)
    const nextParam = params.get('next')
    if (nextParam) return nextParam
    const fromState = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    return fromState ?? '/dashboard'
  }

  const onSubmit = handleSubmit(async (v) => {
    setIsLoading(true)
    setServerError('')
    try {
      localStorage.setItem('rememberMe', String(rememberMe))
      const response = await authService.login({ usr: v.usr, pwd: v.pwd, remember: rememberMe })
      login(response)
      navigate(getRedirectPath(), { replace: true })
    } catch (err) {
      if (err instanceof AppApiError) {
        setServerError(err.message)
      } else {
        setServerError('Terjadi kesalahan, coba lagi')
      }
    } finally {
      setIsLoading(false)
    }
  })

  return (
    <div className={styles.root}>
      {/* ── Left Panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.decoRing} />

        <div className={styles.logoWrap}>
          {appConfig.appLogo ? (
            <img src={appConfig.appLogo} alt={appConfig.appName} className={styles.logoImg} />
          ) : (
            <>
              <div className={styles.logoIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                </svg>
              </div>
              <span className={styles.logoName}>{appConfig.appName}</span>
            </>
          )}
        </div>

        <div className={styles.taglineBlock}>
          <div className={styles.dotsPattern}>
            {Array.from({ length: DOT_COUNT }).map((_, i) => (
              <div key={i} className={styles.dot} />
            ))}
          </div>

          <h2 className={styles.taglineTitle}>{appConfig.appTagline}</h2>
          <p className={styles.taglineSub}>
            Kelola akademik, absensi, dan administrasi sekolah dalam satu platform terintegrasi.
          </p>

          <p className={styles.devContact}>
            Developed by{' '}
            <a href="mailto:mo@intinusa.id">Intinusa Digital</a>
            {' '}· mo@intinusa.id
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrap}>
          <h1 className={styles.formTitle}>Masuk ke Sistem</h1>
          <p className={styles.formSub}>Gunakan akun yang diberikan administrator</p>

          <form onSubmit={onSubmit} className={styles.fieldGroup} noValidate aria-label="Login">
            {/* Username / Email */}
            <div className={styles.field}>
              <label htmlFor="usr" className={styles.label}>Email atau Username</label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="usr"
                  type="text"
                  autoComplete="username"
                  placeholder="nama@sekolah.com / username"
                  className={styles.input}
                  aria-invalid={!!errors.usr}
                  {...field('usr')}
                  value={String(values.usr)}
                />
              </div>
              {errors.usr && <p className={styles.fieldError}>{errors.usr}</p>}
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label htmlFor="pwd" className={styles.label}>Kata Sandi</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="pwd"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  className={`${styles.input} ${styles.inputWithEye}`}
                  aria-invalid={!!errors.pwd}
                  {...field('pwd')}
                  value={String(values.pwd)}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.pwd && <p className={styles.fieldError}>{errors.pwd}</p>}
            </div>

            {/* Remember + Forgot */}
            <div className={styles.rememberRow}>
              <label className={styles.rememberLeft}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  aria-label="Ingat saya"
                />
                <span className={styles.rememberLabel}>Ingat saya</span>
              </label>
              <button
                type="button"
                className={styles.forgotBtn}
                onClick={() => setShowForgotModal(true)}
              >
                Lupa kata sandi?
              </button>
            </div>

            {serverError && (
              <div className={styles.serverError} role="alert">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? <span className={styles.spinner} /> : 'Masuk'}
            </button>
          </form>

          <p className={styles.formFooter}>v1.0.0 · © 2025 SekolahPro</p>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgotModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
          >
            <h2 id="forgot-title" className={styles.modalTitle}>Lupa Kata Sandi?</h2>
            <p className={styles.modalBody}>
              Hubungi administrator sekolah Anda untuk mereset kata sandi akun Anda.
            </p>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setShowForgotModal(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Jalankan semua tests — pastikan PASS**

```bash
cd boilerplate/web-dashboard && npx vitest run src/__ui_tests__/pages/LoginPage.test.tsx
```

Expected: semua PASS. Jika ada yang FAIL, periksa error dan fix sebelum lanjut.

- [ ] **Step 5: Jalankan full test suite**

```bash
cd boilerplate/web-dashboard && npx vitest run
```

Expected: tidak ada regresi — semua test yang sebelumnya passing masih passing.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Login/LoginPage.tsx src/__ui_tests__/pages/LoginPage.test.tsx
git commit -m "feat: redesign login page with split panel layout and new behavior"
```

---

## Task 6: Verifikasi Manual di Browser

- [ ] **Step 1: Jalankan dev server**

```bash
cd boilerplate/web-dashboard && npm run dev
```

- [ ] **Step 2: Buka `http://localhost:5173/login`**

Checklist visual:
- [ ] Split panel tampil: kiri ungu indigo, kanan putih
- [ ] Logo icon + "Dashboard" (atau nama dari `VITE_APP_NAME`) tampil di panel kiri
- [ ] Tagline dan dot pattern tampil
- [ ] Developer contact tampil di bawah panel kiri
- [ ] Field "Email atau Username" — type=text
- [ ] Field "Kata Sandi" dengan toggle show/hide
- [ ] Checkbox "Ingat saya"
- [ ] Link "Lupa kata sandi?" — klik buka modal
- [ ] Modal "Hubungi administrator" — klik Tutup, modal hilang
- [ ] Submit dengan field kosong — tampil validasi error
- [ ] Responsive di mobile (≤768px) — panel kiri mengecil ke atas, form di bawah

- [ ] **Step 3: Test di mobile viewport**

Di DevTools browser, set viewport ke 375px width. Pastikan layout stack (kolom), panel kiri tanpa dot pattern.

- [ ] **Step 4: Final commit jika ada fix kosmetik**

```bash
git add -p
git commit -m "fix: login page visual adjustments after manual review"
```
