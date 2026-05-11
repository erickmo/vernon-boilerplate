# Sub-A1 — Perspective Switcher (Saya / Tim / Admin)

**Date:** 2026-05-11
**Status:** Design — awaiting approval
**Parent project:** UX/IA restructure for Vernon Tasks web-dashboard
**Sibling specs (future):** Sub-A2 (notification deep-link), Sub-A3 (mobile responsive)

---

## 1. Context

The `web-dashboard` repo is the React frontend for the `vernon_tasks` Frappe app — internal PDCA task workflow (BACKLOG → PLAN → DO → CHECK → DONE). Scope is Vernon Tasks only; Sekolah/Koperasi/multi-tenant code is boilerplate residue and out-of-scope.

Roles in use:
- `VT Member` — personal tasks (MyWork, MyDashboard)
- `VT Leader` — Member + team lead (LeaderDashboard, LeaderReview)
- `VT Manager` — Leader + admin (+ AuditLog)
- `Administrator` / `System Manager` — superuser (all pages)

Current navigation (`src/layouts/AppNavbar/AppNavbar.tsx`) renders a single flat top nav. For users with multiple roles, all menu items render side-by-side, mixing personal-work context with team-leadership context.

## 2. Problem

A dual-role user (Member + Leader, common case) sees four nav items in one undifferentiated row: `Kerja Saya | Dashboard Saya | Dashboard Tim | Review Tugas`. The cognitive cost of switching mental context every time the eye sweeps the navbar is real. There is no signal of "what mode am I in right now?" and no way to scope notifications, default landing, or future global state to a perspective.

## 3. Goals

- Separate "doing my work" (Saya) and "leading my team" (Tim) into explicit, switchable perspectives.
- Pure single-role users see no extra UI weight.
- Switching is fast, persistent across reloads, robust to role changes, and accessible to keyboard.
- Foundation for Sub-A2 (notifications deep-link aware of perspective) and any future per-perspective state.

## 4. Non-Goals

- Mobile drawer / responsive (Sub-A3).
- Notification deep-link click handling (Sub-A2).
- Visual redesign of nav items, logo, or right-zone.
- Changes to page contents (MyWork, LeaderReview, etc.) — they keep working as-is.
- Search / command palette.

## 5. Design

### 5.1 State model

Add to `src/stores/ui.store.ts`:

```ts
export type Perspective = 'saya' | 'tim' | 'admin'

interface UiState {
  // ... existing
  perspective: Perspective
  setPerspective: (p: Perspective) => void
}
```

Persist `perspective` to `localStorage` under key `vt:perspective` (Zustand `persist` middleware).

Zustand `set` is synchronous, so `setPerspective` followed immediately by `navigate(...)` in the same tick reads the new value via subsequent selectors on the next render — no race. Persist write is fire-and-forget and does not block.

### 5.2 Role matrix → available perspectives

Computed selector `useAvailablePerspectives()` returns the array of perspectives a user can access:

| Roles user has                                         | Available perspectives          |
|--------------------------------------------------------|---------------------------------|
| `VT Member` only                                       | `['saya']`                      |
| `VT Leader` (always implies Member)                    | `['saya', 'tim']`               |
| `VT Manager` (implies Leader, Member)                  | `['saya', 'tim', 'admin']`      |
| `Administrator` / `System Manager` only (no VT roles)  | `['admin']`                     |
| `Administrator` + VT roles                             | union of the rows above         |
| no relevant roles                                      | `['saya']` (degenerate; defaults to empty nav) |

The switcher renders only when `available.length > 1`. Single-perspective users never see a toggle.

### 5.3 Declarative nav registry

Replace the inline `NAV_ITEMS_*` constants in `AppNavbar.tsx` with a single registry in `src/layouts/AppNavbar/nav.registry.ts`:

```ts
import type { LucideIcon } from 'lucide-react'

export interface NavItemDef {
  key: string
  label: string
  icon: LucideIcon
  path: string             // relative, e.g. 'my-work'
  perspective: Perspective
  requiredRoles?: string[] // any-of; omit = available to all in that perspective
}

export const NAV_REGISTRY: NavItemDef[] = [
  { key: 'my-work',          label: 'Kerja Saya',     icon: Briefcase,       path: 'my-work',          perspective: 'saya' },
  { key: 'my-dashboard',     label: 'Dashboard Saya', icon: BarChart2,       path: 'my-dashboard',     perspective: 'saya' },
  { key: 'leader-dashboard', label: 'Dashboard Tim',  icon: LayoutDashboard, path: 'leader-dashboard', perspective: 'tim',   requiredRoles: ['VT Leader', 'VT Manager'] },
  { key: 'leader-review',    label: 'Review Tugas',   icon: ClipboardCheck,  path: 'leader-review',    perspective: 'tim',   requiredRoles: ['VT Leader', 'VT Manager'] },
  { key: 'audit-log',        label: 'Audit Log',      icon: ScrollText,      path: 'audit-log',        perspective: 'admin', requiredRoles: ['VT Manager', 'Administrator', 'System Manager'] },
]
```

`useNavItems()` filters the registry by `current perspective ∩ user roles`.

The multi-tenant `NAV_ITEMS_SUPERUSER/HQ/COMPANY/SEKOLAH/KOPERASI` constants are not removed by this spec — they remain dead code for now and will be cleaned up in a separate hygiene PR (out of scope).

### 5.4 Switcher UI

A segmented control rendered in `AppNavbar.tsx` between the logo and the nav items.

- One `<button role="tab">` per available perspective; active button has `aria-selected="true"`.
- Label + icon for each: Saya (User icon), Tim (Users icon), Admin (Shield icon).
- Container has `role="tablist"` and `aria-label="Mode tampilan"`.
- Roving tabindex (active button `tabindex=0`, others `tabindex=-1`); ArrowLeft/Right move focus and switch perspective; Home/End jump to first/last.
- Click on a button calls `setPerspective(p)`. No navigation side-effect — the user stays on the current page if it belongs to the new perspective; otherwise they land on the new perspective's default page (see 5.5).

### 5.5 Default page per perspective

| Perspective | Default route        |
|-------------|----------------------|
| `saya`      | `/my-work`           |
| `tim`       | `/leader-review`     |
| `admin`     | `/audit-log`         |

When the user switches perspective via the toggle and the current route is not in the new perspective's filtered nav, navigate to that perspective's default route. When the user switches and the current route IS valid for the new perspective (rare for now, useful later), stay put.

### 5.6 Initial perspective on bootstrap

On auth hydrate (`useAuthStore` rehydrated + user roles known), validate the persisted `perspective`:

1. Compute `available = useAvailablePerspectives()`.
2. If persisted `perspective ∈ available`, keep it.
3. Else, choose default:
   - First-time login (no persisted value): if `'tim' ∈ available`, default to `'tim'` (Leaders log in primarily to review). Else `'saya'`. Else `'admin'`.
   - Persisted but no longer available (role revoked): downgrade gracefully — `tim → saya → admin`.

### 5.7 Cross-perspective badge

Each switcher button shows a small count badge when the OTHER perspective has actionable items. This prevents Leaders from neglecting their own assigned tasks (or vice versa).

Source per perspective (initial heuristic; refine in Sub-B/C):
- `saya` badge = unread notifications scoped to personal-task events (assigned, rejected, deadline-near). For now: count of unread notifications where `notification.perspective === 'saya' || perspective is unset and type ∈ assignment-related set`.
- `tim` badge = count from `get_review_queue` (CHECK queue length). Use React Query with `staleTime: 30_000`, refetch on focus.
- `admin` badge = none for now (no urgent action signal).

A badge renders only on the *inactive* buttons (showing the user what they're missing). Badge style: small filled circle, number inside, max display "9+".

If the count source fails or returns 0, no badge renders. Errors are silent (failure to show a badge must not break navigation).

### 5.8 Deep-link override (forward-compat hook for Sub-A2)

When a route load resolves to a page that belongs to a different perspective than the current `perspective` state, automatically `setPerspective(routePerspective)` before the page renders. Implement as a small `<PerspectiveSync />` component in the route tree (inside `AppShell`) that reads `useLocation()`, derives perspective from the route → registry mapping, and sets state if mismatched.

This unblocks Sub-A2 (notification click → navigate to `/leader-review?task=X` and perspective updates automatically) without Sub-A2 needing to call `setPerspective` itself.

### 5.9 Removed / changed code

- `NAV_ITEMS_VT_MEMBER`, `NAV_ITEMS_VT_LEADER_EXTRA`, `NAV_ITEMS_VT_MANAGER_EXTRA`, `NAV_ITEMS_ADMIN` constants in `AppNavbar.tsx` → removed; nav items come from `nav.registry.ts`.
- The `isVtContext / vtNavItems` branch in `AppNavbar.tsx` → simplified to a single `useNavItems()` call.
- Existing `AppNavbar.test.tsx` (and any role-filter tests) → updated to assert switcher visibility + filtered items per perspective.

## 6. Architecture / data flow

```
auth.store (roles)
        │
        ├─→ useAvailablePerspectives() ──┐
        │                                 ▼
ui.store (perspective)  ◄──── bootstrap validator ────┐
        │                                              │
        ├─→ useNavItems()  ──→ AppNavbar renders nav   │
        │                                              │
        └─→ PerspectiveSync (route → perspective) ─────┘
```

Pure functions, no side effects outside the stores.

## 7. Testing

Vitest + RTL:

- `nav.registry.test.ts` — pure filter logic: `getNavItemsFor(perspective, roles)` returns correct items for every role × perspective combination.
- `useAvailablePerspectives.test.tsx` — role matrix.
- `ui.store.test.ts` — `setPerspective` updates state; persist key correct.
- `AppNavbar.test.tsx` — switcher hidden for `available.length === 1`; visible otherwise; clicking each button updates state and (when current route invalid) navigates to default; ArrowLeft/Right keyboard navigation; aria attributes.
- `bootstrap.test.tsx` — persisted invalid perspective is downgraded; first-time Leader defaults to `tim`; first-time Member defaults to `saya`.
- `PerspectiveSync.test.tsx` — visiting `/leader-review` while `perspective='saya'` flips state to `'tim'` before render.

E2E (Playwright) optional, single happy path:
- Login as Leader → land on Tim default → click Saya → land on `/my-work` → reload → still Saya.

## 8. Acceptance criteria

1. Pure Member sees zero switcher DOM (not just `display:none`; the element does not render).
2. Leader+Member sees switcher with 2 buttons; Manager sees 3.
3. Perspective persists across page reload (same browser).
4. Persisted perspective revalidated against current roles on auth hydrate; invalid perspectives downgraded silently.
5. Switching perspective while on a page that doesn't belong to the new perspective navigates to the new perspective's default page; switching while on a valid page is a no-op for routing.
6. Direct visit to `/leader-review` (e.g. paste URL or browser-back) while in `saya` auto-flips perspective to `tim` before page renders — no flash of wrong nav.
7. Keyboard: Tab into switcher focuses active button; ArrowLeft/Right move focus AND switch; Enter/Space activate (redundant when arrow already switches, but no error).
8. All existing AppNavbar tests pass after update; no regression in role-based nav filtering.
9. Switcher buttons have correct `role`, `aria-selected`, `aria-label` attributes.
10. Cross-perspective badge renders when source returns a positive count; renders nothing when count is 0 or source errors; badge is hidden on the currently-active perspective button.

## 9. Risks & mitigations

| Risk                                                                  | Mitigation                                                       |
|-----------------------------------------------------------------------|------------------------------------------------------------------|
| Leader defaults to `tim` and neglects personal tasks                  | Cross-perspective badge (5.7) surfaces unread Saya items         |
| `localStorage` perspective stale after role revoke → 403 loop         | Bootstrap validator (5.6) downgrades to first available          |
| Existing role-filter tests break                                      | Audit + update as part of this PR; acceptance criterion #8       |
| `PerspectiveSync` causes infinite re-render if registry inconsistent  | Guard: only `setPerspective` when `state !== derived`; unit test |
| Badge data source not yet implemented backend-side                    | Graceful 0 / silent failure (5.7 last paragraph)                 |

## 10. Effort

**M (medium).** Net ~6 files touched: `ui.store.ts`, `auth.store.ts` (selector), `nav.registry.ts` (new), `AppNavbar.tsx` (rewrite filter), `PerspectiveSync.tsx` (new), tests. ~1-2 day single-developer estimate including test updates.

## 11. Sequencing

- A1 ships first, standalone. Dogfood with at least one Leader for 1 week before A2.
- A2 (notification deep-link) depends on the `PerspectiveSync` component from §5.8 being live.
- A3 (mobile) is independent and can be developed in parallel after A1 stabilizes.
