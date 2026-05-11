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
