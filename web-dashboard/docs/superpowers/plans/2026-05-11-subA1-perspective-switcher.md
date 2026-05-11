# Perspective Switcher (Sub-A1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Saya/Tim/Admin perspective switcher to the Vernon Tasks web dashboard, replacing the flat role-based nav with an explicit perspective concept, persisted in localStorage and validated against current roles on hydrate.

**Architecture:** Single source of truth is a declarative `NAV_REGISTRY` keyed by `{perspective, requiredRoles}`. Three hooks derive view state from `auth.store` + `ui.store`: `useAvailablePerspectives`, `useNavItems`, `useBootstrapPerspective`. A `<PerspectiveSwitcher />` segmented control renders in `AppNavbar` when the user has more than one perspective. A `<PerspectiveSync />` route-listener auto-aligns perspective when the URL belongs to a different one (unblocks Sub-A2 notifications later).

**Tech Stack:** React 18 + TypeScript, Zustand 5 (with persist middleware), React Router 6, TanStack React Query 5, Vitest + React Testing Library, lucide-react icons, CSS Modules. No Tailwind. Path alias `@/*` → `src/*`.

**Spec reference:** `docs/superpowers/specs/2026-05-11-subA1-perspective-switcher-design.md`

---

## File Map

**Create:**
- `src/layouts/AppNavbar/nav.registry.ts` — NAV_REGISTRY + pure filter `getNavItemsFor()`
- `src/layouts/AppNavbar/nav.registry.test.ts`
- `src/layouts/AppNavbar/PerspectiveSwitcher.tsx` — segmented control UI
- `src/layouts/AppNavbar/PerspectiveSwitcher.module.css`
- `src/layouts/AppNavbar/PerspectiveSwitcher.test.tsx`
- `src/layouts/AppNavbar/PerspectiveSync.tsx` — route → perspective auto-sync
- `src/layouts/AppNavbar/PerspectiveSync.test.tsx`
- `src/hooks/usePerspective.ts` — three hooks: `useAvailablePerspectives`, `useNavItems`, `useBootstrapPerspective`
- `src/hooks/usePerspective.test.tsx`
- `src/hooks/usePerspectiveBadges.ts` — `useSayaBadgeCount`, `useTimBadgeCount`
- `src/hooks/usePerspectiveBadges.test.tsx`
- `src/types/perspective.types.ts` — `Perspective` type + role constant sets

**Modify:**
- `src/stores/ui.store.ts` — add `perspective` state + `setPerspective` action + persist key
- `src/layouts/AppNavbar/AppNavbar.tsx` — remove inline NAV_ITEMS_* constants for VT, render switcher, consume `useNavItems`
- `src/layouts/AppShell/AppShell.tsx` — mount `<PerspectiveSync />` inside shell

**Untouched (but verified to still pass):**
- Existing tests in `src/__ui_tests__/AppShell.test.tsx`, `src/app/routes.test.tsx`

---

## Conventions

- **Test command:** `pnpm vitest run <file>` (or `npm run test -- <file>`). Project uses `vitest` script; check `package.json` if unsure. Adjust to `npx vitest run` if no package manager is configured.
- **Commit prefix:** `feat(perspective):` for new features, `test(perspective):` for tests-only, `refactor(perspective):` for refactors.
- **Branch:** `feat/perspective-switcher` (create at start, push at end).

---

## Task 0: Branch + dependencies check

**Files:** none

- [ ] **Step 1: Create branch**

```bash
cd /Users/erickmo/Desktop/Project/vernoncorp2/web-dashboard
git checkout -b feat/perspective-switcher
```

- [ ] **Step 2: Verify test runner works on a known-passing test**

Run:
```bash
npx vitest run src/__ui_tests__/AppShell.test.tsx
```
Expected: PASS. If it fails, fix environment before continuing.

- [ ] **Step 3: Confirm zustand persist is already in use**

Run:
```bash
grep -n "from 'zustand/middleware'" src/stores/ui.store.ts
```
Expected: line showing `import { persist } from 'zustand/middleware'`.

---

## Task 1: Define Perspective type + role constants

**Files:**
- Create: `src/types/perspective.types.ts`

- [ ] **Step 1: Write the type module**

```ts
// src/types/perspective.types.ts

export type Perspective = 'saya' | 'tim' | 'admin'

export const VT_LEADER_ROLES = ['VT Leader', 'VT Manager'] as const
export const VT_MANAGER_ROLES = ['VT Manager'] as const
export const ADMIN_ROLES = ['Administrator', 'System Manager'] as const

export const ALL_PERSPECTIVES: readonly Perspective[] = ['saya', 'tim', 'admin'] as const

/** Routes that anchor each perspective when the user switches via the toggle. */
export const DEFAULT_ROUTE_BY_PERSPECTIVE: Record<Perspective, string> = {
  saya: '/my-work',
  tim: '/leader-review',
  admin: '/audit-log',
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/perspective.types.ts
git commit -m "feat(perspective): add Perspective type and role constants"
```

---

## Task 2: Add `perspective` state to `ui.store`

**Files:**
- Modify: `src/stores/ui.store.ts`
- Test: `src/__ui_tests__/ui.store.perspective.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `src/__ui_tests__/ui.store.perspective.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '@/stores/ui.store'

describe('ui.store perspective', () => {
  beforeEach(() => {
    localStorage.clear()
    useUiStore.setState({ perspective: 'saya' })
  })

  it('defaults to "saya"', () => {
    expect(useUiStore.getState().perspective).toBe('saya')
  })

  it('setPerspective updates state synchronously', () => {
    useUiStore.getState().setPerspective('tim')
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('persists perspective under dashboard-ui key', () => {
    useUiStore.getState().setPerspective('admin')
    const raw = localStorage.getItem('dashboard-ui')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.perspective).toBe('admin')
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run src/__ui_tests__/ui.store.perspective.test.ts
```
Expected: FAIL — `perspective` and `setPerspective` undefined.

- [ ] **Step 3: Modify `src/stores/ui.store.ts`**

Replace the file with:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Perspective } from '@/types/perspective.types'

type Theme = 'light' | 'dark' | 'system'
type Density = 'compact' | 'comfortable' | 'spacious'

interface UiState {
  theme: Theme
  sidebarOpen: boolean
  density: Density
  perspective: Perspective
}

interface UiActions {
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setDensity: (density: Density) => void
  setPerspective: (perspective: Perspective) => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export const useUiStore = create<UiState & UiActions>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      density: 'comfortable',
      perspective: 'saya',

      setTheme: (theme: Theme) => {
        applyTheme(theme)
        set({ theme })
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      setDensity: (density: Density) => set({ density }),
      setPerspective: (perspective: Perspective) => set({ perspective }),
    }),
    {
      name: 'dashboard-ui',
      partialize: (state) => ({
        theme: state.theme,
        density: state.density,
        perspective: state.perspective,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npx vitest run src/__ui_tests__/ui.store.perspective.test.ts
```
Expected: PASS (all 3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/stores/ui.store.ts src/__ui_tests__/ui.store.perspective.test.ts
git commit -m "feat(perspective): add perspective state to ui.store with persistence"
```

---

## Task 3: NAV_REGISTRY + `getNavItemsFor()` pure filter

**Files:**
- Create: `src/layouts/AppNavbar/nav.registry.ts`
- Create: `src/layouts/AppNavbar/nav.registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/layouts/AppNavbar/nav.registry.test.ts
import { describe, it, expect } from 'vitest'
import { NAV_REGISTRY, getNavItemsFor, routeToPerspective } from './nav.registry'

describe('NAV_REGISTRY', () => {
  it('contains the five core VT items', () => {
    const keys = NAV_REGISTRY.map((i) => i.key)
    expect(keys).toEqual([
      'my-work',
      'my-dashboard',
      'leader-dashboard',
      'leader-review',
      'audit-log',
    ])
  })
})

describe('getNavItemsFor', () => {
  it('pure Member in saya perspective sees personal items only', () => {
    const items = getNavItemsFor('saya', ['VT Member'])
    expect(items.map((i) => i.key)).toEqual(['my-work', 'my-dashboard'])
  })

  it('Leader in tim perspective sees team items', () => {
    const items = getNavItemsFor('tim', ['VT Member', 'VT Leader'])
    expect(items.map((i) => i.key)).toEqual(['leader-dashboard', 'leader-review'])
  })

  it('Member in tim perspective sees nothing (no leader roles)', () => {
    const items = getNavItemsFor('tim', ['VT Member'])
    expect(items).toEqual([])
  })

  it('Manager in admin perspective sees audit-log', () => {
    const items = getNavItemsFor('admin', ['VT Manager'])
    expect(items.map((i) => i.key)).toEqual(['audit-log'])
  })

  it('Administrator in admin perspective sees audit-log', () => {
    const items = getNavItemsFor('admin', ['Administrator'])
    expect(items.map((i) => i.key)).toEqual(['audit-log'])
  })
})

describe('routeToPerspective', () => {
  it('maps /my-work to saya', () => {
    expect(routeToPerspective('/my-work')).toBe('saya')
  })

  it('maps /leader-review to tim', () => {
    expect(routeToPerspective('/leader-review')).toBe('tim')
  })

  it('maps /audit-log to admin', () => {
    expect(routeToPerspective('/audit-log')).toBe('admin')
  })

  it('returns null for unknown routes', () => {
    expect(routeToPerspective('/profile')).toBeNull()
  })

  it('matches sub-paths under a known item (e.g. /my-work/123)', () => {
    expect(routeToPerspective('/my-work/123')).toBe('saya')
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run src/layouts/AppNavbar/nav.registry.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `nav.registry.ts`**

```ts
// src/layouts/AppNavbar/nav.registry.ts
import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  BarChart2,
  LayoutDashboard,
  ClipboardCheck,
  ScrollText,
} from 'lucide-react'
import type { Perspective } from '@/types/perspective.types'

export interface NavItemDef {
  key: string
  label: string
  icon: LucideIcon
  /** Route path relative to root, no leading slash. */
  path: string
  perspective: Perspective
  /** Any-of role match. Omit = available to all users in that perspective. */
  requiredRoles?: readonly string[]
}

export const NAV_REGISTRY: readonly NavItemDef[] = [
  { key: 'my-work',          label: 'Kerja Saya',     icon: Briefcase,       path: 'my-work',          perspective: 'saya' },
  { key: 'my-dashboard',     label: 'Dashboard Saya', icon: BarChart2,       path: 'my-dashboard',     perspective: 'saya' },
  { key: 'leader-dashboard', label: 'Dashboard Tim',  icon: LayoutDashboard, path: 'leader-dashboard', perspective: 'tim',   requiredRoles: ['VT Leader', 'VT Manager'] },
  { key: 'leader-review',    label: 'Review Tugas',   icon: ClipboardCheck,  path: 'leader-review',    perspective: 'tim',   requiredRoles: ['VT Leader', 'VT Manager'] },
  { key: 'audit-log',        label: 'Audit Log',      icon: ScrollText,      path: 'audit-log',        perspective: 'admin', requiredRoles: ['VT Manager', 'Administrator', 'System Manager'] },
]

function hasAny(userRoles: readonly string[], required: readonly string[] | undefined): boolean {
  if (!required) return true
  return required.some((r) => userRoles.includes(r))
}

export function getNavItemsFor(
  perspective: Perspective,
  userRoles: readonly string[],
): NavItemDef[] {
  return NAV_REGISTRY.filter(
    (item) => item.perspective === perspective && hasAny(userRoles, item.requiredRoles),
  )
}

/**
 * Returns the perspective that owns a given route path, or null if the path
 * is not registered. Matches exact paths and sub-paths (e.g. /my-work/123).
 */
export function routeToPerspective(pathname: string): Perspective | null {
  const trimmed = pathname.startsWith('/') ? pathname.slice(1) : pathname
  for (const item of NAV_REGISTRY) {
    if (trimmed === item.path || trimmed.startsWith(`${item.path}/`)) {
      return item.perspective
    }
  }
  return null
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npx vitest run src/layouts/AppNavbar/nav.registry.test.ts
```
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/layouts/AppNavbar/nav.registry.ts src/layouts/AppNavbar/nav.registry.test.ts
git commit -m "feat(perspective): add declarative NAV_REGISTRY with pure filter and route-to-perspective lookup"
```

---

## Task 4: `useAvailablePerspectives` + `useNavItems` hooks

**Files:**
- Create: `src/hooks/usePerspective.ts`
- Create: `src/hooks/usePerspective.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/hooks/usePerspective.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAvailablePerspectives, useNavItems } from '@/hooks/usePerspective'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import type { UserProfile } from '@/types/auth.types'

function setUserRoles(roles: string[]) {
  const user: UserProfile = {
    id: '1', name: 'X', email: 'x@x', role: 'user', roles, permissions: [],
  }
  useAuthStore.setState({ user, isAuthenticated: true })
}

describe('useAvailablePerspectives', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it('returns ["saya"] for pure Member', () => {
    setUserRoles(['VT Member'])
    const { result } = renderHook(() => useAvailablePerspectives())
    expect(result.current).toEqual(['saya'])
  })

  it('returns ["saya","tim"] for Leader', () => {
    setUserRoles(['VT Member', 'VT Leader'])
    const { result } = renderHook(() => useAvailablePerspectives())
    expect(result.current).toEqual(['saya', 'tim'])
  })

  it('returns ["saya","tim","admin"] for Manager', () => {
    setUserRoles(['VT Member', 'VT Leader', 'VT Manager'])
    const { result } = renderHook(() => useAvailablePerspectives())
    expect(result.current).toEqual(['saya', 'tim', 'admin'])
  })

  it('returns ["admin"] for Administrator-only', () => {
    setUserRoles(['Administrator'])
    const { result } = renderHook(() => useAvailablePerspectives())
    expect(result.current).toEqual(['admin'])
  })

  it('returns ["saya"] for unauthenticated / no roles', () => {
    useAuthStore.setState({ user: null })
    const { result } = renderHook(() => useAvailablePerspectives())
    expect(result.current).toEqual(['saya'])
  })
})

describe('useNavItems', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null })
    useUiStore.setState({ perspective: 'saya' })
  })

  it('filters by current perspective', () => {
    setUserRoles(['VT Member', 'VT Leader'])
    useUiStore.setState({ perspective: 'tim' })
    const { result } = renderHook(() => useNavItems())
    expect(result.current.map((i) => i.key)).toEqual(['leader-dashboard', 'leader-review'])
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run src/hooks/usePerspective.test.tsx
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `usePerspective.ts`**

```ts
// src/hooks/usePerspective.ts
import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { getNavItemsFor, type NavItemDef } from '@/layouts/AppNavbar/nav.registry'
import type { Perspective } from '@/types/perspective.types'
import {
  VT_LEADER_ROLES,
  VT_MANAGER_ROLES,
  ADMIN_ROLES,
} from '@/types/perspective.types'

function hasAny(userRoles: readonly string[], roles: readonly string[]): boolean {
  return roles.some((r) => userRoles.includes(r))
}

export function useAvailablePerspectives(): Perspective[] {
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  return useMemo(() => {
    const result: Perspective[] = []
    // Saya is available to anyone who isn't admin-only (and as a safe default).
    const isAdminOnly =
      hasAny(roles, ADMIN_ROLES) &&
      !roles.includes('VT Member') &&
      !hasAny(roles, VT_LEADER_ROLES)
    if (!isAdminOnly) result.push('saya')
    if (hasAny(roles, VT_LEADER_ROLES)) result.push('tim')
    if (hasAny(roles, VT_MANAGER_ROLES) || hasAny(roles, ADMIN_ROLES)) result.push('admin')
    return result.length > 0 ? result : ['saya']
  }, [roles])
}

export function useNavItems(): NavItemDef[] {
  const perspective = useUiStore((s) => s.perspective)
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  return useMemo(() => getNavItemsFor(perspective, roles), [perspective, roles])
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npx vitest run src/hooks/usePerspective.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePerspective.ts src/hooks/usePerspective.test.tsx
git commit -m "feat(perspective): add useAvailablePerspectives and useNavItems hooks"
```

---

## Task 5: Bootstrap validator `useBootstrapPerspective`

**Files:**
- Modify: `src/hooks/usePerspective.ts` (append)
- Modify: `src/hooks/usePerspective.test.tsx` (append)

- [ ] **Step 1: Append failing test**

Add to `src/hooks/usePerspective.test.tsx`:

```tsx
import { useBootstrapPerspective } from '@/hooks/usePerspective'

describe('useBootstrapPerspective', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null })
    useUiStore.setState({ perspective: 'saya' })
  })

  it('keeps perspective when it is in available set', () => {
    setUserRoles(['VT Member', 'VT Leader'])
    useUiStore.setState({ perspective: 'tim' })
    renderHook(() => useBootstrapPerspective())
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('downgrades tim -> saya when role revoked', () => {
    setUserRoles(['VT Member'])
    useUiStore.setState({ perspective: 'tim' })
    renderHook(() => useBootstrapPerspective())
    expect(useUiStore.getState().perspective).toBe('saya')
  })

  it('downgrades admin -> tim when admin role revoked but Leader remains', () => {
    setUserRoles(['VT Member', 'VT Leader'])
    useUiStore.setState({ perspective: 'admin' })
    renderHook(() => useBootstrapPerspective())
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('falls back to saya for unauthenticated user with persisted tim', () => {
    useUiStore.setState({ perspective: 'tim' })
    useAuthStore.setState({ user: null })
    renderHook(() => useBootstrapPerspective())
    expect(useUiStore.getState().perspective).toBe('saya')
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run src/hooks/usePerspective.test.tsx
```
Expected: FAIL — `useBootstrapPerspective` not exported.

- [ ] **Step 3: Append to `usePerspective.ts`**

Add at the bottom of the file:

```ts
import { useEffect } from 'react'

/**
 * Validates the persisted `perspective` against the user's current roles.
 * If invalid, downgrades to the first available perspective.
 * Mount once near the top of the app (inside AppShell) — it has no UI.
 */
export function useBootstrapPerspective(): void {
  const available = useAvailablePerspectives()
  const perspective = useUiStore((s) => s.perspective)
  const setPerspective = useUiStore((s) => s.setPerspective)

  useEffect(() => {
    if (!available.includes(perspective)) {
      setPerspective(available[0])
    }
  }, [available, perspective, setPerspective])
}
```

Then update the imports at the top of the file to include `useEffect` in the existing react import (replace the `import { useMemo } from 'react'` line with `import { useEffect, useMemo } from 'react'` and remove the redundant import you just added at the bottom).

Final file should have ONE react import at the top: `import { useEffect, useMemo } from 'react'`.

- [ ] **Step 4: Run test, verify it passes**

```bash
npx vitest run src/hooks/usePerspective.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePerspective.ts src/hooks/usePerspective.test.tsx
git commit -m "feat(perspective): add useBootstrapPerspective with graceful downgrade"
```

---

## Task 6: Badge source hooks

**Files:**
- Create: `src/hooks/usePerspectiveBadges.ts`
- Create: `src/hooks/usePerspectiveBadges.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/hooks/usePerspectiveBadges.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSayaBadgeCount, useTimBadgeCount } from '@/hooks/usePerspectiveBadges'
import { useNotificationStore } from '@/stores/notification.store'
import { apiClient } from '@/services/api.client'

vi.mock('@/services/api.client', () => ({
  apiClient: { get: vi.fn() },
}))

function wrap({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useSayaBadgeCount', () => {
  beforeEach(() => {
    useNotificationStore.setState({ items: [], unreadCount: 0 })
  })

  it('returns unread notification count', () => {
    useNotificationStore.setState({
      items: [
        { id: '1', title: 'a', message: 'b', type: 'info', isRead: false, createdAt: '' },
        { id: '2', title: 'a', message: 'b', type: 'info', isRead: true, createdAt: '' },
      ],
      unreadCount: 1,
    })
    const { result } = renderHook(() => useSayaBadgeCount())
    expect(result.current).toBe(1)
  })

  it('returns 0 when no unread items', () => {
    const { result } = renderHook(() => useSayaBadgeCount())
    expect(result.current).toBe(0)
  })
})

describe('useTimBadgeCount', () => {
  it('returns review-queue length from API', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      message: { items: [{ id: 'T1' }, { id: 'T2' }, { id: 'T3' }] },
    } as never)
    const { result } = renderHook(() => useTimBadgeCount(), { wrapper: wrap })
    await waitFor(() => expect(result.current).toBe(3))
  })

  it('returns 0 silently when API errors', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useTimBadgeCount(), { wrapper: wrap })
    await waitFor(() => expect(result.current).toBe(0))
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run src/hooks/usePerspectiveBadges.test.tsx
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `usePerspectiveBadges.ts`**

```ts
// src/hooks/usePerspectiveBadges.ts
import { useQuery } from '@tanstack/react-query'
import { useNotificationStore } from '@/stores/notification.store'
import { apiClient } from '@/services/api.client'

const REVIEW_QUEUE_PATH =
  '/api/method/vernon_tasks.task.page.leader_review.leader_review.get_review_queue'

interface ReviewQueueResponse {
  message?: { items?: unknown[] } | unknown[]
}

export function useSayaBadgeCount(): number {
  return useNotificationStore((s) => s.unreadCount)
}

export function useTimBadgeCount(): number {
  const { data } = useQuery({
    queryKey: ['perspective-badge', 'tim'],
    queryFn: async () => {
      const res = await apiClient.get<ReviewQueueResponse>(REVIEW_QUEUE_PATH)
      const payload = (res as ReviewQueueResponse).message ?? res
      if (Array.isArray(payload)) return payload.length
      if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items)) {
        return (payload as { items: unknown[] }).items.length
      }
      return 0
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
    // Swallow errors silently — badge is a hint, not critical.
    throwOnError: false,
  })
  return typeof data === 'number' ? data : 0
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npx vitest run src/hooks/usePerspectiveBadges.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePerspectiveBadges.ts src/hooks/usePerspectiveBadges.test.tsx
git commit -m "feat(perspective): add badge source hooks for saya (unread notifs) and tim (CHECK queue)"
```

---

## Task 7: `<PerspectiveSwitcher />` component

**Files:**
- Create: `src/layouts/AppNavbar/PerspectiveSwitcher.tsx`
- Create: `src/layouts/AppNavbar/PerspectiveSwitcher.module.css`
- Create: `src/layouts/AppNavbar/PerspectiveSwitcher.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/layouts/AppNavbar/PerspectiveSwitcher.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PerspectiveSwitcher } from './PerspectiveSwitcher'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function wrap({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/my-work']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function setRoles(roles: string[]) {
  useAuthStore.setState({
    user: { id: '1', name: 'X', email: 'x@x', role: 'user', roles, permissions: [] },
    isAuthenticated: true,
  })
}

beforeEach(() => {
  navigateMock.mockReset()
  useUiStore.setState({ perspective: 'saya' })
  useAuthStore.setState({ user: null })
})

describe('PerspectiveSwitcher visibility', () => {
  it('renders nothing for pure Member (one available perspective)', () => {
    setRoles(['VT Member'])
    const { container } = render(<PerspectiveSwitcher />, { wrapper: wrap })
    expect(container.firstChild).toBeNull()
  })

  it('renders 2 buttons for Leader', () => {
    setRoles(['VT Member', 'VT Leader'])
    render(<PerspectiveSwitcher />, { wrapper: wrap })
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('renders 3 buttons for Manager', () => {
    setRoles(['VT Member', 'VT Leader', 'VT Manager'])
    render(<PerspectiveSwitcher />, { wrapper: wrap })
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })
})

describe('PerspectiveSwitcher behavior', () => {
  it('clicking Tim updates state and navigates to /leader-review', () => {
    setRoles(['VT Member', 'VT Leader'])
    render(<PerspectiveSwitcher />, { wrapper: wrap })
    fireEvent.click(screen.getByRole('tab', { name: /tim/i }))
    expect(useUiStore.getState().perspective).toBe('tim')
    expect(navigateMock).toHaveBeenCalledWith('/leader-review')
  })

  it('marks active perspective with aria-selected="true"', () => {
    setRoles(['VT Member', 'VT Leader'])
    useUiStore.setState({ perspective: 'tim' })
    render(<PerspectiveSwitcher />, { wrapper: wrap })
    const tim = screen.getByRole('tab', { name: /tim/i })
    expect(tim.getAttribute('aria-selected')).toBe('true')
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run src/layouts/AppNavbar/PerspectiveSwitcher.test.tsx
```
Expected: FAIL — component not found.

- [ ] **Step 3: Implement `PerspectiveSwitcher.tsx`**

```tsx
// src/layouts/AppNavbar/PerspectiveSwitcher.tsx
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Users, Shield } from 'lucide-react'
import { useAvailablePerspectives } from '@/hooks/usePerspective'
import { useUiStore } from '@/stores/ui.store'
import { useSayaBadgeCount, useTimBadgeCount } from '@/hooks/usePerspectiveBadges'
import {
  DEFAULT_ROUTE_BY_PERSPECTIVE,
  type Perspective,
} from '@/types/perspective.types'
import { routeToPerspective } from './nav.registry'
import { cn } from '@/utils/cn'
import styles from './PerspectiveSwitcher.module.css'

const PERSPECTIVE_META: Record<
  Perspective,
  { label: string; icon: typeof User }
> = {
  saya: { label: 'Saya', icon: User },
  tim: { label: 'Tim', icon: Users },
  admin: { label: 'Admin', icon: Shield },
}

function formatBadge(n: number): string | null {
  if (n <= 0) return null
  return n > 9 ? '9+' : String(n)
}

export function PerspectiveSwitcher() {
  const available = useAvailablePerspectives()
  const perspective = useUiStore((s) => s.perspective)
  const setPerspective = useUiStore((s) => s.setPerspective)
  const navigate = useNavigate()
  const location = useLocation()

  const sayaCount = useSayaBadgeCount()
  const timCount = useTimBadgeCount()
  const badgeBy: Record<Perspective, number> = {
    saya: sayaCount,
    tim: timCount,
    admin: 0,
  }

  if (available.length <= 1) return null

  function handleClick(target: Perspective) {
    if (target === perspective) return
    setPerspective(target)
    const routeOwner = routeToPerspective(location.pathname)
    if (routeOwner !== target) {
      navigate(DEFAULT_ROUTE_BY_PERSPECTIVE[target])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const dir = e.key === 'ArrowRight' ? 1 : -1
      const next = (idx + dir + available.length) % available.length
      handleClick(available[next])
    } else if (e.key === 'Home') {
      e.preventDefault()
      handleClick(available[0])
    } else if (e.key === 'End') {
      e.preventDefault()
      handleClick(available[available.length - 1])
    }
  }

  return (
    <div className={styles.root} role="tablist" aria-label="Mode tampilan">
      {available.map((p, idx) => {
        const meta = PERSPECTIVE_META[p]
        const Icon = meta.icon
        const active = p === perspective
        const badge = active ? null : formatBadge(badgeBy[p])
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={cn(styles.tab, active && styles.tabActive)}
            onClick={() => handleClick(p)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            <Icon size={14} />
            <span className={styles.label}>{meta.label}</span>
            {badge && <span className={styles.badge}>{badge}</span>}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Create the CSS module**

```css
/* src/layouts/AppNavbar/PerspectiveSwitcher.module.css */
.root {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: calc(var(--radius-md) - 2px);
  font-size: var(--font-sm);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.tab:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.tabActive {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  font-weight: 600;
}

.label {
  display: inline;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--radius-full);
  background: var(--color-danger);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
```

- [ ] **Step 5: Run test, verify it passes**

```bash
npx vitest run src/layouts/AppNavbar/PerspectiveSwitcher.test.tsx
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/AppNavbar/PerspectiveSwitcher.tsx src/layouts/AppNavbar/PerspectiveSwitcher.module.css src/layouts/AppNavbar/PerspectiveSwitcher.test.tsx
git commit -m "feat(perspective): add PerspectiveSwitcher segmented control with badge support"
```

---

## Task 8: `<PerspectiveSync />` route-listener

**Files:**
- Create: `src/layouts/AppNavbar/PerspectiveSync.tsx`
- Create: `src/layouts/AppNavbar/PerspectiveSync.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/layouts/AppNavbar/PerspectiveSync.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PerspectiveSync } from './PerspectiveSync'
import { useUiStore } from '@/stores/ui.store'

beforeEach(() => {
  useUiStore.setState({ perspective: 'saya' })
})

describe('PerspectiveSync', () => {
  it('flips perspective to tim when route is /leader-review', () => {
    render(
      <MemoryRouter initialEntries={['/leader-review']}>
        <PerspectiveSync />
      </MemoryRouter>,
    )
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('leaves perspective alone when route already matches', () => {
    useUiStore.setState({ perspective: 'tim' })
    render(
      <MemoryRouter initialEntries={['/leader-review']}>
        <PerspectiveSync />
      </MemoryRouter>,
    )
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('does nothing for unregistered routes (e.g. /profile)', () => {
    useUiStore.setState({ perspective: 'tim' })
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <PerspectiveSync />
      </MemoryRouter>,
    )
    expect(useUiStore.getState().perspective).toBe('tim')
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npx vitest run src/layouts/AppNavbar/PerspectiveSync.test.tsx
```
Expected: FAIL — component not found.

- [ ] **Step 3: Implement `PerspectiveSync.tsx`**

```tsx
// src/layouts/AppNavbar/PerspectiveSync.tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useUiStore } from '@/stores/ui.store'
import { routeToPerspective } from './nav.registry'

/**
 * Auto-aligns the active perspective to whatever the current route belongs to.
 * Mount once inside AppShell. Renders nothing.
 */
export function PerspectiveSync() {
  const location = useLocation()
  const perspective = useUiStore((s) => s.perspective)
  const setPerspective = useUiStore((s) => s.setPerspective)

  useEffect(() => {
    const owner = routeToPerspective(location.pathname)
    if (owner && owner !== perspective) {
      setPerspective(owner)
    }
  }, [location.pathname, perspective, setPerspective])

  return null
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npx vitest run src/layouts/AppNavbar/PerspectiveSync.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/AppNavbar/PerspectiveSync.tsx src/layouts/AppNavbar/PerspectiveSync.test.tsx
git commit -m "feat(perspective): add PerspectiveSync to auto-align perspective with current route"
```

---

## Task 9: Integrate into `AppNavbar`

**Files:**
- Modify: `src/layouts/AppNavbar/AppNavbar.tsx`

- [ ] **Step 1: Replace VT role-filter block with hook-driven nav**

Open `src/layouts/AppNavbar/AppNavbar.tsx`. Make these targeted edits:

1. **Replace imports block (lines 1-17)** — remove unused Vernon Tasks role-set constants and the inline NAV_ITEMS_* arrays. New imports section:

```tsx
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, ChevronDown, LogOut,
  CheckCircle, AlertCircle, AlertTriangle, Info,
  Building2, Shield, Globe, Settings, LayoutDashboard, Users,
  GraduationCap, Wallet, CreditCard, Heart, Receipt, BarChart3, BadgeCheck,
  Library, BookOpen,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { getInitials, formatRelative } from '@/utils/format'
import { appConfig } from '@/config/app.config'
import { cn } from '@/utils/cn'
import type { AppContext } from '@/layouts/AppShell/AppShell'
import { useNavItems } from '@/hooks/usePerspective'
import { PerspectiveSwitcher } from './PerspectiveSwitcher'
import styles from './AppNavbar.module.css'
```

2. **Delete lines 19-48** — the `VT_LEADER_ROLES`, `VT_MANAGER_ROLES`, `SUPERUSER_ROLES`, `NAV_ITEMS_VT_MEMBER`, `NAV_ITEMS_VT_LEADER_EXTRA`, `NAV_ITEMS_VT_MANAGER_EXTRA`, and `NAV_ITEMS_ADMIN` constants. The non-VT NAV_ITEMS (default/superuser/hq/company/sekolah/koperasi) and `NAV_ITEMS_BY_CONTEXT` / `BASE_PATH_BY_CONTEXT` stay — they belong to out-of-scope contexts and removing them is out of scope.

3. **Inside the `AppNavbar` component** — replace the block that builds `vtNavItems` (the `isVtContext / userRoles / isSuperuser / isVtLeader / isVtManager / vtNavItems` lines, plus the `navItems` definition that uses it) with:

```tsx
const isVtContext = context === 'default'
const vtNavItems = useNavItems()
const navItems = isVtContext ? vtNavItems : NAV_ITEMS_BY_CONTEXT[context]
```

4. **Render the switcher** — between the `<Link to=... className={styles.logo}>...</Link>` block and the `<ul className={styles.navList}>` block, insert:

```tsx
{isVtContext && <PerspectiveSwitcher />}
```

5. **Adjust nav item link `to=` for VT** — the existing `${basePath}/${item.path}` for VT (default context) produces `'/my-work'` because `basePath = ''`. Keep as-is. The VT registry `path` values are bare (e.g. `'my-work'`), which is consistent.

- [ ] **Step 2: Run the AppNavbar-relevant suite**

```bash
npx vitest run src/layouts/AppNavbar
```
Expected: PASS for both `PerspectiveSwitcher.test.tsx` and `PerspectiveSync.test.tsx`.

- [ ] **Step 3: Run full test suite to catch regressions**

```bash
npx vitest run
```
Expected: PASS. If `src/__ui_tests__/AppShell.test.tsx` or any nav-related test fails, read the failure and update assertions to match the new perspective-driven model. Do NOT loosen tests just to pass — verify the new model is correct, then update test expectations.

- [ ] **Step 4: Lint**

```bash
npm run lint
```
Expected: zero errors. Fix any unused-import warnings caused by the deletions in Step 1.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/AppNavbar/AppNavbar.tsx
git commit -m "refactor(perspective): consume nav registry + render PerspectiveSwitcher in AppNavbar"
```

---

## Task 10: Mount `PerspectiveSync` + `useBootstrapPerspective` in `AppShell`

**Files:**
- Modify: `src/layouts/AppShell/AppShell.tsx`

- [ ] **Step 1: Edit `AppShell.tsx`**

Replace the file with:

```tsx
import { Outlet } from 'react-router-dom'
import { AppNavbar } from '@/layouts/AppNavbar/AppNavbar'
import { AppSubNav } from '@/layouts/AppSubNav/AppSubNav'
import { PerspectiveSync } from '@/layouts/AppNavbar/PerspectiveSync'
import { useBootstrapPerspective } from '@/hooks/usePerspective'
import styles from './AppShell.module.css'

export type AppContext = 'default' | 'superuser' | 'hq' | 'company' | 'sekolah' | 'koperasi'

interface AppShellProps {
  /** Multi-tenant context — controls navbar colour, nav items, and subnav. */
  context?: AppContext
}

export function AppShell({ context = 'default' }: AppShellProps) {
  useBootstrapPerspective()

  return (
    <div className={styles.root}>
      <PerspectiveSync />
      <AppNavbar context={context} />
      <AppSubNav context={context} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Run AppShell test**

```bash
npx vitest run src/__ui_tests__/AppShell.test.tsx src/layouts/AppShell/AppShell.test.tsx
```
Expected: PASS. The existing AppShell test renders without router context for some assertions; if it now fails because `PerspectiveSync` requires `useLocation`, wrap the test render in a `<MemoryRouter>` and update the test accordingly. Treat that as a minor test update, not a design change.

- [ ] **Step 3: Run full suite**

```bash
npx vitest run
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/AppShell/AppShell.tsx src/__ui_tests__/AppShell.test.tsx src/layouts/AppShell/AppShell.test.tsx
git commit -m "feat(perspective): mount PerspectiveSync and bootstrap validator in AppShell"
```

(Only include the test files in the commit if they were edited in Step 2.)

---

## Task 11: Smoke test in the dev server

**Files:** none

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Log in as a Member-only user**

Open `http://localhost:5191`. Verify:
- No perspective switcher in the navbar.
- Nav shows only `Kerja Saya` and `Dashboard Saya`.

- [ ] **Step 3: Log in as a Leader (Member + Leader roles)**

Verify:
- Switcher renders with two buttons (Saya, Tim).
- Default landing reflects last-used perspective (or `tim` on first login if no persisted value).
- Clicking Tim → nav updates to team items → URL becomes `/leader-review`.
- Refresh page → perspective persists.
- Paste `/my-work` in URL while on Tim → page loads and switcher flips to Saya automatically.
- Tim button shows a count badge (review queue) when there are CHECK-phase tasks; Saya button shows a badge when there are unread notifications.

- [ ] **Step 4: Log in as a Manager**

Verify:
- Switcher renders with three buttons (Saya, Tim, Admin).
- Admin → nav shows `Audit Log`.

- [ ] **Step 5: Keyboard test**

- Tab into the switcher → focus lands on the active button.
- ArrowRight / ArrowLeft → focus AND selection move.
- Enter / Space on focused tab → no error, perspective stays.

- [ ] **Step 6: Stop the dev server (Ctrl-C)**

---

## Task 12: Lint, type-check, push, open PR

**Files:** none

- [ ] **Step 1: Type-check + lint clean**

```bash
npm run build
npm run lint
```
Expected: both succeed with zero errors.

- [ ] **Step 2: Full test pass**

```bash
npx vitest run
```
Expected: all green.

- [ ] **Step 3: Push branch**

```bash
git push -u origin feat/perspective-switcher
```

- [ ] **Step 4: Open PR**

Use `gh pr create` with title `feat(perspective): Saya/Tim/Admin perspective switcher (Sub-A1)`. Body should reference the spec at `docs/superpowers/specs/2026-05-11-subA1-perspective-switcher-design.md` and list the acceptance criteria checked off.

---

## Acceptance Criteria Mapping (from spec §8)

| AC | Task(s) |
|----|---------|
| 1. Pure Member sees zero switcher DOM | Task 7 (visibility test) + Task 11 step 2 |
| 2. Leader sees 2, Manager sees 3 | Task 7 + Task 11 steps 3, 4 |
| 3. Persists across reload | Task 2 (persist test) + Task 11 step 3 |
| 4. Bootstrap revalidation | Task 5 + Task 10 |
| 5. Switch to invalid route → default page | Task 7 (navigate test) + Task 11 step 3 |
| 6. Direct visit flips perspective | Task 8 + Task 11 step 3 |
| 7. Keyboard nav | Task 7 + Task 11 step 5 |
| 8. Existing tests still pass | Task 9 step 3 + Task 10 step 3 |
| 9. ARIA attributes | Task 7 |
| 10. Cross-perspective badge | Task 6 + Task 7 |
