# Sub-A3 — Mobile Responsive Navbar

**Date:** 2026-05-11
**Status:** Design — auto-approved per session direction (continuation of Sub-A)
**Parent project:** UX/IA restructure for Vernon Tasks web-dashboard
**Sibling specs:** Sub-A1 (perspective switcher, shipped #1), Sub-A2 (notif deep-link, shipped #2)

---

## 1. Context

`AppNavbar` is a horizontal top bar with logo, perspective switcher (A1), nav items, notif bell, and avatar. On screens below ~768px (most phone widths), nav items overflow horizontally and dropdowns get clipped. Members frequently use phones to start/submit tasks; this experience is rough.

## 2. Problem

- Nav items overflow at mobile widths.
- Notification dropdown and avatar dropdown are anchored to the top-right corner and exceed viewport edges.
- Tap targets are smaller than the 44px iOS/Material standard.
- No drawer / no responsive collapse pattern.

## 3. Goals

- Below `--bp-md` (768px): navbar collapses to `[hamburger] [logo] [notif + avatar]`.
- Switcher + nav items move into a left slide-in drawer.
- Notif dropdown + avatar dropdown render as bottom-sheets (full-width, anchored bottom).
- Tap targets ≥ 44×44px.
- Keyboard + screen reader support: focus trap, aria-modal, restore-focus on close.

## 4. Non-Goals

- Tablet-specific tuning (768-1024px keeps desktop layout for now).
- Page content reflow (this spec covers navbar/drawer/sheet only).
- Notification list redesign (same items, just different surface).
- Animations beyond the basic slide-in / slide-up transitions.

## 5. Design

### 5.1 Breakpoint

Add to `src/theme/variables.css`:
```css
--bp-md: 768px;
--z-drawer: 350; /* between navbar (300) and modal (400) */
--z-sheet: 350;
```

CSS media query helper: use `@media (max-width: 767.98px)` for "mobile" (just-below-md).

### 5.2 Navbar collapse

At `<md`, hide:
- Perspective switcher (moves to drawer)
- `.navList` (moves to drawer)
- Workspace switcher button (multi-tenant — out of scope, keep hidden)

Show:
- Hamburger button (new, left of logo)

Keep:
- Logo (center / left after hamburger)
- Notif bell + avatar (right)

Implement via CSS only — same `AppNavbar.tsx` markup, classes flip visibility at the breakpoint. Add a hamburger `<button>` to the JSX that is `display: none` at `≥md` and `display: flex` at `<md`.

### 5.3 `<AppDrawer />` component

New component `src/layouts/AppNavbar/AppDrawer.tsx`. Renders:
- Backdrop (`<div>` overlay, click → close, fade in/out 200ms)
- Panel (left slide-in, 80vw max 320px, slide 200ms, `var(--ease-spring)`)
- Panel header: avatar + user name + role badges
- Panel body: `<PerspectiveSwitcher />` (full-width segmented) → vertical nav items (`useNavItems()`) → divider → Profil Saya / Ganti Password / Keluar

Drawer open state lives in `ui.store` as `drawerOpen: boolean` (not persisted; default `false`). Action `toggleDrawer()` and `setDrawerOpen(open)`.

Close triggers:
- Click backdrop
- Esc key
- Route change (subscribe to `useLocation` inside drawer; close on pathname change)
- Click any link in drawer

A11y:
- Panel: `role="dialog"`, `aria-modal="true"`, `aria-label="Menu navigasi"`
- Focus trap: when open, focus moves to first focusable (close button or first nav link)
- On close: restore focus to hamburger
- Body scroll lock while open (`document.body.style.overflow = 'hidden'`)

### 5.4 Bottom-sheet for notif + avatar dropdowns

Below `md`, the existing notification and profile dropdowns reposition as bottom-sheets:
- Full viewport width
- Anchored to bottom, slide up 200ms
- Same backdrop + close behavior as drawer
- Max-height 70vh, scrollable inside
- Sticky drag handle (visual only, 36px wide / 4px tall, indigo subtle)

Implement via CSS modifiers on the existing `.notifDropdown` / `.profileDropdown` classes:

```css
@media (max-width: 767.98px) {
  .notifDropdown {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    width: 100%;
    max-width: 100%;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    max-height: 70vh;
    animation: sheet-slide-up 200ms var(--ease-spring);
  }
  /* same for .profileDropdown */
}
```

Plus a backdrop element conditionally rendered when the dropdown is open at mobile width. The backdrop is the same `<DropdownBackdrop />` helper used by drawer (or inline).

Don't change open/close trigger logic. Just visual layer.

### 5.5 Touch targets

In navbar + drawer + sheet, every interactive element ≥ 44×44px at `<md`. Apply via:
- `.iconBtn` → min-height/min-width 44px at `<md`
- `.dropdownItem`, drawer nav items → min-height 44px at `<md`

Add a global utility class `.touchTarget` if it cleans up repetition; otherwise scope per-component.

### 5.6 Hamburger button

In `AppNavbar.tsx`, render a `<button aria-label="Buka menu">` with `Menu` icon from `lucide-react` only at `<md` (CSS visibility). `onClick` → `useUiStore.getState().setDrawerOpen(true)` (or toggle). Position: leftmost in navbar.

### 5.7 Visual polish

- Drawer panel background: `var(--color-surface-elevated)` (white).
- Drawer header: gradient strip matching logo (subtle).
- Active nav item in drawer: filled background `var(--color-primary-subtle)`, primary text color.
- Bottom-sheet drag handle: `4px × 36px`, `background: var(--color-border)`, centered, 8px top margin.

## 6. Testing

Unit / component tests (Vitest + RTL):
- `ui.store.drawer.test.ts` — `toggleDrawer`, `setDrawerOpen` state changes.
- `AppDrawer.test.tsx` — renders user info, perspective switcher, nav items, profile links; Esc closes; backdrop click closes; route change closes; focus trap (first focusable receives focus on open).
- `AppNavbar.mobile.test.tsx` — hamburger button visible only at `<md` (use `matchMedia` mock), click opens drawer.

E2E (Playwright) — optional smoke:
- Viewport 375×667, login, open drawer, click nav item, drawer closes + navigates.

## 7. Acceptance criteria

1. At `≥768px`: navbar identical to current desktop look. No hamburger, no drawer.
2. At `<768px`: hamburger visible, switcher + nav hidden from navbar.
3. Hamburger click opens drawer with switcher + filtered nav items + profile actions.
4. Drawer panel: `role="dialog"`, `aria-modal="true"`, focus moves into panel on open.
5. Esc + backdrop click + route change all close drawer.
6. Focus returns to hamburger on close.
7. Body scroll locked while drawer open.
8. Notif dropdown + avatar dropdown at `<md` render as bottom-sheets with backdrop.
9. All interactive elements in mobile nav/drawer/sheet ≥ 44×44px.
10. Tests pass; no regression in existing AppNavbar / AppShell tests.

## 8. Effort

**M-L (medium-large).** New AppDrawer component + CSS for drawer/sheet/touch targets + ui.store changes + 3 test files + edits to AppNavbar + variables.css. ~1 dev day.

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Focus trap broken on iOS Safari | Test on real device or BrowserStack; fall back to programmatic focus on first item |
| Body scroll lock leaks if drawer unmounts unexpectedly | useEffect cleanup must restore overflow; covered in test |
| Bottom-sheet doesn't close on backdrop click on iOS due to bubbling | Use explicit backdrop element + stopPropagation rules |
| Drawer + sheet z-index collision | `--z-drawer` and `--z-sheet` both at 350, but only one open at a time (drawer closes sheets via state) |
