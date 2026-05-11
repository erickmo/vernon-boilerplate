# Notification Deep-Link (Sub-A2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Make notification clicks navigate to relevant pages and switch perspective accordingly. Add a deletable frontend mapper for backend-not-yet-shipping-link case.

**Architecture:** Extend `NotificationItem` schema with `link`/`perspective`/`taskName`/`kind`. Pure `resolveNotificationTarget()` function in `notification.links.ts` maps notification → `{link, perspective}`. `AppNavbar` calls the resolver on click, applies `markRead → setPerspective (sync) → navigate → close`. `PerspectiveSync` (already shipped in A1) reconciles any mismatch.

**Tech Stack:** React 18 + TS, Zustand, React Router 6, Vitest + RTL.

**Spec reference:** `docs/superpowers/specs/2026-05-11-subA2-notification-deeplink-design.md`

---

## File Map

**Create:**
- `src/services/notification.links.ts` — pure `resolveNotificationTarget()` + `NotificationKind` type
- `src/services/notification.links.test.ts`
- `src/__ui_tests__/AppNavbar.notif-click.test.tsx` — notification click integration test
- `docs/tech-debt/notification-link-mapper.md` — deprecation TODO

**Modify:**
- `src/stores/notification.store.ts` — extend `NotificationItem` with `link`, `perspective`, `taskName`, `kind`
- `src/layouts/AppNavbar/AppNavbar.tsx` — wire `handleNotificationClick`

---

## Task 1: Extend NotificationItem schema

**Files:**
- Modify: `src/stores/notification.store.ts`

- [ ] **Step 1: Edit `src/stores/notification.store.ts`**

Replace the `NotificationItem` interface (and add the kind type) with:

```ts
import type { Perspective } from '@/types/perspective.types'

export type NotificationKind =
  | 'task-assigned'
  | 'task-review-requested'
  | 'task-approved'
  | 'task-rejected'
  | 'task-deadline-near'
  | 'system'
  | (string & {})

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  /** Legacy: free-form href. Prefer `link` for new code. */
  href?: string
  /** Preferred internal route (router path), e.g. '/leader-review?task=VT-123'. */
  link?: string
  /** Hint for which perspective the destination belongs to. */
  perspective?: Perspective
  /** Optional task identifier used by the frontend link mapper. */
  taskName?: string
  /** Semantic event type — used by the frontend mapper until backend pushes link. */
  kind?: NotificationKind
}
```

The rest of the file (state, actions, store creation) stays unchanged.

- [ ] **Step 2: Type-check**

```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: no NEW errors in `notification.store.ts`. Pre-existing errors elsewhere are out of scope.

- [ ] **Step 3: Commit**

```bash
git add src/stores/notification.store.ts
git commit -m "feat(notif): extend NotificationItem with link/perspective/taskName/kind"
```

---

## Task 2: `resolveNotificationTarget()` mapper

**Files:**
- Create: `src/services/notification.links.ts`
- Create: `src/services/notification.links.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/services/notification.links.test.ts
import { describe, it, expect } from 'vitest'
import { resolveNotificationTarget } from './notification.links'
import type { NotificationItem } from '@/stores/notification.store'

function n(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: '1',
    title: 't',
    message: 'm',
    type: 'info',
    isRead: false,
    createdAt: '',
    ...overrides,
  }
}

describe('resolveNotificationTarget', () => {
  it('returns link directly when item.link already set', () => {
    const result = resolveNotificationTarget(n({ link: '/custom?x=1', perspective: 'admin' }))
    expect(result).toEqual({ link: '/custom?x=1', perspective: 'admin' })
  })

  it('maps task-review-requested with taskName → /leader-review + tim', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-review-requested', taskName: 'VT-123' }))
    expect(result).toEqual({ link: '/leader-review?task=VT-123', perspective: 'tim' })
  })

  it('maps task-assigned with taskName → /my-work + saya', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-assigned', taskName: 'VT-9' }))
    expect(result).toEqual({ link: '/my-work?task=VT-9', perspective: 'saya' })
  })

  it('maps task-deadline-near → /my-work + saya', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-deadline-near', taskName: 'VT-1' }))
    expect(result).toEqual({ link: '/my-work?task=VT-1', perspective: 'saya' })
  })

  it('maps task-approved → /my-work + saya', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-approved', taskName: 'VT-2' }))
    expect(result).toEqual({ link: '/my-work?task=VT-2', perspective: 'saya' })
  })

  it('maps task-rejected → /my-work + saya', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-rejected', taskName: 'VT-3' }))
    expect(result).toEqual({ link: '/my-work?task=VT-3', perspective: 'saya' })
  })

  it('returns null for system kind', () => {
    const result = resolveNotificationTarget(n({ kind: 'system' }))
    expect(result).toBeNull()
  })

  it('returns null when kind needs taskName but missing', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-assigned' }))
    expect(result).toBeNull()
  })

  it('falls back to legacy href when no link/kind', () => {
    const result = resolveNotificationTarget(n({ href: '/legacy' }))
    expect(result).toEqual({ link: '/legacy', perspective: undefined })
  })

  it('returns null when no link, no href, no kind', () => {
    const result = resolveNotificationTarget(n({}))
    expect(result).toBeNull()
  })

  it('returns null for unknown kind', () => {
    const result = resolveNotificationTarget(n({ kind: 'mystery-event', taskName: 'X' }))
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npx vitest run src/services/notification.links.test.ts
```

- [ ] **Step 3: Implement `src/services/notification.links.ts`**

```ts
import type { NotificationItem } from '@/stores/notification.store'
import type { Perspective } from '@/types/perspective.types'

export interface NotificationTarget {
  link: string
  perspective: Perspective | undefined
}

const SAYA_KINDS = new Set([
  'task-assigned',
  'task-deadline-near',
  'task-approved',
  'task-rejected',
])

const TIM_KINDS = new Set(['task-review-requested'])

/**
 * Maps a notification to a route + perspective. Returns null when there is
 * no actionable destination (click should be a no-op navigation).
 *
 * TODO(notif-link-mapper-deprecation): once backend pushes `link` and
 * `perspective` on every actionable notification, the kind-based mapping
 * below becomes dead code. Delete this file when backend rollout is
 * complete. See docs/tech-debt/notification-link-mapper.md.
 */
export function resolveNotificationTarget(item: NotificationItem): NotificationTarget | null {
  if (item.link) {
    return { link: item.link, perspective: item.perspective }
  }

  if (item.kind && item.taskName) {
    if (TIM_KINDS.has(item.kind)) {
      return { link: `/leader-review?task=${item.taskName}`, perspective: 'tim' }
    }
    if (SAYA_KINDS.has(item.kind)) {
      return { link: `/my-work?task=${item.taskName}`, perspective: 'saya' }
    }
  }

  if (item.href) {
    return { link: item.href, perspective: undefined }
  }

  return null
}
```

- [ ] **Step 4: Run, expect PASS (11 tests)**

```bash
npx vitest run src/services/notification.links.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/services/notification.links.ts src/services/notification.links.test.ts
git commit -m "feat(notif): add resolveNotificationTarget mapper with full coverage"
```

---

## Task 3: Wire click handler in AppNavbar

**Files:**
- Modify: `src/layouts/AppNavbar/AppNavbar.tsx`

- [ ] **Step 1: Read current file**

Read `src/layouts/AppNavbar/AppNavbar.tsx` to confirm current notification click handler at the line containing `markRead(n.id); setShowNotif(false)` inside the `notifications.slice(0, 6).map((n) => ...)` block.

- [ ] **Step 2: Add imports**

Add to existing imports block:
```ts
import { useUiStore } from '@/stores/ui.store'
import { resolveNotificationTarget } from '@/services/notification.links'
import type { NotificationItem } from '@/stores/notification.store'
```

- [ ] **Step 3: Add `setPerspective` selector + handler inside component**

Near the top of `AppNavbar` component (after the existing `const { user, ... } = useAuthStore()` block), add:

```ts
const setPerspective = useUiStore((s) => s.setPerspective)
const currentPerspective = useUiStore((s) => s.perspective)

function handleNotificationClick(n: NotificationItem) {
  markRead(n.id)
  setShowNotif(false)
  const target = resolveNotificationTarget(n)
  if (!target) return
  if (target.perspective && target.perspective !== currentPerspective) {
    setPerspective(target.perspective)
  }
  navigate(target.link)
}
```

- [ ] **Step 4: Replace the inline onClick**

Find the line:
```tsx
onClick={() => { markRead(n.id); setShowNotif(false) }}
```

Replace with:
```tsx
onClick={() => handleNotificationClick(n)}
```

- [ ] **Step 5: Lint + type-check the file**

```bash
npx eslint src/layouts/AppNavbar/AppNavbar.tsx
npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep AppNavbar
```
Expected: 0 errors specific to `AppNavbar.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/AppNavbar/AppNavbar.tsx
git commit -m "feat(notif): wire notification click → markRead + setPerspective + navigate"
```

---

## Task 4: Click integration test

**Files:**
- Create: `src/__ui_tests__/AppNavbar.notif-click.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AppNavbar } from '@/layouts/AppNavbar/AppNavbar'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useNotificationStore } from '@/stores/notification.store'

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

function setUser(roles: string[]) {
  useAuthStore.setState({
    user: { id: '1', name: 'X', email: 'x@x', role: 'user', roles, permissions: [] },
    isAuthenticated: true,
  })
}

beforeEach(() => {
  navigateMock.mockReset()
  useAuthStore.setState({ user: null })
  useUiStore.setState({ perspective: 'saya' })
  useNotificationStore.setState({ items: [], unreadCount: 0 })
})

function seed(item: Partial<Parameters<typeof useNotificationStore.getState>[0] extends never ? never : unknown>) {
  // direct setState avoids decoupling from the store's `add` semantics
  useNotificationStore.setState({
    items: [{
      id: 'n1',
      title: 'T',
      message: 'M',
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
      ...(item as object),
    }],
    unreadCount: 1,
  })
}

describe('AppNavbar notification click', () => {
  it('review request: switches perspective to tim and navigates', () => {
    setUser(['VT Member', 'VT Leader'])
    seed({ kind: 'task-review-requested', taskName: 'VT-7' })
    render(<AppNavbar />, { wrapper: wrap })

    fireEvent.click(screen.getByLabelText('Notifikasi'))
    fireEvent.click(screen.getByRole('button', { name: /T M/i }))

    expect(useUiStore.getState().perspective).toBe('tim')
    expect(navigateMock).toHaveBeenCalledWith('/leader-review?task=VT-7')
    expect(useNotificationStore.getState().items[0].isRead).toBe(true)
  })

  it('task assigned: navigates to /my-work, perspective stays saya', () => {
    setUser(['VT Member'])
    seed({ kind: 'task-assigned', taskName: 'VT-1' })
    render(<AppNavbar />, { wrapper: wrap })

    fireEvent.click(screen.getByLabelText('Notifikasi'))
    fireEvent.click(screen.getByRole('button', { name: /T M/i }))

    expect(useUiStore.getState().perspective).toBe('saya')
    expect(navigateMock).toHaveBeenCalledWith('/my-work?task=VT-1')
  })

  it('system notification: markRead, no navigate', () => {
    setUser(['VT Member'])
    seed({ kind: 'system' })
    render(<AppNavbar />, { wrapper: wrap })

    fireEvent.click(screen.getByLabelText('Notifikasi'))
    fireEvent.click(screen.getByRole('button', { name: /T M/i }))

    expect(navigateMock).not.toHaveBeenCalled()
    expect(useNotificationStore.getState().items[0].isRead).toBe(true)
  })

  it('legacy href: navigates without perspective change', () => {
    setUser(['VT Member', 'VT Leader'])
    seed({ href: '/some/legacy/path' })
    useUiStore.setState({ perspective: 'tim' })
    render(<AppNavbar />, { wrapper: wrap })

    fireEvent.click(screen.getByLabelText('Notifikasi'))
    fireEvent.click(screen.getByRole('button', { name: /T M/i }))

    expect(navigateMock).toHaveBeenCalledWith('/some/legacy/path')
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('empty notification: no navigate', () => {
    setUser(['VT Member'])
    seed({})
    render(<AppNavbar />, { wrapper: wrap })

    fireEvent.click(screen.getByLabelText('Notifikasi'))
    fireEvent.click(screen.getByRole('button', { name: /T M/i }))

    expect(navigateMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run, expect PASS (5 tests)**

```bash
npx vitest run src/__ui_tests__/AppNavbar.notif-click.test.tsx
```

If a test fails because the notification button's accessible name doesn't match `/T M/i`, inspect the rendered output (`screen.debug()`) and adjust the query — the test should still cover the click flow, not the exact DOM structure.

- [ ] **Step 3: Commit**

```bash
git add src/__ui_tests__/AppNavbar.notif-click.test.tsx
git commit -m "test(notif): integration test for notification click → perspective + navigate"
```

---

## Task 5: Deprecation TODO doc

**Files:**
- Create: `docs/tech-debt/notification-link-mapper.md`

- [ ] **Step 1: Write the doc**

```markdown
# Tech debt: Frontend notification link mapper

**File:** `src/services/notification.links.ts`
**Created:** 2026-05-11
**Owner:** web-dashboard

## What

A frontend mapper that turns a `NotificationItem.kind` + `taskName` into a `{ link, perspective }` pair. Used by `AppNavbar` notification click to deep-link into the right page.

## Why it exists

The Frappe backend (`vernon_tasks`) does not yet push `link` and `perspective` on Notification docs. The mapper is a stopgap so the UI can be actionable today.

## Removal criteria

Delete `notification.links.ts` and its callers (replace the call site in `AppNavbar.tsx` with a direct read of `item.link` / `item.perspective`) when ALL of the following are true:

1. Backend emits `link` on every actionable VT notification.
2. Backend emits `perspective` hint (or the link routes through a perspective-aware page that PerspectiveSync can handle).
3. No production notification observed in the last 30 days that has `kind` set but `link` empty.

## Tracking

- Internal ticket: TBD (file in vernon_tasks repo when backend work is scheduled)
- Affected files when removed:
  - `src/services/notification.links.ts` (delete)
  - `src/services/notification.links.test.ts` (delete)
  - `src/layouts/AppNavbar/AppNavbar.tsx` (inline the resolution: `item.link` + `item.perspective`)
  - `src/stores/notification.store.ts` — keep `link` + `perspective` fields; drop `kind` and `taskName` once unused

## Why this matters

Frontend mapping creates schema coupling: every new notification kind requires both BE event and FE mapping. This violates the principle that the source-of-truth is the backend. The mapper is a known one-way technical debt and should not grow.
```

- [ ] **Step 2: Commit**

```bash
git add docs/tech-debt/notification-link-mapper.md
git commit -m "docs(notif): document deprecation path for frontend link mapper"
```

---

## Task 6: Full verification

**Files:** none

- [ ] **Step 1: Full test suite**

```bash
npx vitest run
```
Expected: pass count ≥ post-A1 baseline + 16 new tests (11 mapper + 5 click).

- [ ] **Step 2: Lint touched files**

```bash
npx eslint src/services/notification.links.ts src/layouts/AppNavbar/AppNavbar.tsx src/stores/notification.store.ts
```
Expected: 0 errors.

- [ ] **Step 3: Push branch + PR**

```bash
git push -u origin feat/notification-deep-link
gh pr create --title "feat(notif): notification deep-link with perspective switching (Sub-A2)" --body "<filled body>"
```

PR body should reference spec, list acceptance criteria, note dependency on PR #1 (Sub-A1) being merged first.
