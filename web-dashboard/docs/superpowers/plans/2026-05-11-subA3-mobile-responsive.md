# Mobile Responsive Navbar (Sub-A3) Implementation Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Make AppNavbar usable on phones via a left slide-in drawer + bottom-sheet dropdowns + 44px touch targets, all gated by a `--bp-md: 768px` breakpoint.

**Architecture:** Same `AppNavbar.tsx` markup with CSS-driven responsive collapse. New `AppDrawer.tsx` reads filtered nav items from `useNavItems()` (A1) and reuses `PerspectiveSwitcher`. Drawer open state in `ui.store`. Bottom-sheet variants of notif/profile dropdowns via media query overrides.

**Tech:** React 18, TS, Zustand, CSS modules, lucide-react, Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-05-11-subA3-mobile-responsive-design.md`

---

## File Map

**Create:**
- `src/layouts/AppNavbar/AppDrawer.tsx`
- `src/layouts/AppNavbar/AppDrawer.module.css`
- `src/layouts/AppNavbar/AppDrawer.test.tsx`
- `src/__ui_tests__/AppNavbar.mobile.test.tsx`
- `src/__ui_tests__/ui.store.drawer.test.ts`

**Modify:**
- `src/theme/variables.css` — add `--bp-md`, `--z-drawer`, `--z-sheet`
- `src/stores/ui.store.ts` — add `drawerOpen`, `toggleDrawer`, `setDrawerOpen`
- `src/layouts/AppNavbar/AppNavbar.tsx` — render hamburger + `<AppDrawer />`
- `src/layouts/AppNavbar/AppNavbar.module.css` — `<md` hide rules + 44px targets + bottom-sheet variants for `.notifDropdown` and `.profileDropdown`
- `src/layouts/AppNavbar/PerspectiveSwitcher.module.css` — `<md` full-width variant when inside drawer

---

## Task 1: Add breakpoint + drawer z-index tokens

**Files:** `src/theme/variables.css`

- [ ] **Step 1: Append to `:root` block, after `--z-toast: 600;`**

```css
  /* === Responsive breakpoints === */
  --bp-md: 768px;

  /* === Drawer / sheet z-index === */
  --z-drawer: 350;
  --z-sheet: 350;
```

- [ ] **Step 2: Commit**

```bash
git add src/theme/variables.css
git commit -m "feat(theme): add --bp-md breakpoint and drawer/sheet z-index tokens"
```

---

## Task 2: Extend `ui.store` with drawerOpen

**Files:**
- Modify: `src/stores/ui.store.ts`
- Create: `src/__ui_tests__/ui.store.drawer.test.ts`

- [ ] **Step 1: Failing test**

```ts
// src/__ui_tests__/ui.store.drawer.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '@/stores/ui.store'

describe('ui.store drawer', () => {
  beforeEach(() => {
    useUiStore.setState({ drawerOpen: false })
  })

  it('drawerOpen defaults to false', () => {
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('setDrawerOpen toggles state', () => {
    useUiStore.getState().setDrawerOpen(true)
    expect(useUiStore.getState().drawerOpen).toBe(true)
    useUiStore.getState().setDrawerOpen(false)
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('toggleDrawer flips state', () => {
    expect(useUiStore.getState().drawerOpen).toBe(false)
    useUiStore.getState().toggleDrawer()
    expect(useUiStore.getState().drawerOpen).toBe(true)
    useUiStore.getState().toggleDrawer()
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('drawerOpen is NOT persisted', () => {
    useUiStore.getState().setDrawerOpen(true)
    const raw = localStorage.getItem('dashboard-ui')
    if (raw) {
      const parsed = JSON.parse(raw)
      expect(parsed.state.drawerOpen).toBeUndefined()
    }
  })
})
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npx vitest run src/__ui_tests__/ui.store.drawer.test.ts
```

- [ ] **Step 3: Modify `src/stores/ui.store.ts`**

Read the current file. Locate `UiState` interface and add `drawerOpen: boolean`. Add `toggleDrawer: () => void; setDrawerOpen: (open: boolean) => void;` to `UiActions`. Add defaults in the `create` body: `drawerOpen: false,`. Add action implementations:

```ts
toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
setDrawerOpen: (open: boolean) => set({ drawerOpen: open }),
```

Do NOT include `drawerOpen` in the `partialize` function (must stay out of localStorage).

- [ ] **Step 4: Run, expect PASS (4 tests)**

- [ ] **Step 5: Commit**

```bash
git add src/stores/ui.store.ts src/__ui_tests__/ui.store.drawer.test.ts
git commit -m "feat(drawer): add drawerOpen state + toggleDrawer/setDrawerOpen actions to ui.store"
```

---

## Task 3: `<AppDrawer />` component

**Files:**
- Create: `src/layouts/AppNavbar/AppDrawer.tsx`
- Create: `src/layouts/AppNavbar/AppDrawer.module.css`
- Create: `src/layouts/AppNavbar/AppDrawer.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/layouts/AppNavbar/AppDrawer.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AppDrawer } from './AppDrawer'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

function wrap({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/my-work']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function setUser(roles: string[]) {
  useAuthStore.setState({
    user: { id: '1', name: 'Andi', email: 'andi@vt.id', role: 'user', roles, permissions: [] },
    isAuthenticated: true,
  })
}

beforeEach(() => {
  useAuthStore.setState({ user: null })
  useUiStore.setState({ drawerOpen: true, perspective: 'saya' })
})

describe('AppDrawer', () => {
  it('renders nothing when drawerOpen is false', () => {
    useUiStore.setState({ drawerOpen: false })
    setUser(['VT Member'])
    const { container } = render(<AppDrawer />, { wrapper: wrap })
    expect(container.firstChild).toBeNull()
  })

  it('renders user info + nav items when open', () => {
    setUser(['VT Member', 'VT Leader'])
    render(<AppDrawer />, { wrapper: wrap })
    expect(screen.getByText('Andi')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('closes on Esc', () => {
    setUser(['VT Member'])
    render(<AppDrawer />, { wrapper: wrap })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('closes on backdrop click', () => {
    setUser(['VT Member'])
    render(<AppDrawer />, { wrapper: wrap })
    fireEvent.click(screen.getByTestId('drawer-backdrop'))
    expect(useUiStore.getState().drawerOpen).toBe(false)
  })

  it('shows logout button', () => {
    setUser(['VT Member'])
    render(<AppDrawer />, { wrapper: wrap })
    expect(screen.getByRole('button', { name: /keluar/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement `src/layouts/AppNavbar/AppDrawer.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { X, Settings, Shield, LogOut } from 'lucide-react'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useNavItems } from '@/hooks/usePerspective'
import { PerspectiveSwitcher } from './PerspectiveSwitcher'
import { getInitials } from '@/utils/format'
import { cn } from '@/utils/cn'
import styles from './AppDrawer.module.css'

export function AppDrawer() {
  const open = useUiStore((s) => s.drawerOpen)
  const setOpen = useUiStore((s) => s.setDrawerOpen)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navItems = useNavItems()
  const location = useLocation()
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  // Close on Esc
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  // Body scroll lock + focus trap
  useEffect(() => {
    if (!open) return
    lastFocused.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Move focus into the panel
    const first = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    first?.focus()

    return () => {
      document.body.style.overflow = prevOverflow
      lastFocused.current?.focus()
    }
  }, [open])

  // Close on route change
  const pathRef = useRef(location.pathname)
  useEffect(() => {
    if (open && location.pathname !== pathRef.current) {
      setOpen(false)
    }
    pathRef.current = location.pathname
  }, [open, location.pathname, setOpen])

  if (!open) return null

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <>
      <div
        className={styles.backdrop}
        data-testid="drawer-backdrop"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
      >
        <header className={styles.header}>
          <span className={styles.avatar}>{getInitials(user?.name ?? 'U')}</span>
          <div className={styles.headerText}>
            <p className={styles.userName}>{user?.name ?? 'Pengguna'}</p>
            <p className={styles.userEmail}>{user?.email}</p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <div className={styles.switcherWrap}>
          <PerspectiveSwitcher />
        </div>

        <nav className={styles.nav} aria-label="Navigasi utama">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === `/${item.path}` ||
              location.pathname.startsWith(`/${item.path}/`)
            return (
              <Link
                key={item.key}
                to={`/${item.path}`}
                className={cn(styles.navItem, active && styles.navItemActive)}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <hr className={styles.divider} />

        <div className={styles.footer}>
          <Link to="/profile" className={styles.footerItem} onClick={() => setOpen(false)}>
            <Settings size={16} /> Profil Saya
          </Link>
          <Link to="/change-password" className={styles.footerItem} onClick={() => setOpen(false)}>
            <Shield size={16} /> Ganti Password
          </Link>
          <button type="button" className={cn(styles.footerItem, styles.logout)} onClick={handleLogout}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 4: Create `AppDrawer.module.css`**

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(2px);
  z-index: var(--z-drawer);
  animation: drawer-fade-in 200ms var(--ease-default);
}

@keyframes drawer-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.panel {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 80vw;
  max-width: 320px;
  background: var(--color-surface-elevated);
  z-index: calc(var(--z-drawer) + 1);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  animation: drawer-slide-in 200ms var(--ease-spring);
  overflow-y: auto;
}

@keyframes drawer-slide-in {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: linear-gradient(135deg, var(--color-primary-subtle), transparent);
  border-bottom: 1px solid var(--color-border-subtle);
}

.avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-primary-text);
  font-weight: 600;
}

.headerText {
  flex: 1;
  min-width: 0;
}

.userName {
  margin: 0;
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--color-text);
}

.userEmail {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.closeBtn {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: transparent;
  border: 0;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.closeBtn:hover {
  background: var(--color-hover);
}

.switcherWrap {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
}

.nav {
  display: flex;
  flex-direction: column;
  padding: var(--space-2) 0;
  flex: 1;
}

.navItem {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  min-height: 44px;
  font-size: var(--font-base);
  color: var(--color-text);
  text-decoration: none;
  transition: background var(--duration-fast);
}

.navItem:hover {
  background: var(--color-hover);
  text-decoration: none;
}

.navItemActive {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-weight: 600;
}

.divider {
  margin: 0;
  border: 0;
  border-top: 1px solid var(--color-border-subtle);
}

.footer {
  display: flex;
  flex-direction: column;
  padding: var(--space-2) 0 var(--space-4);
}

.footerItem {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  min-height: 44px;
  font-size: var(--font-base);
  color: var(--color-text);
  text-decoration: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.footerItem:hover {
  background: var(--color-hover);
  text-decoration: none;
}

.logout {
  color: var(--color-danger);
}

@media (min-width: 768px) {
  .panel, .backdrop {
    display: none;
  }
}
```

- [ ] **Step 5: Run test, expect PASS (5 tests)**

```bash
npx vitest run src/layouts/AppNavbar/AppDrawer.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/layouts/AppNavbar/AppDrawer.tsx src/layouts/AppNavbar/AppDrawer.module.css src/layouts/AppNavbar/AppDrawer.test.tsx
git commit -m "feat(drawer): add AppDrawer with focus trap, body scroll lock, and route-change close"
```

---

## Task 4: Hamburger button + render drawer in AppNavbar

**Files:**
- Modify: `src/layouts/AppNavbar/AppNavbar.tsx`
- Modify: `src/layouts/AppNavbar/AppNavbar.module.css`

- [ ] **Step 1: Edit `AppNavbar.tsx`**

Add imports:
```ts
import { Menu } from 'lucide-react'
import { AppDrawer } from './AppDrawer'
```

Add state selectors near the top of the `AppNavbar` component:
```ts
const setDrawerOpen = useUiStore((s) => s.setDrawerOpen)
```

In JSX, inside the top-level `<nav>` element, BEFORE the `<Link className={styles.logo} ...>` block, insert:
```tsx
<button
  type="button"
  className={styles.hamburger}
  onClick={() => setDrawerOpen(true)}
  aria-label="Buka menu"
>
  <Menu size={22} />
</button>
```

After the closing `</nav>` (still inside the component return, sibling to the nav), insert:
```tsx
<AppDrawer />
```

Wrap both in a fragment if needed, e.g. `return (<><nav>...</nav><AppDrawer /></>)`.

- [ ] **Step 2: Edit `AppNavbar.module.css`**

Append to the file:

```css
/* === Mobile hamburger === */
.hamburger {
  display: none;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  flex-shrink: 0;
}

.hamburger:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* === Responsive: <md hides desktop nav + switcher === */
@media (max-width: 767.98px) {
  .hamburger {
    display: inline-flex;
  }

  .navList {
    display: none;
  }

  /* Hide desktop perspective switcher in navbar (it lives in drawer at <md). */
  .navbar > [role="tablist"] {
    display: none;
  }

  .iconBtn {
    min-width: 44px;
    min-height: 44px;
  }

  .notifDropdown,
  .profileDropdown {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    width: 100%;
    max-width: 100%;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    max-height: 70vh;
    overflow-y: auto;
    z-index: var(--z-sheet);
    animation: sheet-slide-up 200ms var(--ease-spring);
  }

  .notifDropdown::before,
  .profileDropdown::before {
    content: '';
    display: block;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--color-border);
    margin: 8px auto 4px;
  }

  .dropdownItem {
    min-height: 44px;
  }
}

@keyframes sheet-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

- [ ] **Step 3: Lint + type-check**

```bash
npx eslint src/layouts/AppNavbar/AppNavbar.tsx
npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep AppNavbar
```
Expected: clean / no NEW errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/AppNavbar/AppNavbar.tsx src/layouts/AppNavbar/AppNavbar.module.css
git commit -m "feat(mobile): add hamburger button + responsive collapse to AppNavbar"
```

---

## Task 5: Hamburger / mobile integration test

**Files:**
- Create: `src/__ui_tests__/AppNavbar.mobile.test.tsx`

- [ ] **Step 1: Write test**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AppNavbar } from '@/layouts/AppNavbar/AppNavbar'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

function wrap({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/my-work']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function setUser(roles: string[]) {
  useAuthStore.setState({
    user: { id: '1', name: 'A', email: 'a@a', role: 'user', roles, permissions: [] },
    isAuthenticated: true,
  })
}

beforeEach(() => {
  useAuthStore.setState({ user: null })
  useUiStore.setState({ drawerOpen: false, perspective: 'saya' })
})

describe('AppNavbar mobile', () => {
  it('hamburger renders in DOM (CSS hides at desktop, shows at mobile)', () => {
    setUser(['VT Member'])
    render(<AppNavbar />, { wrapper: wrap })
    expect(screen.getByLabelText('Buka menu')).toBeInTheDocument()
  })

  it('hamburger click opens drawer', () => {
    setUser(['VT Member'])
    render(<AppNavbar />, { wrapper: wrap })
    fireEvent.click(screen.getByLabelText('Buka menu'))
    expect(useUiStore.getState().drawerOpen).toBe(true)
  })

  it('drawer rendered in tree when opened via hamburger', () => {
    setUser(['VT Member'])
    render(<AppNavbar />, { wrapper: wrap })
    fireEvent.click(screen.getByLabelText('Buka menu'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run, expect PASS (3 tests)**

```bash
npx vitest run src/__ui_tests__/AppNavbar.mobile.test.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/__ui_tests__/AppNavbar.mobile.test.tsx
git commit -m "test(mobile): integration test for hamburger → drawer flow"
```

---

## Task 6: Final verify + push + PR

**Files:** none

- [ ] **Step 1: Full test suite**

```bash
npx vitest run
```
Expected: pass count ≥ post-A2 baseline (91p) + 12 new (4 store + 5 drawer + 3 mobile). Aim for ~103p / 11f.

- [ ] **Step 2: Lint touched files**

```bash
npx eslint src/layouts/AppNavbar src/stores/ui.store.ts src/theme/variables.css
```

- [ ] **Step 3: Push**

```bash
git push -u origin feat/mobile-responsive
```

- [ ] **Step 4: PR**

```bash
gh pr create --base feat/notification-deep-link --title "feat(mobile): responsive navbar drawer + bottom-sheets (Sub-A3)" --body "<filled body referencing spec, AC, stacking on PR #2>"
```
