# Institution Picker Page — Design Spec

**Date:** 2026-05-10  
**Status:** Approved  
**Scope:** Frontend (web-dashboard) + Backend (sekolahpro Frappe app)

---

## Overview

After a successful login, users who manage multiple schools/koperasis are directed to a glassmorphism institution picker page (`/choose-company`). They select the institution they want to manage, then land on that institution's dashboard. If the user only has access to one institution, the picker is bypassed and they are redirected directly.

---

## Backend: New API Endpoint

**File:** `sekolahpro/pengaturan/api/sekolah.py`  
**Endpoint:** `POST /api/method/sekolahpro.pengaturan.api.sekolah.get_user_institutions`

**Behavior:**
- Calls `frappe.get_list("Sekolah", ...)` — Frappe's permission engine auto-filters to records the logged-in user can read.
- Fetches fields: `name`, `nama`, `npsn`, `jenis`, `logo`
- For each Sekolah, fetches `modul_aktif` child table to get list of active modules.
- Returns JSON array.

**Response shape:**
```json
{
  "message": [
    {
      "name": "SDN-MAJU-JAYA",
      "nama": "SDN Maju Jaya",
      "npsn": "20123456",
      "jenis": "SD",
      "logo": "/files/logo_sdn.png",
      "modul_aktif": ["Akademik", "Perpustakaan", "Koperasi"]
    }
  ]
}
```

**Auth:** Session cookie (`credentials: 'include'`). No extra headers needed.

---

## Frontend: Auth Types

**File:** `src/types/auth.types.ts`

Extend `Company` interface:
```typescript
export interface Company {
  id: string       // = Frappe docname (e.g. "SDN-MAJU-JAYA")
  code: string     // = Frappe docname (used in route /c/:code/dashboard)
  name: string     // = sekolah.nama (display name)
  logo?: string    // = sekolah.logo (relative Frappe path)
  npsn?: string    // = sekolah.npsn
  jenis?: string   // = sekolah.jenis (SD/SMP/SMA/Koperasi/etc)
  modules?: string[] // = active module names from modul_aktif
  groupId?: string
}
```

---

## Frontend: Auth Service

**File:** `src/services/auth.service.ts`

After successful Frappe session login, call `get_user_institutions` to populate `companyGroups` in `LoginResponse`. Map each `Sekolah` to a `Company` object. Wrap all companies in a single `CompanyGroup` (no group concept in SekolahPro — one flat list).

**Data mapping:**
```
sekolah.name     → Company.id, Company.code
sekolah.nama     → Company.name
sekolah.logo     → Company.logo
sekolah.npsn     → Company.npsn
sekolah.jenis    → Company.jenis
modul_aktif[]    → Company.modules (only entries where aktif=1)
```

**Edge cases:**
- API returns empty list → user sees empty state with contact admin message.
- API call fails → treat as empty list, show error message on picker page.
- Only 1 institution → `login()` auto-selects it, `RootRedirect` skips picker.

---

## Frontend: Auth Store

**File:** `src/stores/auth.store.ts`

No structural changes needed. The existing `login()` action already handles single-institution auto-select:
```typescript
const defaultCompany = defaultGroup?.companies.length === 1
  ? defaultGroup.companies[0]
  : null
```
This causes `RootRedirect` to skip `/choose-company` when only 1 institution.

---

## Frontend: Login Redirect Fix

**File:** `src/pages/Login/LoginPage.tsx`

`getRedirectPath()` currently falls back to `/dashboard`. In multi-tenant (SekolahPro) context, the fallback must be `/` so `RootRedirect` can route correctly.

**Change:** When no `next` param and no `from` state, redirect to `/` instead of `/dashboard`.

---

## Frontend: ChooseCompanyPage Redesign

**File:** `src/pages/ChooseCompany/ChooseCompanyPage.tsx` + `ChooseCompanyPage.module.css`

### Layout

Full-screen page. No AppShell. Centered vertically and horizontally.

```
┌─────────────────────────────────────────────────────────────┐
│  Background: indigo→purple gradient + radial blur orbs      │
│                                                             │
│  Top-right corner: user name + logout button                │
│                                                             │
│  Center block:                                              │
│    Logo / App name                                          │
│    "Pilih Institusi" heading                                │
│    Subtext: "Selamat datang, {nama}"                        │
│                                                             │
│  Card grid (responsive):                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  glass card  │  │  glass card  │  │  glass card  │      │
│  │  [Logo/Av.]  │  │  [Logo/Av.]  │  │  [Logo/Av.]  │      │
│  │  Nama        │  │  Nama        │  │  Nama        │      │
│  │  NPSN        │  │  NPSN        │  │  NPSN        │      │
│  │  [SD][Kop]   │  │  [SMA]       │  │  [Kop]       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  (empty state if no institutions)                           │
└─────────────────────────────────────────────────────────────┘
```

### Card Design

- Background: `rgba(255, 255, 255, 0.08)`
- Backdrop filter: `blur(16px) saturate(180%)`
- Border: `1px solid rgba(255, 255, 255, 0.15)`
- Border radius: `20px`
- Box shadow: `0 8px 32px rgba(0, 0, 0, 0.2)`
- Hover: `translateY(-4px)` + border glow `rgba(255,255,255,0.3)`
- Click: `scale(0.98)` press feedback

**Card content (top to bottom):**
1. Institution logo (64×64, rounded) — or avatar circle with initials if no logo
2. Institution name (bold, white)
3. NPSN (small, muted white — omit if empty)
4. Module badges: pill chips for each active module (e.g. "Akademik", "Koperasi")

### Grid

- Mobile (< 640px): 1 column
- Tablet (640–1024px): 2 columns
- Desktop (> 1024px): 3 columns, max 4
- Max container width: 960px

### Background

```css
background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #1e3a5f 100%);
```
Two decorative radial blur orbs (absolute positioned, pointer-events none):
- Orb 1: top-left, indigo, 400px, opacity 0.3
- Orb 2: bottom-right, purple, 600px, opacity 0.2

### Empty State

Centered icon + text: "Tidak ada institusi yang tersedia. Hubungi administrator."

### Loading State

3 skeleton cards with shimmer animation while fetching institutions.

---

## Routing

No route changes needed. `/choose-company` already exists and is wrapped in `AuthRoute`.

**Flow after login:**
```
Login success
  → navigate('/')
  → RootRedirect evaluates:
      isAuthenticated=true, multi-tenant or single-tenant
      single-tenant  → /dashboard
      multi-tenant, role=superuser → /su/dashboard
      multi-tenant, 1 institution  → auto-selected → /c/:code/dashboard
      multi-tenant, N institutions → /choose-company
```

After selection on picker:
```
Card click → selectGroup() + selectCompany() → navigate('/c/:code/dashboard')
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `sekolahpro/pengaturan/api/sekolah.py` | Create |
| `src/types/auth.types.ts` | Modify (extend Company) |
| `src/services/auth.service.ts` | Modify (call get_user_institutions) |
| `src/pages/Login/LoginPage.tsx` | Modify (fix redirect fallback) |
| `src/pages/ChooseCompany/ChooseCompanyPage.tsx` | Modify (full redesign) |
| `src/pages/ChooseCompany/ChooseCompanyPage.module.css` | Modify (full rewrite) |

---

## Out of Scope

- Role-based module visibility on the dashboard (separate concern)
- Frappe user permission setup (admin task, not frontend)
- Search/filter on picker (not needed until > 10 institutions)
- Group-level (`/g/`) context (not used in SekolahPro)
