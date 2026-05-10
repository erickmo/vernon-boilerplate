# Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the dual-dashboard routing skeleton (Sekolah + Koperasi) with ChooseDashboardPage, AppSubNav secondary nav, split route files, and typed folder scaffolding — so every subsequent entity phase has a ready home.

**Architecture:** Two parallel route trees (`/sekolah/*` and `/koperasi/*`) each wrap their own `AppShell` with a matching `context` prop. A new `AppSubNav` component sits between `AppNavbar` and `<main>`, driven by a `SUBNAV_CONFIG` lookup keyed on `context + nav1Key` derived from `location.pathname`. All page imports in the route files are lazy stubs that render a placeholder `<div>` — real pages are wired in later phases.

**Tech Stack:** React 18, React Router 6, TypeScript, CSS Modules, Vite

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| Create | `src/pages/ChooseDashboard/ChooseDashboardPage.tsx` | Dashboard picker page |
| Create | `src/pages/ChooseDashboard/ChooseDashboardPage.module.css` | Page styles |
| Create | `src/layouts/AppSubNav/AppSubNav.tsx` | Secondary horizontal nav bar |
| Create | `src/layouts/AppSubNav/AppSubNav.module.css` | SubNav styles |
| Create | `src/layouts/AppSubNav/subnav.config.ts` | SUBNAV_CONFIG constant |
| Modify | `src/layouts/AppShell/AppShell.tsx` | Add `<AppSubNav>` between navbar and main |
| Create | `src/app/routes.sekolah.tsx` | All `/sekolah/*` route stubs |
| Create | `src/app/routes.koperasi.tsx` | All `/koperasi/*` route stubs |
| Modify | `src/app/routes.tsx` | Add `/choose-dashboard`, spread both new route files |
| Create | `src/types/sekolah/index.ts` | Barrel — sekolah domain types |
| Create | `src/types/koperasi/index.ts` | Barrel — koperasi domain types |
| Create | `src/services/sekolah/index.ts` | Barrel — sekolah entity services |
| Create | `src/services/koperasi/index.ts` | Barrel — koperasi entity services |

---

## Task 1: ChooseDashboardPage

**Files:**
- Create: `src/pages/ChooseDashboard/ChooseDashboardPage.tsx`
- Create: `src/pages/ChooseDashboard/ChooseDashboardPage.module.css`

- [ ] **Step 1.1: Write the failing test**

Create `src/pages/ChooseDashboard/ChooseDashboardPage.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock useAuthStore
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ user: { name: 'Budi Santoso' }, logout: vi.fn() }),
}))

// Mock authService
vi.mock('@/services/auth.service', () => ({
  authService: { logout: vi.fn().mockResolvedValue(undefined) },
}))

import ChooseDashboardPage from './ChooseDashboardPage'

describe('ChooseDashboardPage', () => {
  beforeEach(() => { mockNavigate.mockClear() })

  it('renders heading and two dashboard cards', () => {
    render(<MemoryRouter><ChooseDashboardPage /></MemoryRouter>)
    expect(screen.getByText('Pilih Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Sekolah')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Koperasi')).toBeInTheDocument()
  })

  it('navigates to /sekolah/dashboard when Sekolah card is clicked', () => {
    render(<MemoryRouter><ChooseDashboardPage /></MemoryRouter>)
    fireEvent.click(screen.getByText('Dashboard Sekolah'))
    expect(mockNavigate).toHaveBeenCalledWith('/sekolah/dashboard', { replace: true })
  })

  it('navigates to /koperasi/dashboard when Koperasi card is clicked', () => {
    render(<MemoryRouter><ChooseDashboardPage /></MemoryRouter>)
    fireEvent.click(screen.getByText('Dashboard Koperasi'))
    expect(mockNavigate).toHaveBeenCalledWith('/koperasi/dashboard', { replace: true })
  })

  it('shows logged-in user name', () => {
    render(<MemoryRouter><ChooseDashboardPage /></MemoryRouter>)
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
  })
})
```

- [ ] **Step 1.2: Run test — verify it fails**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/pages/ChooseDashboard/ChooseDashboardPage.test.tsx
```

Expected: FAIL — `Cannot find module './ChooseDashboardPage'`

- [ ] **Step 1.3: Create ChooseDashboardPage.tsx**

```tsx
import { useNavigate } from 'react-router-dom'
import { LogOut, GraduationCap, Landmark } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { appConfig } from '@/config/app.config'
import styles from './ChooseDashboardPage.module.css'

// ─── Dashboard option definition ─────────────────────────────────────────────

interface DashboardOption {
  key: 'sekolah' | 'koperasi'
  label: string
  description: string
  path: string
  Icon: React.ComponentType<{ size?: number }>
  colorClass: string
}

const DASHBOARD_OPTIONS: DashboardOption[] = [
  {
    key: 'sekolah',
    label: 'Dashboard Sekolah',
    description: 'Kelola data siswa, guru, akademik, dan perpustakaan.',
    path: '/sekolah/dashboard',
    Icon: GraduationCap,
    colorClass: 'cardSekolah',
  },
  {
    key: 'koperasi',
    label: 'Dashboard Koperasi',
    description: 'Kelola anggota, simpanan, pembiayaan, kartu, dan ZIS.',
    path: '/koperasi/dashboard',
    Icon: Landmark,
    colorClass: 'cardKoperasi',
  },
]

// ─── Dashboard card ───────────────────────────────────────────────────────────

function DashboardCard({
  option,
  onSelect,
}: {
  option: DashboardOption
  onSelect: (path: string) => void
}) {
  return (
    <button
      type="button"
      className={`${styles.card} ${styles[option.colorClass]}`}
      onClick={() => onSelect(option.path)}
    >
      <div className={styles.cardIcon}>
        <option.Icon size={32} />
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardLabel}>{option.label}</span>
        <span className={styles.cardDesc}>{option.description}</span>
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChooseDashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleSelect(path: string) {
    navigate(path, { replace: true })
  }

  async function handleLogout() {
    await authService.logout().catch(() => {})
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.root}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      <div className={styles.topBar}>
        {user?.name && <span className={styles.userName}>{user.name}</span>}
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={() => { void handleLogout() }}
        >
          <LogOut size={14} />
          Keluar
        </button>
      </div>

      <div className={styles.center}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon} />
            <span className={styles.logoName}>{appConfig.appName}</span>
          </div>
          <h1 className={styles.heading}>Pilih Dashboard</h1>
          <p className={styles.subheading}>
            {user?.name
              ? `Selamat datang, ${user.name}. Pilih dashboard untuk melanjutkan.`
              : 'Pilih dashboard yang ingin Anda kelola.'}
          </p>
        </div>

        <div className={styles.grid}>
          {DASHBOARD_OPTIONS.map((option) => (
            <DashboardCard
              key={option.key}
              option={option}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 1.4: Create ChooseDashboardPage.module.css**

```css
/* ─── Page root ─────────────────────────────────────────────────────────────── */

.root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);
  background: linear-gradient(135deg, #0d1b2a 0%, #0f3a5f 50%, #1a3d2b 100%);
  position: relative;
  overflow: hidden;
}

/* ─── Decorative blur orbs ──────────────────────────────────────────────────── */

.orb1,
.orb2 {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
}

.orb1 {
  width: 480px;
  height: 480px;
  top: -120px;
  left: -120px;
  background: radial-gradient(circle, rgba(15, 108, 189, 0.35) 0%, transparent 70%);
}

.orb2 {
  width: 640px;
  height: 640px;
  bottom: -180px;
  right: -180px;
  background: radial-gradient(circle, rgba(26, 127, 75, 0.25) 0%, transparent 70%);
}

/* ─── Top-right user bar ────────────────────────────────────────────────────── */

.topBar {
  position: fixed;
  top: var(--space-5);
  right: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  z-index: 10;
}

.userName {
  font-size: var(--font-sm);
  color: rgba(255, 255, 255, 0.75);
}

.logoutBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px var(--space-3);
  font-size: var(--font-sm);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(8px);
  transition: color 150ms, background 150ms, border-color 150ms;
  cursor: pointer;
}

.logoutBtn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.3);
}

/* ─── Center block ──────────────────────────────────────────────────────────── */

.center {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
}

/* ─── Header ────────────────────────────────────────────────────────────────── */

.header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.logoWrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.logoIcon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #0f6cbd 0%, #1a7f4b 100%);
  border-radius: var(--radius-md);
}

.logoName {
  font-size: var(--font-lg);
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.heading {
  font-size: var(--font-3xl);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin: 0;
}

.subheading {
  font-size: var(--font-base);
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  max-width: 420px;
}

/* ─── Card grid ─────────────────────────────────────────────────────────────── */

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  width: 100%;
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* ─── Dashboard card ────────────────────────────────────────────────────────── */

.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  cursor: pointer;
  text-align: left;
  transition: transform 150ms, background 150ms, border-color 150ms, box-shadow 150ms;
}

.card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.card:active {
  transform: translateY(0);
}

/* ─── Card variants ─────────────────────────────────────────────────────────── */

.cardSekolah .cardIcon {
  background: rgba(15, 108, 189, 0.2);
  color: #5db4f7;
}

.cardSekolah:hover {
  border-color: rgba(15, 108, 189, 0.5);
  box-shadow: 0 8px 32px rgba(15, 108, 189, 0.25);
}

.cardKoperasi .cardIcon {
  background: rgba(26, 127, 75, 0.2);
  color: #4ecb83;
}

.cardKoperasi:hover {
  border-color: rgba(26, 127, 75, 0.5);
  box-shadow: 0 8px 32px rgba(26, 127, 75, 0.25);
}

/* ─── Card icon ─────────────────────────────────────────────────────────────── */

.cardIcon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ─── Card text ─────────────────────────────────────────────────────────────── */

.cardBody {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.cardLabel {
  font-size: var(--font-lg);
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.cardDesc {
  font-size: var(--font-sm);
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
}
```

- [ ] **Step 1.5: Run tests — verify they pass**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/pages/ChooseDashboard/ChooseDashboardPage.test.tsx
```

Expected: PASS — 4 tests

- [ ] **Step 1.6: Commit**

```bash
git add src/pages/ChooseDashboard/ChooseDashboardPage.tsx \
        src/pages/ChooseDashboard/ChooseDashboardPage.module.css \
        src/pages/ChooseDashboard/ChooseDashboardPage.test.tsx
git commit -m "feat: add ChooseDashboardPage (sekolah / koperasi picker)"
```

---

## Task 2: SUBNAV_CONFIG

**Files:**
- Create: `src/layouts/AppSubNav/subnav.config.ts`

- [ ] **Step 2.1: Write the failing test**

Create `src/layouts/AppSubNav/subnav.config.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SUBNAV_CONFIG } from './subnav.config'

describe('SUBNAV_CONFIG', () => {
  it('has sekolah and koperasi top-level keys', () => {
    expect(SUBNAV_CONFIG).toHaveProperty('sekolah')
    expect(SUBNAV_CONFIG).toHaveProperty('koperasi')
  })

  it('sekolah.siswa has 5 items with required fields', () => {
    const items = SUBNAV_CONFIG.sekolah.siswa
    expect(items).toHaveLength(5)
    items.forEach((item) => {
      expect(item).toHaveProperty('key')
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('path')
      expect(item.path).toMatch(/^\/sekolah\/siswa/)
    })
  })

  it('sekolah.akademik has 7 items', () => {
    expect(SUBNAV_CONFIG.sekolah.akademik).toHaveLength(7)
  })

  it('koperasi.anggota has 3 items', () => {
    expect(SUBNAV_CONFIG.koperasi.anggota).toHaveLength(3)
  })

  it('every item path is a non-empty string starting with /', () => {
    const allItems = [
      ...Object.values(SUBNAV_CONFIG.sekolah).flat(),
      ...Object.values(SUBNAV_CONFIG.koperasi).flat(),
    ]
    allItems.forEach((item) => {
      expect(typeof item.path).toBe('string')
      expect(item.path.startsWith('/')).toBe(true)
    })
  })
})
```

- [ ] **Step 2.2: Run test — verify it fails**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/layouts/AppSubNav/subnav.config.test.ts
```

Expected: FAIL — `Cannot find module './subnav.config'`

- [ ] **Step 2.3: Create subnav.config.ts**

```ts
// src/layouts/AppSubNav/subnav.config.ts
//
// SUBNAV_CONFIG maps context → nav1Key → array of secondary nav items.
// AppSubNav reads this at runtime to render the secondary nav bar.

export interface SubNavConfigItem {
  key: string
  label: string
  path: string
}

type SubNavConfig = {
  sekolah: Record<string, SubNavConfigItem[]>
  koperasi: Record<string, SubNavConfigItem[]>
}

export const SUBNAV_CONFIG: SubNavConfig = {
  sekolah: {
    siswa: [
      { key: 'siswa',       label: 'Daftar Siswa',       path: '/sekolah/siswa' },
      { key: 'pendaftaran', label: 'Pendaftaran Siswa',   path: '/sekolah/siswa/pendaftaran' },
      { key: 'rombel',      label: 'Rombongan Belajar',   path: '/sekolah/siswa/rombel' },
      { key: 'mutasi',      label: 'Mutasi Siswa',        path: '/sekolah/siswa/mutasi' },
      { key: 'kelulusan',   label: 'Kelulusan Siswa',     path: '/sekolah/siswa/kelulusan' },
    ],
    guru: [
      { key: 'guru',       label: 'Daftar Guru',    path: '/sekolah/guru' },
      { key: 'penugasan',  label: 'Penugasan Guru',  path: '/sekolah/guru/penugasan' },
      { key: 'berkas',     label: 'Berkas Guru',     path: '/sekolah/guru/berkas' },
    ],
    akademik: [
      { key: 'mata-pelajaran',  label: 'Mata Pelajaran',   path: '/sekolah/akademik/mata-pelajaran' },
      { key: 'jadwal',          label: 'Jadwal Pelajaran',  path: '/sekolah/akademik/jadwal' },
      { key: 'absensi-siswa',   label: 'Absensi Siswa',    path: '/sekolah/akademik/absensi-siswa' },
      { key: 'absensi-guru',    label: 'Absensi Guru',     path: '/sekolah/akademik/absensi-guru' },
      { key: 'penilaian',       label: 'Penilaian',        path: '/sekolah/akademik/penilaian' },
      { key: 'raport',          label: 'Raport',           path: '/sekolah/akademik/raport' },
      { key: 'laporan-dinas',   label: 'Laporan Dinas',    path: '/sekolah/akademik/laporan-dinas' },
    ],
    perpustakaan: [
      { key: 'buku',        label: 'Katalog Buku',        path: '/sekolah/perpustakaan/buku' },
      { key: 'anggota',     label: 'Anggota',             path: '/sekolah/perpustakaan/anggota' },
      { key: 'peminjaman',  label: 'Peminjaman',          path: '/sekolah/perpustakaan/peminjaman' },
      { key: 'pengembalian',label: 'Pengembalian',        path: '/sekolah/perpustakaan/pengembalian' },
      { key: 'denda',       label: 'Denda',               path: '/sekolah/perpustakaan/denda' },
      { key: 'reservasi',   label: 'Reservasi',           path: '/sekolah/perpustakaan/reservasi' },
    ],
    pengaturan: [
      { key: 'sekolah',    label: 'Sekolah',          path: '/sekolah/pengaturan/sekolah' },
      { key: 'tahun-ajaran', label: 'Tahun Ajaran',   path: '/sekolah/pengaturan/tahun-ajaran' },
      { key: 'semester',   label: 'Semester',         path: '/sekolah/pengaturan/semester' },
      { key: 'modul-aktif',label: 'Modul Aktif',      path: '/sekolah/pengaturan/modul-aktif' },
    ],
  },
  koperasi: {
    anggota: [
      { key: 'nasabah',           label: 'Nasabah',           path: '/koperasi/anggota/nasabah' },
      { key: 'anggota-koperasi',  label: 'Anggota Koperasi',  path: '/koperasi/anggota/anggota-koperasi' },
      { key: 'simpanan-pokok',    label: 'Simpanan Pokok',    path: '/koperasi/anggota/simpanan-pokok' },
    ],
    simpanan: [
      { key: 'produk',       label: 'Produk Simpanan',   path: '/koperasi/simpanan/produk' },
      { key: 'rekening',     label: 'Rekening Simpanan', path: '/koperasi/simpanan/rekening' },
      { key: 'transaksi',    label: 'Transaksi',         path: '/koperasi/simpanan/transaksi' },
      { key: 'permohonan',   label: 'Permohonan',        path: '/koperasi/simpanan/permohonan' },
    ],
    pembiayaan: [
      { key: 'produk',     label: 'Produk Pembiayaan',   path: '/koperasi/pembiayaan/produk' },
      { key: 'akad',       label: 'Akad Pembiayaan',     path: '/koperasi/pembiayaan/akad' },
      { key: 'pembayaran', label: 'Pembayaran Angsuran', path: '/koperasi/pembiayaan/pembayaran' },
      { key: 'shu',        label: 'Pembagian SHU',       path: '/koperasi/pembiayaan/shu' },
    ],
    kartu: [
      { key: 'kartu',    label: 'Daftar Kartu', path: '/koperasi/kartu/daftar' },
      { key: 'terminal', label: 'Terminal',     path: '/koperasi/kartu/terminal' },
      { key: 'merchant', label: 'Merchant',     path: '/koperasi/kartu/merchant' },
    ],
    zis: [
      { key: 'penerimaan',  label: 'Penerimaan ZIS',    path: '/koperasi/zis/penerimaan' },
      { key: 'program',     label: 'Program Penyaluran', path: '/koperasi/zis/program' },
      { key: 'penyaluran',  label: 'Penyaluran ZIS',    path: '/koperasi/zis/penyaluran' },
      { key: 'wakaf',       label: 'Aset Wakaf',        path: '/koperasi/zis/wakaf' },
    ],
    'kas-teller': [
      { key: 'sesi', label: 'Sesi Kas Teller', path: '/koperasi/kas-teller/sesi' },
    ],
    laporan: [
      { key: 'export', label: 'Export Laporan', path: '/koperasi/laporan/export' },
    ],
    pengaturan: [
      { key: 'pengaturan-koperasi', label: 'Pengaturan Koperasi', path: '/koperasi/pengaturan/koperasi' },
    ],
  },
}
```

- [ ] **Step 2.4: Run tests — verify they pass**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/layouts/AppSubNav/subnav.config.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 2.5: Commit**

```bash
git add src/layouts/AppSubNav/subnav.config.ts \
        src/layouts/AppSubNav/subnav.config.test.ts
git commit -m "feat: add SUBNAV_CONFIG with sekolah and koperasi nav items"
```

---

## Task 3: AppSubNav component

**Files:**
- Create: `src/layouts/AppSubNav/AppSubNav.tsx`
- Create: `src/layouts/AppSubNav/AppSubNav.module.css`

- [ ] **Step 3.1: Write the failing test**

Create `src/layouts/AppSubNav/AppSubNav.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { AppSubNav } from './AppSubNav'

describe('AppSubNav', () => {
  it('renders nothing when pathname has no nav1 segment', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/sekolah/dashboard']}>
        <AppSubNav context="sekolah" />
      </MemoryRouter>,
    )
    // dashboard has no subnav config → renders null
    expect(container.firstChild).toBeNull()
  })

  it('renders subnav items for sekolah/siswa', () => {
    render(
      <MemoryRouter initialEntries={['/sekolah/siswa']}>
        <AppSubNav context="sekolah" />
      </MemoryRouter>,
    )
    expect(screen.getByText('Daftar Siswa')).toBeInTheDocument()
    expect(screen.getByText('Pendaftaran Siswa')).toBeInTheDocument()
    expect(screen.getByText('Rombongan Belajar')).toBeInTheDocument()
    expect(screen.getByText('Mutasi Siswa')).toBeInTheDocument()
    expect(screen.getByText('Kelulusan Siswa')).toBeInTheDocument()
  })

  it('renders subnav items for koperasi/anggota', () => {
    render(
      <MemoryRouter initialEntries={['/koperasi/anggota']}>
        <AppSubNav context="koperasi" />
      </MemoryRouter>,
    )
    expect(screen.getByText('Nasabah')).toBeInTheDocument()
    expect(screen.getByText('Anggota Koperasi')).toBeInTheDocument()
    expect(screen.getByText('Simpanan Pokok')).toBeInTheDocument()
  })

  it('marks the current path item as active', () => {
    render(
      <MemoryRouter initialEntries={['/sekolah/siswa']}>
        <AppSubNav context="sekolah" />
      </MemoryRouter>,
    )
    // The "Daftar Siswa" link points to /sekolah/siswa (exact match)
    const link = screen.getByText('Daftar Siswa').closest('a')
    expect(link?.className).toMatch(/active/i)
  })

  it('renders nothing when context mismatches pathname', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/koperasi/anggota']}>
        {/* context=sekolah but URL is /koperasi/... → no items found */}
        <AppSubNav context="sekolah" />
      </MemoryRouter>,
    )
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 3.2: Run test — verify it fails**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/layouts/AppSubNav/AppSubNav.test.tsx
```

Expected: FAIL — `Cannot find module './AppSubNav'`

- [ ] **Step 3.3: Create AppSubNav.tsx**

```tsx
// src/layouts/AppSubNav/AppSubNav.tsx
//
// Secondary horizontal nav bar rendered below AppNavbar.
// Only visible when the active Nav1 item has submenu items in SUBNAV_CONFIG.
// Active item determined by exact pathname match or startsWith for nested routes.

import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import type { AppContext } from '@/layouts/AppShell/AppShell'
import { SUBNAV_CONFIG } from './subnav.config'
import styles from './AppSubNav.module.css'

interface AppSubNavProps {
  context: AppContext
}

export function AppSubNav({ context }: AppSubNavProps) {
  const { pathname } = useLocation()

  // Extract nav1 key: /sekolah/siswa/... → "siswa", /koperasi/kas-teller/... → "kas-teller"
  // pathname.split('/') = ['', 'sekolah', 'siswa', ...]  → index 2
  const nav1Key = pathname.split('/')[2] ?? ''

  const contextConfig = SUBNAV_CONFIG[context as keyof typeof SUBNAV_CONFIG]
  if (!contextConfig) return null

  const items = contextConfig[nav1Key]
  if (!items || items.length === 0) return null

  function isActive(itemPath: string): boolean {
    // Exact match wins; otherwise check prefix for nested sub-routes
    if (pathname === itemPath) return true
    // Only treat as prefix-match when the item path has depth beyond the nav1 segment
    // e.g. /sekolah/siswa/pendaftaran should not match /sekolah/siswa
    const nav1Segment = `/${context}/${nav1Key}`
    if (itemPath === nav1Segment) {
      // "root" subnav item (e.g. Daftar Siswa at /sekolah/siswa)
      // only active when pathname IS exactly that path or directly under it but not another subnav path
      return pathname === itemPath
    }
    return pathname.startsWith(itemPath)
  }

  return (
    <nav
      className={cn(styles.subnav, styles[`subnav_${context}`])}
      aria-label="Sub-navigasi"
    >
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.key}>
            <Link
              to={item.path}
              className={cn(styles.item, isActive(item.path) && styles.itemActive)}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 3.4: Create AppSubNav.module.css**

```css
/* ─── Sub-navigation bar ────────────────────────────────────────────────────── */

.subnav {
  position: sticky;
  top: var(--navbar-height);
  z-index: calc(var(--z-navbar) - 1);
  height: 38px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}

.subnav::-webkit-scrollbar {
  display: none;
}

/* ─── Context colour variants ───────────────────────────────────────────────── */

/* Sekolah — slightly lighter than AppNavbar #0F6CBD */
.subnav_sekolah {
  background: #0d5fa8;
  border-bottom-color: rgba(15, 108, 189, 0.25);
}

/* Koperasi — slightly lighter than AppNavbar #1A7F4B */
.subnav_koperasi {
  background: #186e41;
  border-bottom-color: rgba(26, 127, 75, 0.25);
}

/* ─── Item list ─────────────────────────────────────────────────────────────── */

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0;
  height: 100%;
  white-space: nowrap;
}

/* ─── Nav item link ─────────────────────────────────────────────────────────── */

.item {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 var(--space-4);
  font-size: var(--font-sm);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: color 120ms, border-color 120ms;
  position: relative;
  top: 1px; /* align bottom border with container border */
}

.item:hover {
  color: rgba(255, 255, 255, 0.9);
}

/* ─── Active state ──────────────────────────────────────────────────────────── */

.itemActive {
  color: #ffffff;
  border-bottom-color: rgba(255, 255, 255, 0.85);
}
```

- [ ] **Step 3.5: Run tests — verify they pass**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/layouts/AppSubNav/AppSubNav.test.tsx
```

Expected: PASS — 5 tests

- [ ] **Step 3.6: Commit**

```bash
git add src/layouts/AppSubNav/AppSubNav.tsx \
        src/layouts/AppSubNav/AppSubNav.module.css \
        src/layouts/AppSubNav/AppSubNav.test.tsx
git commit -m "feat: add AppSubNav secondary horizontal nav bar"
```

---

## Task 4: AppShell update

**Files:**
- Modify: `src/layouts/AppShell/AppShell.tsx`

- [ ] **Step 4.1: Write the failing test**

Create `src/layouts/AppShell/AppShell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

// Minimal mocks so AppNavbar and AppSubNav don't blow up
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    user: null,
    selectedCompany: null,
    selectedGroup: null,
    logout: vi.fn(),
  }),
}))
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
    // AppNavbar renders a <nav> element
    expect(document.querySelector('nav')).toBeInTheDocument()
  })

  it('renders AppSubNav when nav1 has subnav config', () => {
    render(
      <MemoryRouter initialEntries={['/sekolah/siswa']}>
        <AppShell context="sekolah" />
      </MemoryRouter>,
    )
    // AppSubNav renders a <nav aria-label="Sub-navigasi">
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
```

- [ ] **Step 4.2: Run test — verify it fails**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/layouts/AppShell/AppShell.test.tsx
```

Expected: FAIL — `AppSubNav` not rendered (component not wired in yet)

- [ ] **Step 4.3: Modify AppShell.tsx**

Replace the entire file content:

```tsx
import { Outlet } from 'react-router-dom'
import { AppNavbar } from '@/layouts/AppNavbar/AppNavbar'
import { AppSubNav } from '@/layouts/AppSubNav/AppSubNav'
import styles from './AppShell.module.css'

export type AppContext = 'default' | 'superuser' | 'hq' | 'company' | 'sekolah' | 'koperasi'

interface AppShellProps {
  /** Multi-tenant context — controls navbar colour, nav items, and subnav. */
  context?: AppContext
}

export function AppShell({ context = 'default' }: AppShellProps) {
  return (
    <div className={styles.root}>
      <AppNavbar context={context} />
      <AppSubNav context={context} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4.4: Run tests — verify they pass**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/layouts/AppShell/AppShell.test.tsx
```

Expected: PASS — 3 tests

- [ ] **Step 4.5: Commit**

```bash
git add src/layouts/AppShell/AppShell.tsx \
        src/layouts/AppShell/AppShell.test.tsx
git commit -m "feat: wire AppSubNav into AppShell below AppNavbar"
```

---

## Task 5: routes.sekolah.tsx (stub routes)

**Files:**
- Create: `src/app/routes.sekolah.tsx`

All page imports in this file are inline placeholder components — real pages are added in later phases. This keeps TypeScript happy without creating dozens of empty files.

- [ ] **Step 5.1: Write the failing test**

Create `src/app/routes.sekolah.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { sekolahRoutes } from './routes.sekolah'

describe('sekolahRoutes', () => {
  it('exports an array', () => {
    expect(Array.isArray(sekolahRoutes)).toBe(true)
  })

  it('has exactly one root entry at path /sekolah', () => {
    expect(sekolahRoutes).toHaveLength(1)
    expect(sekolahRoutes[0].path).toBe('/sekolah')
  })

  it('has a child route for dashboard', () => {
    const children = sekolahRoutes[0].children ?? []
    expect(children.some((c) => c.path === 'dashboard')).toBe(true)
  })

  it('has child routes for all 5 nav1 modules', () => {
    const children = sekolahRoutes[0].children ?? []
    const nav1Keys = ['siswa', 'guru', 'akademik', 'perpustakaan', 'pengaturan']
    nav1Keys.forEach((key) => {
      expect(children.some((c) => c.path === key)).toBe(true)
    })
  })
})
```

- [ ] **Step 5.2: Run test — verify it fails**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/app/routes.sekolah.test.tsx
```

Expected: FAIL — `Cannot find module './routes.sekolah'`

- [ ] **Step 5.3: Create routes.sekolah.tsx**

```tsx
// src/app/routes.sekolah.tsx
//
// All /sekolah/* routes.
// Page imports are lazy stubs — replace with real imports as pages are built.

import { lazy, Suspense } from 'react'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { AuthRoute } from './ProtectedRoute'

// ─── Placeholder page factory ─────────────────────────────────────────────────
// Returns a named placeholder component — replace with real lazy import later.

function stub(label: string) {
  return function StubPage() {
    return <div style={{ padding: 32, color: '#999' }}>{label} — coming soon</div>
  }
}

// ─── Suspense wrapper ─────────────────────────────────────────────────────────

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div />}>{children}</Suspense>
}

// ─── Lazy page imports (replace stubs with real imports as pages are built) ───

// Siswa
const SiswaListPage      = lazy(() => Promise.resolve({ default: stub('SiswaListPage') }))
const SiswaDetailPage    = lazy(() => Promise.resolve({ default: stub('SiswaDetailPage') }))
const SiswaFormPage      = lazy(() => Promise.resolve({ default: stub('SiswaFormPage') }))

// Siswa — sub-entities (subnav items under /sekolah/siswa/*)
const PendaftaranSiswaListPage  = lazy(() => Promise.resolve({ default: stub('PendaftaranSiswaListPage') }))
const PendaftaranSiswaFormPage  = lazy(() => Promise.resolve({ default: stub('PendaftaranSiswaFormPage') }))
const RombelListPage            = lazy(() => Promise.resolve({ default: stub('RombelListPage') }))
const RombelFormPage            = lazy(() => Promise.resolve({ default: stub('RombelFormPage') }))
const MutasiSiswaListPage       = lazy(() => Promise.resolve({ default: stub('MutasiSiswaListPage') }))
const MutasiSiswaFormPage       = lazy(() => Promise.resolve({ default: stub('MutasiSiswaFormPage') }))
const KelulusanSiswaListPage    = lazy(() => Promise.resolve({ default: stub('KelulusanSiswaListPage') }))
const KelulusanSiswaFormPage    = lazy(() => Promise.resolve({ default: stub('KelulusanSiswaFormPage') }))

// Guru
const GuruListPage       = lazy(() => Promise.resolve({ default: stub('GuruListPage') }))
const GuruDetailPage     = lazy(() => Promise.resolve({ default: stub('GuruDetailPage') }))
const GuruFormPage       = lazy(() => Promise.resolve({ default: stub('GuruFormPage') }))
const PenugasanGuruListPage = lazy(() => Promise.resolve({ default: stub('PenugasanGuruListPage') }))
const PenugasanGuruFormPage = lazy(() => Promise.resolve({ default: stub('PenugasanGuruFormPage') }))
const BerkasGuruListPage    = lazy(() => Promise.resolve({ default: stub('BerkasGuruListPage') }))
const BerkasGuruFormPage    = lazy(() => Promise.resolve({ default: stub('BerkasGuruFormPage') }))

// Akademik
const MataPelajaranListPage   = lazy(() => Promise.resolve({ default: stub('MataPelajaranListPage') }))
const MataPelajaranFormPage   = lazy(() => Promise.resolve({ default: stub('MataPelajaranFormPage') }))
const JadwalListPage          = lazy(() => Promise.resolve({ default: stub('JadwalListPage') }))
const JadwalDetailPage        = lazy(() => Promise.resolve({ default: stub('JadwalDetailPage') }))
const JadwalFormPage          = lazy(() => Promise.resolve({ default: stub('JadwalFormPage') }))
const AbsensiSiswaListPage    = lazy(() => Promise.resolve({ default: stub('AbsensiSiswaListPage') }))
const AbsensiSiswaFormPage    = lazy(() => Promise.resolve({ default: stub('AbsensiSiswaFormPage') }))
const AbsensiGuruListPage     = lazy(() => Promise.resolve({ default: stub('AbsensiGuruListPage') }))
const AbsensiGuruFormPage     = lazy(() => Promise.resolve({ default: stub('AbsensiGuruFormPage') }))
const PenilaianListPage       = lazy(() => Promise.resolve({ default: stub('PenilaianListPage') }))
const PenilaianFormPage       = lazy(() => Promise.resolve({ default: stub('PenilaianFormPage') }))
const RaportListPage          = lazy(() => Promise.resolve({ default: stub('RaportListPage') }))
const RaportDetailPage        = lazy(() => Promise.resolve({ default: stub('RaportDetailPage') }))
const LaporanDinasPage        = lazy(() => Promise.resolve({ default: stub('LaporanDinasPage') }))

// Perpustakaan
const BukuListPage                  = lazy(() => Promise.resolve({ default: stub('BukuListPage') }))
const BukuDetailPage                = lazy(() => Promise.resolve({ default: stub('BukuDetailPage') }))
const BukuFormPage                  = lazy(() => Promise.resolve({ default: stub('BukuFormPage') }))
const AnggotaPerpustakaanListPage   = lazy(() => Promise.resolve({ default: stub('AnggotaPerpustakaanListPage') }))
const AnggotaPerpustakaanFormPage   = lazy(() => Promise.resolve({ default: stub('AnggotaPerpustakaanFormPage') }))
const PeminjamanListPage            = lazy(() => Promise.resolve({ default: stub('PeminjamanListPage') }))
const PeminjamanDetailPage          = lazy(() => Promise.resolve({ default: stub('PeminjamanDetailPage') }))
const PeminjamanFormPage            = lazy(() => Promise.resolve({ default: stub('PeminjamanFormPage') }))
const PengembalianListPage          = lazy(() => Promise.resolve({ default: stub('PengembalianListPage') }))
const PengembalianFormPage          = lazy(() => Promise.resolve({ default: stub('PengembalianFormPage') }))
const DendaListPage                 = lazy(() => Promise.resolve({ default: stub('DendaListPage') }))
const ReservasiListPage             = lazy(() => Promise.resolve({ default: stub('ReservasiListPage') }))
const ReservasiFormPage             = lazy(() => Promise.resolve({ default: stub('ReservasiFormPage') }))

// Pengaturan
const SekolahSettingsPage   = lazy(() => Promise.resolve({ default: stub('SekolahSettingsPage') }))
const TahunAjaranListPage   = lazy(() => Promise.resolve({ default: stub('TahunAjaranListPage') }))
const TahunAjaranFormPage   = lazy(() => Promise.resolve({ default: stub('TahunAjaranFormPage') }))
const SemesterListPage      = lazy(() => Promise.resolve({ default: stub('SemesterListPage') }))
const SemesterFormPage      = lazy(() => Promise.resolve({ default: stub('SemesterFormPage') }))
const ModulAktifPage        = lazy(() => Promise.resolve({ default: stub('ModulAktifPage') }))

// Dashboard (reuse shared DashboardPage)
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'))

// ─── Route tree ───────────────────────────────────────────────────────────────

export const sekolahRoutes = [
  {
    path: '/sekolah',
    element: <AuthRoute><AppShell context="sekolah" /></AuthRoute>,
    children: [
      { path: 'dashboard', element: <S><DashboardPage /></S> },

      // ── Siswa ────────────────────────────────────────────────────────────────
      { path: 'siswa',              element: <S><SiswaListPage /></S> },
      { path: 'siswa/new',          element: <S><SiswaFormPage /></S> },
      { path: 'siswa/:id',          element: <S><SiswaDetailPage /></S> },
      { path: 'siswa/:id/edit',     element: <S><SiswaFormPage /></S> },
      // Pendaftaran Siswa
      { path: 'siswa/pendaftaran',          element: <S><PendaftaranSiswaListPage /></S> },
      { path: 'siswa/pendaftaran/new',      element: <S><PendaftaranSiswaFormPage /></S> },
      { path: 'siswa/pendaftaran/:id/edit', element: <S><PendaftaranSiswaFormPage /></S> },
      // Rombongan Belajar
      { path: 'siswa/rombel',          element: <S><RombelListPage /></S> },
      { path: 'siswa/rombel/new',      element: <S><RombelFormPage /></S> },
      { path: 'siswa/rombel/:id/edit', element: <S><RombelFormPage /></S> },
      // Mutasi Siswa
      { path: 'siswa/mutasi',          element: <S><MutasiSiswaListPage /></S> },
      { path: 'siswa/mutasi/new',      element: <S><MutasiSiswaFormPage /></S> },
      { path: 'siswa/mutasi/:id/edit', element: <S><MutasiSiswaFormPage /></S> },
      // Kelulusan Siswa
      { path: 'siswa/kelulusan',          element: <S><KelulusanSiswaListPage /></S> },
      { path: 'siswa/kelulusan/new',      element: <S><KelulusanSiswaFormPage /></S> },
      { path: 'siswa/kelulusan/:id/edit', element: <S><KelulusanSiswaFormPage /></S> },

      // ── Guru ─────────────────────────────────────────────────────────────────
      { path: 'guru',              element: <S><GuruListPage /></S> },
      { path: 'guru/new',          element: <S><GuruFormPage /></S> },
      { path: 'guru/:id',          element: <S><GuruDetailPage /></S> },
      { path: 'guru/:id/edit',     element: <S><GuruFormPage /></S> },
      // Penugasan Guru
      { path: 'guru/penugasan',          element: <S><PenugasanGuruListPage /></S> },
      { path: 'guru/penugasan/new',      element: <S><PenugasanGuruFormPage /></S> },
      { path: 'guru/penugasan/:id/edit', element: <S><PenugasanGuruFormPage /></S> },
      // Berkas Guru
      { path: 'guru/berkas',          element: <S><BerkasGuruListPage /></S> },
      { path: 'guru/berkas/new',      element: <S><BerkasGuruFormPage /></S> },
      { path: 'guru/berkas/:id/edit', element: <S><BerkasGuruFormPage /></S> },

      // ── Akademik ──────────────────────────────────────────────────────────────
      // Mata Pelajaran
      { path: 'akademik/mata-pelajaran',          element: <S><MataPelajaranListPage /></S> },
      { path: 'akademik/mata-pelajaran/new',      element: <S><MataPelajaranFormPage /></S> },
      { path: 'akademik/mata-pelajaran/:id/edit', element: <S><MataPelajaranFormPage /></S> },
      // Jadwal Pelajaran
      { path: 'akademik/jadwal',          element: <S><JadwalListPage /></S> },
      { path: 'akademik/jadwal/new',      element: <S><JadwalFormPage /></S> },
      { path: 'akademik/jadwal/:id',      element: <S><JadwalDetailPage /></S> },
      { path: 'akademik/jadwal/:id/edit', element: <S><JadwalFormPage /></S> },
      // Absensi Siswa
      { path: 'akademik/absensi-siswa',          element: <S><AbsensiSiswaListPage /></S> },
      { path: 'akademik/absensi-siswa/new',      element: <S><AbsensiSiswaFormPage /></S> },
      { path: 'akademik/absensi-siswa/:id/edit', element: <S><AbsensiSiswaFormPage /></S> },
      // Absensi Guru
      { path: 'akademik/absensi-guru',          element: <S><AbsensiGuruListPage /></S> },
      { path: 'akademik/absensi-guru/new',      element: <S><AbsensiGuruFormPage /></S> },
      { path: 'akademik/absensi-guru/:id/edit', element: <S><AbsensiGuruFormPage /></S> },
      // Penilaian
      { path: 'akademik/penilaian',          element: <S><PenilaianListPage /></S> },
      { path: 'akademik/penilaian/new',      element: <S><PenilaianFormPage /></S> },
      { path: 'akademik/penilaian/:id/edit', element: <S><PenilaianFormPage /></S> },
      // Raport
      { path: 'akademik/raport',          element: <S><RaportListPage /></S> },
      { path: 'akademik/raport/:id',      element: <S><RaportDetailPage /></S> },
      // Laporan Dinas
      { path: 'akademik/laporan-dinas', element: <S><LaporanDinasPage /></S> },

      // ── Perpustakaan ──────────────────────────────────────────────────────────
      // Buku / Katalog
      { path: 'perpustakaan/buku',          element: <S><BukuListPage /></S> },
      { path: 'perpustakaan/buku/new',      element: <S><BukuFormPage /></S> },
      { path: 'perpustakaan/buku/:id',      element: <S><BukuDetailPage /></S> },
      { path: 'perpustakaan/buku/:id/edit', element: <S><BukuFormPage /></S> },
      // Anggota Perpustakaan
      { path: 'perpustakaan/anggota',          element: <S><AnggotaPerpustakaanListPage /></S> },
      { path: 'perpustakaan/anggota/new',      element: <S><AnggotaPerpustakaanFormPage /></S> },
      { path: 'perpustakaan/anggota/:id/edit', element: <S><AnggotaPerpustakaanFormPage /></S> },
      // Peminjaman
      { path: 'perpustakaan/peminjaman',          element: <S><PeminjamanListPage /></S> },
      { path: 'perpustakaan/peminjaman/new',      element: <S><PeminjamanFormPage /></S> },
      { path: 'perpustakaan/peminjaman/:id',      element: <S><PeminjamanDetailPage /></S> },
      { path: 'perpustakaan/peminjaman/:id/edit', element: <S><PeminjamanFormPage /></S> },
      // Pengembalian
      { path: 'perpustakaan/pengembalian',          element: <S><PengembalianListPage /></S> },
      { path: 'perpustakaan/pengembalian/new',      element: <S><PengembalianFormPage /></S> },
      { path: 'perpustakaan/pengembalian/:id/edit', element: <S><PengembalianFormPage /></S> },
      // Denda
      { path: 'perpustakaan/denda', element: <S><DendaListPage /></S> },
      // Reservasi
      { path: 'perpustakaan/reservasi',          element: <S><ReservasiListPage /></S> },
      { path: 'perpustakaan/reservasi/new',      element: <S><ReservasiFormPage /></S> },
      { path: 'perpustakaan/reservasi/:id/edit', element: <S><ReservasiFormPage /></S> },

      // ── Pengaturan ────────────────────────────────────────────────────────────
      { path: 'pengaturan/sekolah',               element: <S><SekolahSettingsPage /></S> },
      { path: 'pengaturan/tahun-ajaran',          element: <S><TahunAjaranListPage /></S> },
      { path: 'pengaturan/tahun-ajaran/new',      element: <S><TahunAjaranFormPage /></S> },
      { path: 'pengaturan/tahun-ajaran/:id/edit', element: <S><TahunAjaranFormPage /></S> },
      { path: 'pengaturan/semester',              element: <S><SemesterListPage /></S> },
      { path: 'pengaturan/semester/new',          element: <S><SemesterFormPage /></S> },
      { path: 'pengaturan/semester/:id/edit',     element: <S><SemesterFormPage /></S> },
      { path: 'pengaturan/modul-aktif',           element: <S><ModulAktifPage /></S> },
    ],
  },
]
```

- [ ] **Step 5.4: Run tests — verify they pass**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/app/routes.sekolah.test.tsx
```

Expected: PASS — 4 tests

- [ ] **Step 5.5: Commit**

```bash
git add src/app/routes.sekolah.tsx src/app/routes.sekolah.test.tsx
git commit -m "feat: add sekolah route stubs for all nav1 modules and subnav entities"
```

---

## Task 6: routes.koperasi.tsx (stub routes)

**Files:**
- Create: `src/app/routes.koperasi.tsx`

- [ ] **Step 6.1: Write the failing test**

Create `src/app/routes.koperasi.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { koperasiRoutes } from './routes.koperasi'

describe('koperasiRoutes', () => {
  it('exports an array', () => {
    expect(Array.isArray(koperasiRoutes)).toBe(true)
  })

  it('has exactly one root entry at path /koperasi', () => {
    expect(koperasiRoutes).toHaveLength(1)
    expect(koperasiRoutes[0].path).toBe('/koperasi')
  })

  it('has a child route for dashboard', () => {
    const children = koperasiRoutes[0].children ?? []
    expect(children.some((c) => c.path === 'dashboard')).toBe(true)
  })

  it('has child routes for all 8 nav1 modules', () => {
    const children = koperasiRoutes[0].children ?? []
    const nav1Keys = ['anggota', 'simpanan', 'pembiayaan', 'kartu', 'zis', 'kas-teller', 'laporan', 'pengaturan']
    nav1Keys.forEach((key) => {
      const hasModule = children.some((c) => c.path?.startsWith(key))
      expect(hasModule, `missing module: ${key}`).toBe(true)
    })
  })
})
```

- [ ] **Step 6.2: Run test — verify it fails**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/app/routes.koperasi.test.tsx
```

Expected: FAIL — `Cannot find module './routes.koperasi'`

- [ ] **Step 6.3: Create routes.koperasi.tsx**

```tsx
// src/app/routes.koperasi.tsx
//
// All /koperasi/* routes.
// Page imports are lazy stubs — replace with real imports as pages are built.

import { lazy, Suspense } from 'react'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { AuthRoute } from './ProtectedRoute'

function stub(label: string) {
  return function StubPage() {
    return <div style={{ padding: 32, color: '#999' }}>{label} — coming soon</div>
  }
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div />}>{children}</Suspense>
}

// ─── Anggota ──────────────────────────────────────────────────────────────────
const NasabahListPage           = lazy(() => Promise.resolve({ default: stub('NasabahListPage') }))
const NasabahDetailPage         = lazy(() => Promise.resolve({ default: stub('NasabahDetailPage') }))
const NasabahFormPage           = lazy(() => Promise.resolve({ default: stub('NasabahFormPage') }))
const AnggotaKoperasiListPage   = lazy(() => Promise.resolve({ default: stub('AnggotaKoperasiListPage') }))
const AnggotaKoperasiFormPage   = lazy(() => Promise.resolve({ default: stub('AnggotaKoperasiFormPage') }))
const SimpananPokokListPage     = lazy(() => Promise.resolve({ default: stub('SimpananPokokListPage') }))

// ─── Simpanan ─────────────────────────────────────────────────────────────────
const ProdukSimpananListPage  = lazy(() => Promise.resolve({ default: stub('ProdukSimpananListPage') }))
const ProdukSimpananFormPage  = lazy(() => Promise.resolve({ default: stub('ProdukSimpananFormPage') }))
const RekeningListPage        = lazy(() => Promise.resolve({ default: stub('RekeningListPage') }))
const RekeningDetailPage      = lazy(() => Promise.resolve({ default: stub('RekeningDetailPage') }))
const RekeningFormPage        = lazy(() => Promise.resolve({ default: stub('RekeningFormPage') }))
const TransaksiSimpananListPage = lazy(() => Promise.resolve({ default: stub('TransaksiSimpananListPage') }))
const PermohonanListPage      = lazy(() => Promise.resolve({ default: stub('PermohonanListPage') }))
const PermohonanDetailPage    = lazy(() => Promise.resolve({ default: stub('PermohonanDetailPage') }))

// ─── Pembiayaan ───────────────────────────────────────────────────────────────
const ProdukPembiayaanListPage  = lazy(() => Promise.resolve({ default: stub('ProdukPembiayaanListPage') }))
const ProdukPembiayaanFormPage  = lazy(() => Promise.resolve({ default: stub('ProdukPembiayaanFormPage') }))
const AkadListPage              = lazy(() => Promise.resolve({ default: stub('AkadListPage') }))
const AkadDetailPage            = lazy(() => Promise.resolve({ default: stub('AkadDetailPage') }))
const AkadFormPage              = lazy(() => Promise.resolve({ default: stub('AkadFormPage') }))
const PembayaranAngsuranListPage = lazy(() => Promise.resolve({ default: stub('PembayaranAngsuranListPage') }))
const PembayaranAngsuranFormPage = lazy(() => Promise.resolve({ default: stub('PembayaranAngsuranFormPage') }))
const PembagianSHUListPage      = lazy(() => Promise.resolve({ default: stub('PembagianSHUListPage') }))
const PembagianSHUDetailPage    = lazy(() => Promise.resolve({ default: stub('PembagianSHUDetailPage') }))

// ─── Kartu ────────────────────────────────────────────────────────────────────
const KartuListPage    = lazy(() => Promise.resolve({ default: stub('KartuListPage') }))
const KartuDetailPage  = lazy(() => Promise.resolve({ default: stub('KartuDetailPage') }))
const TerminalListPage = lazy(() => Promise.resolve({ default: stub('TerminalListPage') }))
const TerminalFormPage = lazy(() => Promise.resolve({ default: stub('TerminalFormPage') }))
const MerchantListPage = lazy(() => Promise.resolve({ default: stub('MerchantListPage') }))
const MerchantFormPage = lazy(() => Promise.resolve({ default: stub('MerchantFormPage') }))

// ─── ZIS ──────────────────────────────────────────────────────────────────────
const PenerimaanZISListPage     = lazy(() => Promise.resolve({ default: stub('PenerimaanZISListPage') }))
const PenerimaanZISDetailPage   = lazy(() => Promise.resolve({ default: stub('PenerimaanZISDetailPage') }))
const PenerimaanZISFormPage     = lazy(() => Promise.resolve({ default: stub('PenerimaanZISFormPage') }))
const ProgramPenyaluranListPage = lazy(() => Promise.resolve({ default: stub('ProgramPenyaluranListPage') }))
const ProgramPenyaluranDetailPage = lazy(() => Promise.resolve({ default: stub('ProgramPenyaluranDetailPage') }))
const ProgramPenyaluranFormPage = lazy(() => Promise.resolve({ default: stub('ProgramPenyaluranFormPage') }))
const PenyaluranZISListPage     = lazy(() => Promise.resolve({ default: stub('PenyaluranZISListPage') }))
const PenyaluranZISFormPage     = lazy(() => Promise.resolve({ default: stub('PenyaluranZISFormPage') }))
const AsetWakafListPage         = lazy(() => Promise.resolve({ default: stub('AsetWakafListPage') }))
const AsetWakafFormPage         = lazy(() => Promise.resolve({ default: stub('AsetWakafFormPage') }))

// ─── Kas Teller ───────────────────────────────────────────────────────────────
const SesiKasTellerListPage   = lazy(() => Promise.resolve({ default: stub('SesiKasTellerListPage') }))
const SesiKasTellerDetailPage = lazy(() => Promise.resolve({ default: stub('SesiKasTellerDetailPage') }))
const SesiKasTellerFormPage   = lazy(() => Promise.resolve({ default: stub('SesiKasTellerFormPage') }))

// ─── Laporan ──────────────────────────────────────────────────────────────────
const LaporanKoperasiPage = lazy(() => Promise.resolve({ default: stub('LaporanKoperasiPage') }))

// ─── Pengaturan ───────────────────────────────────────────────────────────────
const PengaturanKoperasiPage = lazy(() => Promise.resolve({ default: stub('PengaturanKoperasiPage') }))

// Dashboard (reuse shared DashboardPage)
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'))

// ─── Route tree ───────────────────────────────────────────────────────────────

export const koperasiRoutes = [
  {
    path: '/koperasi',
    element: <AuthRoute><AppShell context="koperasi" /></AuthRoute>,
    children: [
      { path: 'dashboard', element: <S><DashboardPage /></S> },

      // ── Anggota ────────────────────────────────────────────────────────────
      { path: 'anggota/nasabah',                      element: <S><NasabahListPage /></S> },
      { path: 'anggota/nasabah/new',                  element: <S><NasabahFormPage /></S> },
      { path: 'anggota/nasabah/:id',                  element: <S><NasabahDetailPage /></S> },
      { path: 'anggota/nasabah/:id/edit',             element: <S><NasabahFormPage /></S> },
      { path: 'anggota/anggota-koperasi',             element: <S><AnggotaKoperasiListPage /></S> },
      { path: 'anggota/anggota-koperasi/new',         element: <S><AnggotaKoperasiFormPage /></S> },
      { path: 'anggota/anggota-koperasi/:id/edit',    element: <S><AnggotaKoperasiFormPage /></S> },
      { path: 'anggota/simpanan-pokok',               element: <S><SimpananPokokListPage /></S> },

      // ── Simpanan ───────────────────────────────────────────────────────────
      { path: 'simpanan/produk',              element: <S><ProdukSimpananListPage /></S> },
      { path: 'simpanan/produk/new',          element: <S><ProdukSimpananFormPage /></S> },
      { path: 'simpanan/produk/:id/edit',     element: <S><ProdukSimpananFormPage /></S> },
      { path: 'simpanan/rekening',            element: <S><RekeningListPage /></S> },
      { path: 'simpanan/rekening/new',        element: <S><RekeningFormPage /></S> },
      { path: 'simpanan/rekening/:id',        element: <S><RekeningDetailPage /></S> },
      { path: 'simpanan/rekening/:id/edit',   element: <S><RekeningFormPage /></S> },
      { path: 'simpanan/transaksi',           element: <S><TransaksiSimpananListPage /></S> },
      { path: 'simpanan/permohonan',          element: <S><PermohonanListPage /></S> },
      { path: 'simpanan/permohonan/:id',      element: <S><PermohonanDetailPage /></S> },

      // ── Pembiayaan ─────────────────────────────────────────────────────────
      { path: 'pembiayaan/produk',                element: <S><ProdukPembiayaanListPage /></S> },
      { path: 'pembiayaan/produk/new',            element: <S><ProdukPembiayaanFormPage /></S> },
      { path: 'pembiayaan/produk/:id/edit',       element: <S><ProdukPembiayaanFormPage /></S> },
      { path: 'pembiayaan/akad',                  element: <S><AkadListPage /></S> },
      { path: 'pembiayaan/akad/new',              element: <S><AkadFormPage /></S> },
      { path: 'pembiayaan/akad/:id',              element: <S><AkadDetailPage /></S> },
      { path: 'pembiayaan/akad/:id/edit',         element: <S><AkadFormPage /></S> },
      { path: 'pembiayaan/pembayaran',            element: <S><PembayaranAngsuranListPage /></S> },
      { path: 'pembiayaan/pembayaran/new',        element: <S><PembayaranAngsuranFormPage /></S> },
      { path: 'pembiayaan/pembayaran/:id/edit',   element: <S><PembayaranAngsuranFormPage /></S> },
      { path: 'pembiayaan/shu',                   element: <S><PembagianSHUListPage /></S> },
      { path: 'pembiayaan/shu/:id',               element: <S><PembagianSHUDetailPage /></S> },

      // ── Kartu ──────────────────────────────────────────────────────────────
      { path: 'kartu/daftar',           element: <S><KartuListPage /></S> },
      { path: 'kartu/daftar/:id',       element: <S><KartuDetailPage /></S> },
      { path: 'kartu/terminal',         element: <S><TerminalListPage /></S> },
      { path: 'kartu/terminal/new',     element: <S><TerminalFormPage /></S> },
      { path: 'kartu/terminal/:id/edit',element: <S><TerminalFormPage /></S> },
      { path: 'kartu/merchant',         element: <S><MerchantListPage /></S> },
      { path: 'kartu/merchant/new',     element: <S><MerchantFormPage /></S> },
      { path: 'kartu/merchant/:id/edit',element: <S><MerchantFormPage /></S> },

      // ── ZIS ────────────────────────────────────────────────────────────────
      { path: 'zis/penerimaan',               element: <S><PenerimaanZISListPage /></S> },
      { path: 'zis/penerimaan/new',           element: <S><PenerimaanZISFormPage /></S> },
      { path: 'zis/penerimaan/:id',           element: <S><PenerimaanZISDetailPage /></S> },
      { path: 'zis/penerimaan/:id/edit',      element: <S><PenerimaanZISFormPage /></S> },
      { path: 'zis/program',                  element: <S><ProgramPenyaluranListPage /></S> },
      { path: 'zis/program/new',              element: <S><ProgramPenyaluranFormPage /></S> },
      { path: 'zis/program/:id',              element: <S><ProgramPenyaluranDetailPage /></S> },
      { path: 'zis/program/:id/edit',         element: <S><ProgramPenyaluranFormPage /></S> },
      { path: 'zis/penyaluran',               element: <S><PenyaluranZISListPage /></S> },
      { path: 'zis/penyaluran/new',           element: <S><PenyaluranZISFormPage /></S> },
      { path: 'zis/penyaluran/:id/edit',      element: <S><PenyaluranZISFormPage /></S> },
      { path: 'zis/wakaf',                    element: <S><AsetWakafListPage /></S> },
      { path: 'zis/wakaf/new',                element: <S><AsetWakafFormPage /></S> },
      { path: 'zis/wakaf/:id/edit',           element: <S><AsetWakafFormPage /></S> },

      // ── Kas Teller ─────────────────────────────────────────────────────────
      { path: 'kas-teller/sesi',          element: <S><SesiKasTellerListPage /></S> },
      { path: 'kas-teller/sesi/new',      element: <S><SesiKasTellerFormPage /></S> },
      { path: 'kas-teller/sesi/:id',      element: <S><SesiKasTellerDetailPage /></S> },
      { path: 'kas-teller/sesi/:id/edit', element: <S><SesiKasTellerFormPage /></S> },

      // ── Laporan ────────────────────────────────────────────────────────────
      { path: 'laporan/export', element: <S><LaporanKoperasiPage /></S> },

      // ── Pengaturan ─────────────────────────────────────────────────────────
      { path: 'pengaturan/koperasi', element: <S><PengaturanKoperasiPage /></S> },
    ],
  },
]
```

- [ ] **Step 6.4: Run tests — verify they pass**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/app/routes.koperasi.test.tsx
```

Expected: PASS — 4 tests

- [ ] **Step 6.5: Commit**

```bash
git add src/app/routes.koperasi.tsx src/app/routes.koperasi.test.tsx
git commit -m "feat: add koperasi route stubs for all nav1 modules and subnav entities"
```

---

## Task 7: Update routes.tsx

**Files:**
- Modify: `src/app/routes.tsx`

- [ ] **Step 7.1: Write the failing test**

Create `src/app/routes.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'

// We can't easily instantiate the full router in unit tests, so we test the
// exported constant structure directly.
// The router is an opaque createBrowserRouter result — test the route arrays instead.

import { sekolahRoutes } from './routes.sekolah'
import { koperasiRoutes } from './routes.koperasi'

describe('routes composition', () => {
  it('sekolahRoutes is importable', () => {
    expect(sekolahRoutes).toBeDefined()
    expect(Array.isArray(sekolahRoutes)).toBe(true)
  })

  it('koperasiRoutes is importable', () => {
    expect(koperasiRoutes).toBeDefined()
    expect(Array.isArray(koperasiRoutes)).toBe(true)
  })

  it('combined routes cover /sekolah and /koperasi', () => {
    const combined = [...sekolahRoutes, ...koperasiRoutes]
    expect(combined.some((r) => r.path === '/sekolah')).toBe(true)
    expect(combined.some((r) => r.path === '/koperasi')).toBe(true)
  })
})
```

- [ ] **Step 7.2: Run test — verify it passes (imports compile)**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/app/routes.test.tsx
```

Expected: PASS — confirms both route files import correctly

- [ ] **Step 7.3: Modify routes.tsx — add choose-dashboard route and spread new route files**

Replace the entire file:

```tsx
import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { appConfig } from '@/config/app.config'
import {
  RootRedirect,
  AuthRoute,
  GuestRoute,
  SuperuserRoute,
  GroupRoute,
  CompanyRoute,
} from './ProtectedRoute'
import { sekolahRoutes } from './routes.sekolah'
import { koperasiRoutes } from './routes.koperasi'

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────

const LoginPage             = lazy(() => import('@/pages/Login/LoginPage'))
const DashboardPage         = lazy(() => import('@/pages/Dashboard/DashboardPage'))
const AdminDashboardPage    = lazy(() => import('@/pages/Admin/AdminDashboardPage'))
const ChooseCompanyPage     = lazy(() => import('@/pages/ChooseCompany/ChooseCompanyPage'))
const ChooseDashboardPage   = lazy(() => import('@/pages/ChooseDashboard/ChooseDashboardPage'))
const NotFoundPage          = lazy(() => import('@/pages/errors/NotFoundPage'))
const ForbiddenPage         = lazy(() => import('@/pages/errors/ForbiddenPage'))

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div />}>{children}</Suspense>
}

// ─── Single-tenant routes ─────────────────────────────────────────────────────
// Active when VITE_MULTI_TENANT=false (default)

const singleTenantRoutes = [
  {
    path: '/',
    element: <AuthRoute><AppShell /></AuthRoute>,
    children: [
      { path: 'dashboard', element: <S><DashboardPage /></S> },
      // Add your pages here:
      // { path: 'users',        element: <S><UsersListPage /></S> },
      // { path: 'users/:id',    element: <S><UserDetailPage /></S> },
      // { path: 'users/new',    element: <S><UserFormPage /></S> },
      // { path: 'settings',     element: <S><SettingsPage /></S> },
    ],
  },
]

// ─── Multi-tenant routes ──────────────────────────────────────────────────────
// Active when VITE_MULTI_TENANT=true

const multiTenantRoutes = [
  // Company/group selection page
  {
    path: '/choose-company',
    element: <AuthRoute><S><ChooseCompanyPage /></S></AuthRoute>,
  },

  // ── Superuser context: /su/* ─────────────────────────────────────────────────
  {
    path: '/su',
    element: <SuperuserRoute><AppShell context="superuser" /></SuperuserRoute>,
    children: [
      { path: 'dashboard', element: <S><AdminDashboardPage /></S> },
      // { path: 'tenants',   element: <S><TenantsListPage /></S> },
      // { path: 'companies', element: <S><CompaniesListPage /></S> },
    ],
  },

  // ── HQ / Group context: /g/* ─────────────────────────────────────────────────
  {
    path: '/g',
    element: <GroupRoute><AppShell context="hq" /></GroupRoute>,
    children: [
      { path: 'dashboard', element: <S><DashboardPage /></S> },
      // { path: 'reports',  element: <S><HQReportsPage /></S> },
    ],
  },

  // ── Company context: /c/:companyCode/* ───────────────────────────────────────
  {
    path: '/c/:companyCode',
    element: <CompanyRoute><AppShell context="company" /></CompanyRoute>,
    children: [
      { path: 'dashboard', element: <S><DashboardPage /></S> },
      // { path: 'users',     element: <S><UsersListPage /></S> },
      // { path: 'settings',  element: <S><SettingsPage /></S> },
    ],
  },
]

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Root — redirect based on auth state + tenant mode
  { path: '/', element: <RootRedirect /> },

  // Login (guest only)
  { path: '/login', element: <GuestRoute><S><LoginPage /></S></GuestRoute> },

  // Dashboard picker — authenticated users with access to both dashboards
  {
    path: '/choose-dashboard',
    element: <AuthRoute><S><ChooseDashboardPage /></S></AuthRoute>,
  },

  // Active route set based on tenant mode
  ...(appConfig.isMultiTenant ? multiTenantRoutes : singleTenantRoutes),

  // Sekolah dashboard — /sekolah/*
  ...sekolahRoutes,

  // Koperasi dashboard — /koperasi/*
  ...koperasiRoutes,

  // Error pages
  { path: '/403', element: <S><ForbiddenPage /></S> },
  { path: '*',    element: <S><NotFoundPage /></S> },
])
```

- [ ] **Step 7.4: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit
```

Expected: No errors. If you see errors about missing page imports, confirm routes.sekolah.tsx and routes.koperasi.tsx exist and export correctly.

- [ ] **Step 7.5: Run all route tests together**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/app/
```

Expected: All route tests pass (routes.sekolah, routes.koperasi, routes composition)

- [ ] **Step 7.6: Commit**

```bash
git add src/app/routes.tsx src/app/routes.test.tsx
git commit -m "feat: register /choose-dashboard and spread sekolah+koperasi routes into router"
```

---

## Task 8: Folder scaffold — types and services

**Files:**
- Create: `src/types/sekolah/index.ts`
- Create: `src/types/koperasi/index.ts`
- Create: `src/services/sekolah/index.ts`
- Create: `src/services/koperasi/index.ts`

These are barrel files. Entity-specific files (e.g. `siswa.types.ts`) are added in Phase 2+. The barrels exist now so later phases can import from `@/types/sekolah` without re-exporting setup.

- [ ] **Step 8.1: Write the failing test**

Create `src/types/sekolah/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('sekolah type barrel', () => {
  it('module resolves without errors', async () => {
    // Import the barrel — if it throws, the module is broken
    const mod = await import('./index')
    expect(mod).toBeDefined()
  })
})
```

Create `src/types/koperasi/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('koperasi type barrel', () => {
  it('module resolves without errors', async () => {
    const mod = await import('./index')
    expect(mod).toBeDefined()
  })
})
```

- [ ] **Step 8.2: Run tests — verify they fail**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/types/sekolah/index.test.ts src/types/koperasi/index.test.ts
```

Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 8.3: Create barrel files**

`src/types/sekolah/index.ts`:
```ts
// Sekolah domain types.
// Add entity type exports here as pages are built in Phase 2+.
// Example: export type { Siswa, SiswaListItem } from './siswa.types'
```

`src/types/koperasi/index.ts`:
```ts
// Koperasi domain types.
// Add entity type exports here as pages are built in Phase 6+.
// Example: export type { Nasabah, NasabahListItem } from './nasabah.types'
```

`src/services/sekolah/index.ts`:
```ts
// Sekolah entity services.
// Add service exports here as pages are built in Phase 2+.
// Example: export { siswaService } from './siswa.service'
```

`src/services/koperasi/index.ts`:
```ts
// Koperasi entity services.
// Add service exports here as pages are built in Phase 6+.
// Example: export { nasabahService } from './nasabah.service'
```

- [ ] **Step 8.4: Run tests — verify they pass**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run src/types/sekolah/index.test.ts src/types/koperasi/index.test.ts
```

Expected: PASS — 2 tests

- [ ] **Step 8.5: Commit**

```bash
git add src/types/sekolah/index.ts \
        src/types/sekolah/index.test.ts \
        src/types/koperasi/index.ts \
        src/types/koperasi/index.test.ts \
        src/services/sekolah/index.ts \
        src/services/koperasi/index.ts
git commit -m "feat: scaffold sekolah+koperasi type and service barrel folders"
```

---

## Task 9: Full test suite smoke run

Verify nothing broke across the entire project.

- [ ] **Step 9.1: Run full Vitest suite**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx vitest run
```

Expected: All existing tests still pass + all new tests from Tasks 1–8 pass. Zero failures.

- [ ] **Step 9.2: Verify TypeScript — full project**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 9.3: Dev server smoke test**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npm run dev
```

Open http://localhost:5173 in a browser:
- Navigate to `/choose-dashboard` → two cards (Sekolah, Koperasi) visible
- Click Sekolah → redirects to `/sekolah/dashboard`
- AppNavbar renders with Sekolah context (blue background)
- Navigate to `/sekolah/siswa` → AppSubNav renders with 5 items (Daftar Siswa, Pendaftaran Siswa, …)
- Navigate to `/sekolah/dashboard` → AppSubNav hidden
- Navigate to `/koperasi/anggota` → AppSubNav renders with 3 Anggota items

Kill dev server with Ctrl+C.

- [ ] **Step 9.4: Final commit if any cleanup was needed**

```bash
git add -p
git commit -m "chore: infra phase cleanup after smoke test"
```

---

## Self-Review Notes

**Spec coverage check:**

| Spec requirement | Covered by task |
|-----------------|-----------------|
| ChooseDashboardPage at `/choose-dashboard` | Task 1 |
| 2-card layout (Sekolah / Koperasi) | Task 1 |
| AppSubNav secondary nav bar | Task 3 |
| SUBNAV_CONFIG with all sekolah + koperasi items | Task 2 |
| AppShell wires AppSubNav | Task 4 |
| `/sekolah/*` route tree | Task 5 |
| `/koperasi/*` route tree | Task 6 |
| routes.tsx spread + /choose-dashboard entry | Task 7 |
| `src/types/sekolah/` + `src/types/koperasi/` folders | Task 8 |
| `src/services/sekolah/` + `src/services/koperasi/` folders | Task 8 |
| Route pattern: `/sekolah/siswa`, `/sekolah/siswa/new`, `/sekolah/siswa/:id`, `/sekolah/siswa/:id/edit` | Task 5 |
| All subnav item routes reachable under module paths | Tasks 5 + 6 |
| AuthRoute wraps both `/sekolah` and `/koperasi` | Tasks 5 + 6 |
| AppSubNav hidden on dashboard route | Task 3 (test 1), Task 4 (test 3) |
| Active subnav item matches pathname | Task 3 (test 4) |
| AppNavbar receives correct context ("sekolah" / "koperasi") | Tasks 5 + 6 via AppShell |

**Guru nav1 note:** The spec's Nav1 table for Sekolah omits `guru` as a separate column but section 3.2 defines it. AppNavbar already has `NAV_ITEMS_SEKOLAH` with `guru` key. routes.sekolah.tsx includes `/sekolah/guru/*` routes and SUBNAV_CONFIG.sekolah.guru is populated.

**Koperasi `/koperasi/anggota` redirect:** The subnav config for `anggota` starts with `/koperasi/anggota/nasabah` — there is no index route at bare `/koperasi/anggota`. Users who click the Anggota nav1 item are taken to the first subnav item (Nasabah) via AppNavbar's path `anggota` which resolves to `/koperasi/anggota`. Add an index redirect in a future task if required; out of scope for Phase 1.
