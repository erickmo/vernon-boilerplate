import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartHandshake,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react'
import { frappeAuthService } from '@/services/frappe-auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { useForm } from '@/hooks/useForm'
import { AppApiError } from '@/types/api.types'
import { appConfig } from '@/config/app.config'
import type { LoginResponse } from '@/types/auth.types'
import styles from './LoginPage.module.css'

interface LoginFormValues extends Record<string, unknown> {
  email: string
  password: string
}

const canBypassLogin =
  import.meta.env.DEV || import.meta.env.MODE === 'test' || import.meta.env.VITE_ENABLE_LOGIN_BYPASS === 'true'

const demoLoginResponse: LoginResponse = {
  token: 'demo-token',
  refreshToken: 'demo-refresh-token',
  user: {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@vernon.local',
    role: 'admin',
    permissions: ['*'],
  },
  companyGroups: [],
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const { values, errors, field, handleSubmit } = useForm<LoginFormValues>({
    initialValues: {
      email: import.meta.env.DEV ? 'administrator' : '',
      password: import.meta.env.DEV ? '123123123' : '',
    },
    validate: (v) => ({
      email: !v.email ? 'Email wajib diisi' : undefined,
      password: !v.password ? 'Kata sandi wajib diisi' : undefined,
    }),
  })

  const onSubmit = handleSubmit(async (v) => {
    setIsLoading(true)
    setServerError('')
    try {
      // frappeAuthService sets isAuthenticated=true in the store
      // GuestRoute detects the change and redirects to / → RootRedirect → /my-work
      await frappeAuthService.login(String(v.email), String(v.password))
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

  const handleDemoLogin = () => {
    login(demoLoginResponse)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className={styles.root}>
      <main className={styles.shell}>
        <section className={styles.storyPanel} aria-label="Workspace yang peduli">
          <div className={styles.logoWrap}>
            <span className={styles.logoIcon}>{appConfig.appName[0]}</span>
            <span className={styles.logoText}>{appConfig.appName}</span>
          </div>

          <div className={styles.storyContent}>
            <p className={styles.eyebrow}>Workspace yang peduli</p>
            <h1 className={styles.storyTitle}>Masuk dan bantu tim bergerak lebih tenang.</h1>
            <p className={styles.storyText}>
              Mulai hari kerja dengan konteks yang jelas, prioritas yang ramah, dan alur kerja yang
              membuat semua orang merasa terbantu.
            </p>
          </div>

          <div className={styles.playGrid} aria-hidden="true">
            <span className={styles.tilePrimary}><HeartHandshake size={22} /></span>
            <span className={styles.tileAccent}><Sparkles size={20} /></span>
            <span className={styles.tileSecondary}>84</span>
            <span className={styles.tileCheck}><CheckCircle2 size={22} /></span>
          </div>

          <div className={styles.valueList}>
            <div className={styles.valueItem}>
              <HeartHandshake size={16} aria-hidden="true" />
              <div>
                <strong>Team care</strong>
                <span>Bantu rekan kerja melihat langkah berikutnya.</span>
              </div>
            </div>
            <div className={styles.valueItem}>
              <CheckCircle2 size={16} aria-hidden="true" />
              <div>
                <strong>Alur kerja lebih tenang</strong>
                <span>Prioritas tampil jelas tanpa terasa menekan.</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card} aria-label="Form masuk">
          <div className={styles.formHeader}>
            <span className={styles.formBadge}>
              <Sparkles size={14} aria-hidden="true" />
              Welcome back
            </span>
            <h2 className={styles.title}>Masuk ke workspace</h2>
            <p className={styles.subtitle}>Gunakan akun kerja Anda untuk melanjutkan.</p>
          </div>

          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@perusahaan.com"
                  className={styles.input}
                  aria-invalid={!!errors.email}
                  {...field('email')}
                  value={String(values.email)}
                />
              </div>
              {errors.email && <p className={styles.error}>{errors.email}</p>}
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Kata Sandi</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  className={styles.input}
                  aria-invalid={!!errors.password}
                  {...field('password')}
                  value={String(values.password)}
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
              {errors.password && <p className={styles.error}>{errors.password}</p>}
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
              {isLoading ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  Masuk ke workspace
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>

            {canBypassLogin && (
              <button
                type="button"
                className={styles.demoBtn}
                onClick={handleDemoLogin}
              >
                Masuk demo
              </button>
            )}
          </form>
        </section>
      </main>
    </div>
  )
}
