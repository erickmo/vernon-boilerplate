# Sub-B1 — Deep-Link Task Highlight

**Date:** 2026-05-11
**Status:** Design — auto-approved
**Parent:** Sub-B Member workflow restructure
**Sibling:** Sub-A2 (notif deep-link, shipped #2) produces these URLs

---

## 1. Context

Sub-A2 ships notification clicks that navigate to `/my-work?task=VT-123` (Saya) or `/leader-review?task=VT-123` (Tim). Currently the landing page ignores the `task=` query param — user arrives, must scroll/search manually. The notification's promise is broken at the last yard.

## 2. Problem

Member receives "task assigned" notification → clicks → lands on `/my-work` → cannot find the task. The whole deep-link investment from A2 buys nothing.

## 3. Goals

- On `/my-work?task=<name>`: scroll the task row into view + visually highlight it for 3 seconds.
- Same behavior on `/leader-review?task=<name>` (Leader Review page).
- If the task is not in the current list, show a transient banner ("Tugas VT-123 tidak ada di daftar saat ini").
- Reusable hook so future pages can adopt without copy-paste.

## 4. Non-Goals

- Task detail modal (separate future spec).
- Auto-opening task to start/submit (only highlight).
- Cross-tab sync.
- Animation library (use CSS only).

## 5. Design

### 5.1 Hook `useDeepLinkTaskHighlight()`

New file: `src/hooks/useDeepLinkTaskHighlight.ts`

Signature:
```ts
interface UseDeepLinkTaskHighlightOptions {
  /** List of task identifiers currently rendered on the page. */
  availableTaskNames: readonly string[]
  /** Called when the highlighted task is not in availableTaskNames. */
  onMissing?: (taskName: string) => void
}

interface UseDeepLinkTaskHighlightResult {
  /** Task name being highlighted (or null). */
  highlightedTask: string | null
  /** Stable ref callback to attach to the row DOM node. */
  registerRef: (name: string) => (el: HTMLElement | null) => void
}

function useDeepLinkTaskHighlight(opts: UseDeepLinkTaskHighlightOptions): UseDeepLinkTaskHighlightResult
```

Behavior:
1. Reads `task` query param via `useSearchParams()`.
2. If `task` set AND `availableTaskNames.includes(task)`:
   - Sets `highlightedTask = task`.
   - On the first render where the ref is attached, scrolls the element into view (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).
   - After 3000ms, sets `highlightedTask = null` (highlight fades).
3. If `task` set but NOT in available list: call `onMissing(task)` once; `highlightedTask` stays null.
4. Removing `task=` from URL or task name changing resets state.

### 5.2 CSS treatment

Add a global class (or style hook) `[data-highlighted="true"]` to the row element. Style via CSS module or inline. Definition (add to `src/theme/motion.css` or a shared utility CSS):

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
}
```

Attribute approach avoids touching every page's CSS module.

### 5.3 Integration in MyWork

Edit `src/pages/MyWork/MyWorkPage.tsx`:

```tsx
const availableTaskNames = useMemo(() => {
  return [
    ...(recommended.map((t) => t.name) ?? []),
    ...todayTasks.map((t) => t.name),
    ...blocked.map((t) => t.name),
  ]
}, [todayTasks, recommended, blocked])

const { highlightedTask, registerRef } = useDeepLinkTaskHighlight({
  availableTaskNames,
  onMissing: (name) => toast.warning(`Tugas ${name} tidak ada di daftar saat ini`),
})
```

Pass `highlightedTask` + `registerRef` down to `FocusCard`, `TaskRow`, `BlockedCard` (or rather: pass to `TodaySection` + the focus section + blocked rendering). Each row attaches `ref={registerRef(task.name)}` and adds `data-deeplink-highlight={String(highlightedTask === task.name)}` on its root element.

### 5.4 Integration in LeaderReview

Same pattern. The LeaderReview page is not yet using this hook; integration is identical: compute `availableTaskNames` from the review queue, attach `registerRef` + `data-deeplink-highlight` to each row.

LeaderReview integration is included in this spec for parity with the A2 link targets.

## 6. Testing

- `useDeepLinkTaskHighlight.test.tsx`: 
  - Returns null when no `task` param
  - Returns task when present and in available
  - Calls `onMissing` when present but not in available
  - `highlightedTask` clears after 3000ms (use `vi.useFakeTimers`)
- `MyWorkPage.deeplink.test.tsx`:
  - Render at `/my-work?task=VT-1` with task present → row has `data-deeplink-highlight="true"`
  - Render at `/my-work?task=VT-999` → toast warning fired, no row highlighted

## 7. Acceptance criteria

1. `/my-work?task=<name>` with task in list: row outlined + scrolled into view + pulse animation.
2. Highlight clears after 3 seconds.
3. `/my-work?task=<missing>` shows a warning toast.
4. `/leader-review?task=<name>` works same way.
5. Hook is reusable; no logic duplicated between pages.
6. No regression in existing MyWork / LeaderReview tests.

## 8. Effort

**S (small).** ~1 new hook + small edits in 2 pages + shared CSS. ~3-4 hours.
