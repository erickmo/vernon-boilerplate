# Empathy-Guided Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an empathy-first guided workspace dashboard for `web-dashboard`.

**Architecture:** Keep the change localized to the Dashboard page and its CSS Module. Add static data arrays and small local components in `DashboardPage.tsx`, then use CSS grid and existing design tokens for responsive layout. Add focused UI tests using the existing Vitest and Testing Library setup.

**Tech Stack:** React 18, Vite, TypeScript, CSS Modules, Vitest, Testing Library, lucide-react.

---

## File Structure

- Modify: `web-dashboard/src/pages/Dashboard/DashboardPage.tsx`
  - Replace placeholder stat/content layout with local guided-workspace components.
  - Use `useAuthStore` for the user's name.
  - Use static arrays for metrics, tasks, and activity.
- Modify: `web-dashboard/src/pages/Dashboard/DashboardPage.module.css`
  - Replace current metric/card styling with responsive guided dashboard styles.
- Create: `web-dashboard/src/__ui_tests__/DashboardPage.test.tsx`
  - Cover user greeting, next action, progress/readiness, task cards, and activity content.
- Modify: `web-dashboard/src/__ui_tests__/setup.ts`
  - Provide a deterministic `localStorage` shim for Zustand persist in UI tests.

---

### Task 1: Add Dashboard UI Test

**Files:**
- Create: `web-dashboard/src/__ui_tests__/DashboardPage.test.tsx`
- Modify: `web-dashboard/src/__ui_tests__/setup.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import { screen } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { render } from '@/__ui_tests__/test-utils'
import { useAuthStore } from '@/stores/auth.store'
import DashboardPage from '@/pages/Dashboard/DashboardPage'

describe('DashboardPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Maya Santoso',
        email: 'maya@example.com',
        role: 'admin',
        permissions: [],
      },
    })
  })

  it('renders an empathy-guided workspace for the current user', () => {
    render(<DashboardPage />)

    expect(screen.getByRole('heading', { name: /selamat datang, maya santoso/i })).toBeInTheDocument()
    expect(screen.getByText(/mulai dari hal yang paling membantu tim anda hari ini/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /prioritas yang perlu dibantu/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /review pending approvals/i })).toBeInTheDocument()
    expect(screen.getByText(/kesiapan workspace/i)).toBeInTheDocument()
    expect(screen.getByText(/6 dari 8 langkah sudah selesai/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /cara membantu tim/i })).toBeInTheDocument()
    expect(screen.getByText(/rapikan data produk/i)).toBeInTheDocument()
    expect(screen.getByText(/undang rekan kerja/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /aktivitas terbaru/i })).toBeInTheDocument()
    expect(screen.getByText(/audit perubahan kategori selesai direview/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- DashboardPage.test.tsx`

Expected: FAIL because the existing dashboard still renders placeholder metric cards and does not include the guided workspace content. If the test environment fails first because Zustand persist cannot write to `localStorage`, add the shared test setup shim before continuing.

- [ ] **Step 3: Commit**

Do not commit yet. This task intentionally leaves a failing test for Task 2.

---

### Task 2: Implement Guided Dashboard Component

**Files:**
- Modify: `web-dashboard/src/pages/Dashboard/DashboardPage.tsx`
- Test: `web-dashboard/src/__ui_tests__/DashboardPage.test.tsx`

- [ ] **Step 1: Replace dashboard component implementation**

Use this structure in `DashboardPage.tsx`:

```tsx
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { useAuthStore } from '@/stores/auth.store'
import styles from './DashboardPage.module.css'
```

Add local arrays:

```tsx
const metrics = [
  { label: 'Pengguna aktif', value: '84', helper: '12 orang kembali aktif minggu ini', tone: 'teal' },
  { label: 'Tugas terbantu', value: '320', helper: 'Mayoritas selesai tanpa eskalasi', tone: 'green' },
  { label: 'Perlu perhatian', value: '7', helper: 'Menunggu bantuan admin', tone: 'amber' },
]
```

Add local components for metric cards, task cards, progress, next action, and activity. Keep all data static and typed inside the file.

- [ ] **Step 2: Run focused test**

Run: `npm test -- DashboardPage.test.tsx`

Expected: PASS with the new content visible.

- [ ] **Step 3: Commit**

Do not commit until Task 3 styling and verification are complete.

---

### Task 3: Style Guided Dashboard

**Files:**
- Modify: `web-dashboard/src/pages/Dashboard/DashboardPage.module.css`
- Test: `web-dashboard/src/__ui_tests__/DashboardPage.test.tsx`

- [ ] **Step 1: Replace the Dashboard CSS Module**

Implement responsive CSS for:

- `.dashboard`
- `.hero`
- `.heroContent`
- `.heroEyebrow`
- `.heroText`
- `.heroActions`
- `.primaryButton`
- `.secondaryButton`
- `.metricGrid`
- `.metricCard`
- `.metricIcon`
- `.contentGrid`
- `.panel`
- `.nextAction`
- `.progressTrack`
- `.progressFill`
- `.taskGrid`
- `.taskCard`
- `.activityList`
- `.activityItem`

Use existing tokens and keep cards at `var(--radius-md)` or `8px` where practical.

- [ ] **Step 2: Run focused test**

Run: `npm test -- DashboardPage.test.tsx`

Expected: PASS.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test -- DashboardPage.test.tsx
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit**

Run:

```bash
git add web-dashboard/src/pages/Dashboard/DashboardPage.tsx web-dashboard/src/pages/Dashboard/DashboardPage.module.css web-dashboard/src/__ui_tests__/DashboardPage.test.tsx web-dashboard/src/__ui_tests__/setup.ts docs/superpowers/plans/2026-05-04-empathy-guided-dashboard.md
git commit -m "feat(web-dashboard): add empathy-guided dashboard"
```

Expected: commit succeeds.
