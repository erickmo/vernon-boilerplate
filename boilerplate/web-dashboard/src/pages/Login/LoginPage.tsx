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
