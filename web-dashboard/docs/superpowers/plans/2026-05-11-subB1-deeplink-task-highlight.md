# Deep-Link Task Highlight (Sub-B1) Implementation Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** When a notification deep-link sends user to `/my-work?task=<id>` or `/leader-review?task=<id>`, scroll to + outline-pulse-highlight that row for 3s. Show toast when task is missing.

**Architecture:** Pure `useDeepLinkTaskHighlight(opts)` hook reads `useSearchParams`, manages timeout, exposes `highlightedTask + registerRef`. CSS-only pulse via `[data-deeplink-highlight="true"]` attribute. Two-page integration.

**Spec:** `docs/superpowers/specs/2026-05-11-subB1-deeplink-task-highlight-design.md`

---

## File Map

**Create:**
- `src/hooks/useDeepLinkTaskHighlight.ts`
- `src/hooks/useDeepLinkTaskHighlight.test.tsx`
- `src/theme/deeplink-highlight.css` — pulse animation + attribute selector

**Modify:**
- `src/main.tsx` — import the new CSS once
- `src/pages/MyWork/MyWorkPage.tsx` — wire hook + pass refs to rows
- `src/pages/LeaderReview/LeaderReviewPage.tsx` — wire hook + pass refs

---

## Task 1: CSS animation

**Files:**
- Create: `src/theme/deeplink-highlight.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create `src/theme/deeplink-highlight.css`**

```css
@keyframes deep-link-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5); }
  40%  { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.15); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}

[data-deeplink-highlight="true"] {
  animation: deep-link-pulse 1.2s var(--ease-default) 2;
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-md);
  transition: outline 200ms var(--ease-default);
}
```

- [ ] **Step 2: Import in main.tsx**

Read `src/main.tsx`. After the existing theme/reset imports, add:
```ts
import '@/theme/deeplink-highlight.css'
```

- [ ] **Step 3: Commit**

```bash
git add src/theme/deeplink-highlight.css src/main.tsx
git commit -m "feat(deeplink): add CSS pulse animation for highlighted task rows"
```

---

## Task 2: `useDeepLinkTaskHighlight` hook

**Files:**
- Create: `src/hooks/useDeepLinkTaskHighlight.ts`
- Create: `src/hooks/useDeepLinkTaskHighlight.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/hooks/useDeepLinkTaskHighlight.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useSearchParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useDeepLinkTaskHighlight } from './useDeepLinkTaskHighlight'

function wrap(initial: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDeepLinkTaskHighlight', () => {
  it('returns null when no task param', () => {
    const { result } = renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['A', 'B'] }),
      { wrapper: wrap('/my-work') },
    )
    expect(result.current.highlightedTask).toBeNull()
  })

  it('returns task name when present and in available list', () => {
    const { result } = renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['VT-1', 'VT-2'] }),
      { wrapper: wrap('/my-work?task=VT-1') },
    )
    expect(result.current.highlightedTask).toBe('VT-1')
  })

  it('clears highlight after 3000ms', () => {
    const { result } = renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['VT-1'] }),
      { wrapper: wrap('/my-work?task=VT-1') },
    )
    expect(result.current.highlightedTask).toBe('VT-1')
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.highlightedTask).toBeNull()
  })

  it('calls onMissing when task not in available list', () => {
    const onMissing = vi.fn()
    renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['VT-1'], onMissing }),
      { wrapper: wrap('/my-work?task=VT-999') },
    )
    expect(onMissing).toHaveBeenCalledWith('VT-999')
  })

  it('does not call onMissing when availableTaskNames empty (still loading)', () => {
    const onMissing = vi.fn()
    renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: [], onMissing }),
      { wrapper: wrap('/my-work?task=VT-1') },
    )
    expect(onMissing).not.toHaveBeenCalled()
  })

  it('registerRef returns a ref callback that scrolls when matched', () => {
    const scrollMock = vi.fn()
    const { result } = renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['VT-1'] }),
      { wrapper: wrap('/my-work?task=VT-1') },
    )
    const fakeEl = { scrollIntoView: scrollMock } as unknown as HTMLElement
    act(() => {
      result.current.registerRef('VT-1')(fakeEl)
    })
    expect(scrollMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })

  it('registerRef does not scroll non-matching task', () => {
    const scrollMock = vi.fn()
    const { result } = renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['VT-1', 'VT-2'] }),
      { wrapper: wrap('/my-work?task=VT-1') },
    )
    const fakeEl = { scrollIntoView: scrollMock } as unknown as HTMLElement
    act(() => {
      result.current.registerRef('VT-2')(fakeEl)
    })
    expect(scrollMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement `src/hooks/useDeepLinkTaskHighlight.ts`**

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const HIGHLIGHT_DURATION_MS = 3000

export interface UseDeepLinkTaskHighlightOptions {
  availableTaskNames: readonly string[]
  onMissing?: (taskName: string) => void
}

export interface UseDeepLinkTaskHighlightResult {
  highlightedTask: string | null
  registerRef: (name: string) => (el: HTMLElement | null) => void
}

export function useDeepLinkTaskHighlight({
  availableTaskNames,
  onMissing,
}: UseDeepLinkTaskHighlightOptions): UseDeepLinkTaskHighlightResult {
  const [searchParams] = useSearchParams()
  const requestedTask = searchParams.get('task')
  const [highlightedTask, setHighlightedTask] = useState<string | null>(null)
  const missingFiredFor = useRef<string | null>(null)
  const scrolledFor = useRef<string | null>(null)

  // Resolve highlight state from URL + available list.
  useEffect(() => {
    if (!requestedTask) {
      setHighlightedTask(null)
      return
    }
    if (availableTaskNames.length === 0) {
      // Still loading — wait.
      return
    }
    if (availableTaskNames.includes(requestedTask)) {
      setHighlightedTask(requestedTask)
      missingFiredFor.current = null
      const timer = window.setTimeout(() => {
        setHighlightedTask(null)
      }, HIGHLIGHT_DURATION_MS)
      return () => window.clearTimeout(timer)
    } else {
      if (missingFiredFor.current !== requestedTask) {
        missingFiredFor.current = requestedTask
        onMissing?.(requestedTask)
      }
      setHighlightedTask(null)
    }
  }, [requestedTask, availableTaskNames, onMissing])

  const registerRef = useCallback(
    (name: string) =>
      (el: HTMLElement | null) => {
        if (!el) return
        if (name !== requestedTask) return
        if (scrolledFor.current === name) return
        scrolledFor.current = name
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      },
    [requestedTask],
  )

  return useMemo(
    () => ({ highlightedTask, registerRef }),
    [highlightedTask, registerRef],
  )
}
```

- [ ] **Step 4: Run, expect PASS (7 tests)**

```bash
npx vitest run src/hooks/useDeepLinkTaskHighlight.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDeepLinkTaskHighlight.ts src/hooks/useDeepLinkTaskHighlight.test.tsx
git commit -m "feat(deeplink): add useDeepLinkTaskHighlight hook with auto-clear and scroll-into-view"
```

---

## Task 3: Wire MyWorkPage

**Files:**
- Modify: `src/pages/MyWork/MyWorkPage.tsx`

- [ ] **Step 1: Read current MyWorkPage**

Locate the queries (`todayTasks`, `recommended`, `blocked`) and the row components (`FocusCard`, `TaskRow`, blocked rendering).

- [ ] **Step 2: Edit imports**

Add:
```ts
import { useMemo } from 'react'  // already imported? merge with existing useState if so
import { useDeepLinkTaskHighlight } from '@/hooks/useDeepLinkTaskHighlight'
```

- [ ] **Step 3: Add hook usage inside `MyWorkPage`**

After the three `useQuery` blocks and before the mutations:

```ts
const availableTaskNames = useMemo(
  () => [
    ...recommended.map((t) => t.name),
    ...todayTasks.map((t) => t.name),
    ...blocked.map((t) => t.name),
  ],
  [recommended, todayTasks, blocked],
)

const { highlightedTask, registerRef } = useDeepLinkTaskHighlight({
  availableTaskNames,
  onMissing: (name) => toast.warning(`Tugas ${name} tidak ada di daftar saat ini`),
})
```

- [ ] **Step 4: Pass to sub-components**

Update `FocusCard`, `TaskRow`, `TodaySection`, `BlockedSection` interfaces to accept `highlightedTask: string | null` and `registerRef: (name: string) => (el: HTMLElement | null) => void`. Pass through.

In each row component's JSX root element, add:
```tsx
ref={registerRef(task.name)}
data-deeplink-highlight={String(highlightedTask === task.name)}
```

Specifically:
- `FocusCard`: add to the outer `<div className={styles.focusCard}>` element.
- `TaskRow`: add to the `<article className={styles.taskCard}>` element.
- `BlockedSection`'s blocked `<article>`: add to the blocked card element.

Don't forget to pass `highlightedTask` and `registerRef` down from `MyWorkPage` to each component.

- [ ] **Step 5: Verify toast import**

If `toast` is not imported, add `import { toast } from '@/widgets/Toast/Toast'`. (Already imported in MyWorkPage based on existing code — confirm and reuse.)

If `toast.warning` doesn't exist as a method, use `toast.info` or `toast.error` based on what the project exports. Inspect `src/widgets/Toast/Toast.ts` to confirm the API surface before committing.

- [ ] **Step 6: Lint + type-check**

```bash
npx eslint src/pages/MyWork/MyWorkPage.tsx
npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep MyWorkPage
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/MyWork/MyWorkPage.tsx
git commit -m "feat(deeplink): wire useDeepLinkTaskHighlight into MyWorkPage"
```

---

## Task 4: Wire LeaderReviewPage

**Files:**
- Modify: `src/pages/LeaderReview/LeaderReviewPage.tsx`

- [ ] **Step 1: Read current LeaderReviewPage**

Identify the queue list — the `QueueList` component with `queue: ReviewTask[]`. Each item is a `.queueItem` row.

- [ ] **Step 2: Add imports**

```ts
import { useMemo } from 'react'  // merge with existing
import { useDeepLinkTaskHighlight } from '@/hooks/useDeepLinkTaskHighlight'
```

- [ ] **Step 3: Inside `LeaderReviewPage` component**

After `useQuery` for `queue`:

```ts
const availableTaskNames = useMemo(() => queue.map((t) => t.name), [queue])
const { highlightedTask, registerRef } = useDeepLinkTaskHighlight({
  availableTaskNames,
  onMissing: (name) => toast.warning(`Tugas ${name} tidak ada di antrian saat ini`),
})
```

Pass `highlightedTask` and `registerRef` into the `QueueList` component as props.

- [ ] **Step 4: In `QueueList`**

Extend its props interface:
```ts
interface QueueListProps {
  queue: ReviewTask[]
  isLoading: boolean
  selectedTask: ReviewTask | null
  onSelect: (task: ReviewTask) => void
  highlightedTask: string | null
  registerRef: (name: string) => (el: HTMLElement | null) => void
}
```

On each `queueItem` element (the per-task row), add:
```tsx
ref={registerRef(task.name)}
data-deeplink-highlight={String(highlightedTask === task.name)}
```

- [ ] **Step 5: Lint + type-check**

```bash
npx eslint src/pages/LeaderReview/LeaderReviewPage.tsx
npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep LeaderReviewPage
```

If `toast.warning` does not exist, fall back to whichever toast level the project supports (likely `toast.info`).

- [ ] **Step 6: Commit**

```bash
git add src/pages/LeaderReview/LeaderReviewPage.tsx
git commit -m "feat(deeplink): wire useDeepLinkTaskHighlight into LeaderReviewPage queue"
```

---

## Task 5: Verify + push + PR

**Files:** none

- [ ] **Step 1: Full test suite**

```bash
npx vitest run
```
Expected: 110p (≈) / 11f / 121 total. +7 new tests, 0 regression vs Sub-A3 baseline (103p/11f).

- [ ] **Step 2: Push**

```bash
git push -u origin feat/member-workflow
```

- [ ] **Step 3: PR**

```bash
gh pr create --base feat/mobile-responsive --title "feat(deeplink): task row highlight on ?task= deep-link (Sub-B1)" --body "<filled body referencing spec, AC, stacking>"
```
