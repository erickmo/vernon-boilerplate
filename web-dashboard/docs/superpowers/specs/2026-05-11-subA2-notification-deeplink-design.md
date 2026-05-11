# Sub-A2 — Notification Deep-Link

**Date:** 2026-05-11
**Status:** Design — auto-approved per session direction (continuation of Sub-A)
**Parent project:** UX/IA restructure for Vernon Tasks web-dashboard
**Sibling specs:** Sub-A1 (perspective switcher, shipped), Sub-A3 (mobile responsive, future)

---

## 1. Context

Sub-A1 introduced an explicit perspective state and a `<PerspectiveSync />` component that auto-aligns perspective to the current route. Notifications currently appear in a dropdown but are inert — clicking only marks-as-read and closes the dropdown. There is no way to jump to the relevant task or page from a notification.

## 2. Problem

A Leader gets a notification "Task VT-123 submitted for review." They click it. Nothing happens beyond markRead. To act on it, they navigate manually to `Review Tugas` and search for the task. The notification provides no value over silence.

## 3. Goals

- Make notifications actionable: clicking a notification navigates to the relevant page.
- Switch perspective automatically when the destination belongs to a different one (powered by the `PerspectiveSync` already shipped in A1).
- Empty / linkless notifications stay no-op (current behavior preserved).
- Frontend keeps working before the backend pushes `link` directly — via a type → link template mapper, with a documented deprecation path.

## 4. Non-Goals

- Backend Frappe notification changes (separate ticket; this spec defines the contract the FE expects).
- Notification grouping, filtering, or persistence beyond the existing in-memory store.
- Push / desktop notifications.
- Bottom-sheet mobile dropdown (Sub-A3).

## 5. Design

### 5.1 Notification schema extension

Edit `src/stores/notification.store.ts`:

```ts
export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  href?: string         // EXISTING — kept for backward compat
  link?: string         // NEW — preferred. Internal route, e.g. '/leader-review?task=VT-123'
  perspective?: 'saya' | 'tim' | 'admin'  // NEW — optional hint
  taskName?: string     // NEW — for the link template mapper to build deep links
  kind?: NotificationKind // NEW — semantic event type, see 5.2
}

export type NotificationKind =
  | 'task-assigned'
  | 'task-review-requested'
  | 'task-approved'
  | 'task-rejected'
  | 'task-deadline-near'
  | 'system'
  | string  // allow forward-compat unknown kinds
```

`href` (legacy) is left alone. New consumers use `link`.

### 5.2 Link template mapper

New file: `src/services/notification.links.ts`

Pure function: given a `NotificationItem`, return `{ link, perspective }` or null if the notification has no actionable destination.

Priority order:
1. If `item.link` already set → use it (backend already wired).
2. Else map `item.kind` + `item.taskName` to a template:
   - `task-assigned` / `task-deadline-near` → `/my-work?task=<taskName>`, perspective `saya`
   - `task-review-requested` → `/leader-review?task=<taskName>`, perspective `tim`
   - `task-approved` / `task-rejected` → `/my-work?task=<taskName>`, perspective `saya`
   - `system` / unknown → null
3. Else if legacy `item.href` set → use it (no perspective hint).
4. Else null.

Mapper is pure, well-tested, deletable later (when backend ships `link` everywhere).

### 5.3 Click handler

Edit `AppNavbar.tsx`. Replace the existing notification click handler:

```ts
onClick={() => { markRead(n.id); setShowNotif(false) }}
```

with a call to a new `handleNotificationClick(notification)` function that:
1. `markRead(n.id)`
2. Resolve `{ link, perspective }` via `resolveNotificationTarget(n)` from §5.2.
3. If `perspective` set and differs from current → `setPerspective(perspective)`.
4. If `link` set → `navigate(link)`.
5. Close the dropdown.

Steps 3 and 4 occur in the same tick. Zustand `set` is synchronous; React Router `navigate` is fire-and-forget. `PerspectiveSync` (A1) will reconcile if perspective and route disagree.

### 5.4 Deprecation TODO

Create file: `docs/tech-debt/notification-link-mapper.md` documenting:
- Frontend mapper exists as a stopgap.
- Backend should push `link` and `perspective` directly on the Frappe Notification doc.
- Once backend support lands in `vernon_tasks` (track via internal ticket), remove the mapper and let `item.link` flow through unchanged.
- Acceptance: zero references to `NotificationKind`-based mapping outside the deprecated file.

## 6. Testing

- `notification.links.test.ts` — every NotificationKind × presence/absence of `link`, `href`, `taskName`. Edge cases: empty taskName produces null (don't navigate to broken URL).
- `AppNavbar.notif-click.test.tsx` — render the notification dropdown, fire click on each notification kind, assert `markRead` called, `setPerspective` called only when needed, `navigate` called with correct path, dropdown closed.
- Existing `AppNavbar.test.tsx` (if any) — verify no regression.

## 7. Acceptance criteria

1. Clicking a `task-review-requested` notification while in `saya` perspective: navigates to `/leader-review?task=<id>`, switches perspective to `tim`, marks read, closes dropdown.
2. Clicking a `task-assigned` notification: navigates to `/my-work?task=<id>`, perspective stays `saya` or auto-switches if currently `tim`/`admin`.
3. Clicking a notification with only `href` (legacy): navigates to that href, no perspective change.
4. Clicking a `system` notification: marks read, closes dropdown, no navigation.
5. Clicking a notification with neither `link`, `kind`, nor `href`: no-op navigation (markRead + close only).
6. Notif item with `link` field set (future backend-pushed): used directly, mapper not consulted for the link.
7. All existing AppNavbar tests pass.

## 8. Effort

**S (small).** Three new files + targeted edits in two files. ~3-4 hours including tests.

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Backend later changes the notification schema | Mapper is one file; one update point |
| `taskName` missing on a kind that needs it | Mapper returns null; click degrades to markRead-only |
| Race between `setPerspective` and `navigate` | Zustand sync set + PerspectiveSync reconciles regardless |
