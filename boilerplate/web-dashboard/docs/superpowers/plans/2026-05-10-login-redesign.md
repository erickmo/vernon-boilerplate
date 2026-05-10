# Login Page Redesign — Indigo Premium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `LoginPage` to Indigo Premium — split panel, light theme, deep indigo gradient left panel + clean white-indigo right form.

**Architecture:** Pure visual rewrite. Zero logic changes. `LoginPage.tsx` gets new markup structure (remove dots/decoRing, add feature list + eyebrow + divider). `LoginPage.module.css` gets full rewrite with Indigo Premium tokens.

**Tech Stack:** React 18, CSS Modules (camelCase), no Tailwind.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/pages/Login/LoginPage.tsx` | Modify | New markup structure — left panel feature list, eyebrow, divider, help note |
| `src/pages/Login/LoginPage.module.css` | Full rewrite | Indigo Premium design tokens + all component styles |
| `src/__ui_tests__/pages/LoginPage.test.tsx` | No change | Existing tests must still pass — placeholders unchanged |

---

## Task 1: Rewrite LoginPage.module.css

**Files:**
- Modify: `src/pages/Login/LoginPage.module.css`

- [ ] **Step 1: Verify existing tests pass before touching anything**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npm test -- --run src/__ui_tests__/pages/LoginPage.test.tsx
```
Expected: all tests PASS. If any fail, stop and investigate.

- [ ] **Step 2: Replace LoginPage.module.css with Indigo Premium styles**

Full replace — overwrite the entire file:

```css
/* ─── Root ──────────────────────────────────────────── */
.root {
  display: flex;
  min-height: 100dvh;
  background: #f1f5f9;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ─── Shell (the card that wraps both panels) ────────── */
.shell {
  display: flex;
  width: 100%;
  max-width: 900px;
  min-height: 580px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(30, 27, 75, 0.18), 0 0 0 1px rgba(165, 180, 252, 0.12);
}

/* ─── Left Panel ─────────────────────────────────────── */
.leftPanel {
  width: 42%;
  background: linear-gradient(160deg, #312e81 0%, #3730a3 40%, #4338ca 75%, #4f46e5 100%);
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

/* Decorative rings */
.leftPanel::before {
  content: '';
  position: absolute;
  bottom: -60px;
  left: -60px;
  width: 260px;
  height: 260px;
  border: 1.5px solid rgba(255, 255, 255, 0.07);
  border-radius: 50%;
  pointer-events: none;
}

.leftPanel::after {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 180px;
  height: 180px;
  border: 1.5px solid rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  pointer-events: none;
}

/* Radial glow */
.leftGlow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at 70% 20%, rgba(139, 92, 246, 0.25) 0%, transparent 60%);
  pointer-events: none;
}

/* Brand (logo row) */
.logoWrap {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.logoIcon {
  width: 38px;
  height: 38px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  color: #ffffff;
  flex-shrink: 0;
}

.logoImg {
  height: 38px;
  width: auto;
  object-fit: contain;
}

.logoName {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
}

/* Left body (tagline + features) */
.taglineBlock {
  position: relative;
  z-index: 1;
}

.taglineTitle {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.4;
  letter-spacing: -0.4px;
  margin-bottom: 12px;
}

.taglineAccent {
  color: #a5b4fc;
}

.taglineSub {
  font-size: 13px;
  color: rgba(199, 210, 254, 0.65);
  line-height: 1.7;
  margin-bottom: 28px;
}

/* Feature list */
.featureList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.featureItem {
  display: flex;
  align-items: center;
  gap: 10px;
}

.featureDot {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: rgba(165, 180, 252, 0.15);
  border: 1px solid rgba(165, 180, 252, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.featureDot::after {
  content: '';
  width: 6px;
  height: 6px;
  background: #a5b4fc;
  border-radius: 2px;
}

.featureText {
  font-size: 12px;
  color: rgba(199, 210, 254, 0.7);
}

/* Left footer (developer credit) */
.devContact {
  font-size: 11px;
  color: rgba(165, 180, 252, 0.35);
  position: relative;
  z-index: 1;
}

.devContact a {
  color: rgba(165, 180, 252, 0.55);
  text-decoration: none;
}

.devContact a:hover {
  color: rgba(165, 180, 252, 0.8);
}

/* ─── Right Panel ────────────────────────────────────── */
.rightPanel {
  flex: 1;
  background: #fafaff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 52px;
}

.formWrap {
  width: 100%;
  max-width: 360px;
  animation: fadeUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Eyebrow label */
.formEyebrow {
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.formTitle {
  font-size: 26px;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}

.formSub {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 32px;
}

/* Fields */
.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: #4338ca;
}

.inputWrap {
  position: relative;
}

.inputIcon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a5b4fc;
  pointer-events: none;
  display: flex;
}

.input {
  width: 100%;
  height: 44px;
  padding: 0 44px;
  border: 1.5px solid #e0e7ff;
  border-radius: 10px;
  background: #ffffff;
  color: #1e1b4b;
  font-size: 14px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  outline: none;
}

.input::placeholder {
  color: #c7d2fe;
}

.input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.input[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.inputWithEye {
  padding-right: 44px;
}

.eyeBtn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #c7d2fe;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: color 150ms ease;
}

.eyeBtn:hover {
  color: #6366f1;
}

.fieldError {
  font-size: 11px;
  color: var(--color-danger);
}

/* Remember + Forgot row */
.rememberRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.rememberLeft {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
  cursor: pointer;
}

.rememberLabel {
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  user-select: none;
}

.forgotBtn {
  font-size: 12px;
  color: #6366f1;
  font-weight: 500;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: opacity 150ms ease;
}

.forgotBtn:hover {
  opacity: 0.75;
}

/* Server error */
.serverError {
  padding: 12px 16px;
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  margin-bottom: 12px;
}

/* Submit button */
.submitBtn {
  width: 100%;
  height: 46px;
  background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35), 0 1px 3px rgba(99, 102, 241, 0.2);
  transition: opacity 150ms ease, transform 150ms ease;
  margin-bottom: 24px;
}

.submitBtn:hover:not(:disabled) {
  opacity: 0.92;
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

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.dividerLine {
  flex: 1;
  height: 1px;
  background: #e0e7ff;
}

.dividerText {
  font-size: 11px;
  color: #c7d2fe;
  white-space: nowrap;
}

/* Help note */
.helpNote {
  text-align: center;
  font-size: 11.5px;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 0;
}

.helpNote span {
  color: #6366f1;
  font-weight: 500;
}

/* Footer */
.formFooter {
  text-align: center;
  font-size: 11px;
  color: #c7d2fe;
  margin-top: 28px;
}

/* ─── Forgot Password Modal ──────────────────────────── */
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 27, 75, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  animation: fadeIn 150ms ease both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal {
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  max-width: 360px;
  width: calc(100% - 32px);
  box-shadow: 0 24px 60px rgba(30, 27, 75, 0.2);
  animation: scaleIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modalTitle {
  font-size: 17px;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 10px;
}

.modalBody {
  font-size: 13px;
  color: #64748b;
  line-height: 1.65;
  margin-bottom: 24px;
}

.modalClose {
  width: 100%;
  height: 40px;
  background: #f1f5f9;
  border: 1px solid #e0e7ff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #4338ca;
  cursor: pointer;
  transition: background 150ms ease;
}

.modalClose:hover {
  background: #e0e7ff;
}

/* ─── Responsive ─────────────────────────────────────── */
@media (max-width: 768px) {
  .root {
    padding: 0;
    background: #fafaff;
    align-items: flex-start;
  }

  .shell {
    flex-direction: column;
    border-radius: 0;
    min-height: 100dvh;
    box-shadow: none;
  }

  .leftPanel {
    width: 100%;
    padding: 24px 24px 28px;
    min-height: 140px;
    justify-content: flex-start;
  }

  .taglineBlock {
    margin-top: 16px;
  }

  .taglineTitle {
    font-size: 18px;
  }

  .featureList {
    display: none;
  }

  .taglineSub {
    display: none;
  }

  .rightPanel {
    padding: 32px 24px;
    align-items: flex-start;
  }
}
```

- [ ] **Step 3: Run tests — confirm still passing**

```bash
npm test -- --run src/__ui_tests__/pages/LoginPage.test.tsx
```
Expected: all tests PASS (CSS rewrite has no effect on test queries).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login/LoginPage.module.css
git commit -m "style(login): rewrite CSS — Indigo Premium design"
```

---

## Task 2: Update LoginPage.tsx markup

**Files:**
- Modify: `src/pages/Login/LoginPage.tsx`

- [ ] **Step 1: Replace LoginPage.tsx with updated markup**

Logic is 100% unchanged. Only markup structure changes:
- Remove `decoRing` div, `dotsPattern` / `dot` elements
- Add `leftGlow` div inside leftPanel
- Add `taglineAccent` span inside taglineTitle
- Add `featureList` with 3 items inside taglineBlock
- Add `formEyebrow` above formTitle in right panel
- Update title text: "Masuk ke Sistem" → "Selamat Datang"
- Update subtitle text
- Update submit button text: "Masuk" → "Masuk ke Sistem →"
- Add `divider` + `helpNote` after submit button
- Wrap both panels in a new `shell` div (root becomes the outer bg)
- Update footer text

Full file content:

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

const FEATURES = [
  'Manajemen Akademik & Kurikulum',
  'Absensi Digital Real-time',
  'Laporan & Analitik Lengkap',
]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [rememberMe, setRememberMe] = useState(() => {
    try { return localStorage.getItem('rememberMe') === 'true' } catch { return false }
  })
  const [showForgotModal, setShowForgotModal] = useState(false)

  const { values, errors, field, handleSubmit } = useForm<LoginFormValues>({
    initialValues: { usr: 'administrator', pwd: '123123123' },
    validate: (v) => ({
      usr: !v.usr ? 'Username atau email wajib diisi' : undefined,
      pwd: !v.pwd ? 'Kata sandi wajib diisi' : undefined,
    }),
  })

  const getRedirectPath = (): string => {
    const params = new URLSearchParams(location.search)
    const nextParam = params.get('next')
    if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) return nextParam
    const fromState = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    return fromState ?? '/dashboard'
  }

  const onSubmit = handleSubmit(async (v) => {
    setIsLoading(true)
    setServerError('')
    try {
      try { localStorage.setItem('rememberMe', String(rememberMe)) } catch { /* sandboxed */ }
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
      <div className={styles.shell}>
        {/* ── Left Panel ── */}
        <div className={styles.leftPanel}>
          <div className={styles.leftGlow} />

          <div className={styles.logoWrap}>
            {appConfig.appLogo ? (
              <img src={appConfig.appLogo} alt={appConfig.appName} className={styles.logoImg} />
            ) : (
              <>
                <div className={styles.logoIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                  </svg>
                </div>
                <span className={styles.logoName}>{appConfig.appName}</span>
              </>
            )}
          </div>

          <div className={styles.taglineBlock}>
            <h2 className={styles.taglineTitle}>
              Manajemen Sekolah<br />
              <span className={styles.taglineAccent}>Lebih Mudah,</span><br />
              Lebih Cerdas.
            </h2>
            <p className={styles.taglineSub}>
              Kelola akademik, absensi, dan administrasi sekolah dalam satu platform terintegrasi.
            </p>

            <div className={styles.featureList}>
              {FEATURES.map((f) => (
                <div key={f} className={styles.featureItem}>
                  <div className={styles.featureDot} />
                  <span className={styles.featureText}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className={styles.devContact}>
            Developed by{' '}
            <a href="mailto:mo@intinusa.id">Intinusa Digital</a>
            {' '}· mo@intinusa.id
          </p>
        </div>

        {/* ── Right Panel ── */}
        <div className={styles.rightPanel}>
          <div className={styles.formWrap}>
            <p className={styles.formEyebrow}>Portal Sekolah</p>
            <h1 className={styles.formTitle}>Selamat Datang</h1>
            <p className={styles.formSub}>Masuk menggunakan akun yang diberikan administrator Anda.</p>

            <form onSubmit={onSubmit} className={styles.fieldGroup} noValidate aria-label="Login">
              {/* Username / Email */}
              <div className={styles.field}>
                <label htmlFor="usr" className={styles.label}>Email atau Username</label>
                <div className={styles.inputWrap}>
                  <User size={15} className={styles.inputIcon} />
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
                  <Lock size={15} className={styles.inputIcon} />
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
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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
                {isLoading ? <span className={styles.spinner} /> : 'Masuk ke Sistem →'}
              </button>
            </form>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>Butuh bantuan?</span>
              <div className={styles.dividerLine} />
            </div>

            <p className={styles.helpNote}>
              Hubungi <span>administrator sekolah</span> untuk reset kata sandi atau akses akun baru.
            </p>

            <p className={styles.formFooter}>v1.0.0 · © 2025 SekolahPro · Intinusa Digital</p>
          </div>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgotModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowForgotModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowForgotModal(false)}
          role="presentation"
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
              autoFocus
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

- [ ] **Step 2: Run all LoginPage tests**

```bash
npm test -- --run src/__ui_tests__/pages/LoginPage.test.tsx
```
Expected: all tests PASS. The `appConfig.appName` check passes because `logoName` span still renders it. Placeholder texts unchanged.

- [ ] **Step 3: Run full test suite to catch regressions**

```bash
npm test -- --run
```
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login/LoginPage.tsx
git commit -m "feat(login): Indigo Premium redesign — split panel light theme"
```

---

## Self-Review

**Spec coverage:**
- ✅ Left panel: gradient, rings, glow, logo, tagline + accent, feature list, footer
- ✅ Right panel: eyebrow, title, subtitle, fields with indigo labels + icons + focus ring, remember row, submit gradient + shadow, divider, help note, footer
- ✅ Behavior: zero logic changes, all handlers/state preserved
- ✅ Responsive: mobile stacks vertically, feature list hidden, min-height 140px

**Placeholder scan:** None found. All CSS values explicit. All code blocks complete.

**Type consistency:** CSS module class names used in TSX match exactly what's defined in CSS: `shell`, `leftGlow`, `taglineAccent`, `featureList`, `featureItem`, `featureDot`, `featureText`, `formEyebrow`, `divider`, `dividerLine`, `dividerText`, `helpNote`.
