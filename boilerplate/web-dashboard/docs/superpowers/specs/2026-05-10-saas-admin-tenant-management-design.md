# SaaS Admin — Tenant Management Design Spec

**Date:** 2026-05-10  
**Status:** Approved  
**Scope:** New `vernon_saas` Frappe app + Web Dashboard `/su/tenants` pages

---

## Problem

`sekolahpro` currently owns `Organisasi` (tenant) as a doctype, mixing SaaS platform concerns with school domain logic. The admin dashboard (`/su/dashboard`) only shows a flat institution list with no tenant editing, user management, or module control. As the platform scales to more clients, this breaks down.

---

## Solution Overview

1. Create **`vernon_saas`** — a new Frappe app owning tenant-level platform concerns.
2. Migrate **`Organisasi`** doctype from `sekolahpro` → `vernon_saas`.
3. Build **Tenant Management UI** in the web dashboard: list + detail with 4 tabs.

---

## Part 1: `vernon_saas` Frappe App

### Location
```
/Users/erickmo/Desktop/Project/frappe/apps/vernon_saas/
```

### Doctypes

#### `Organisasi` (migrated from sekolahpro)

Fields (unchanged from current):
- `nama` — Data, required
- `jenis_organisasi` — Select (Yayasan/Perusahaan/Pemerintah/Lainnya)
- `npwp` — Data
- `telepon` — Data
- `email` — Data, Email
- `alamat` — Text
- `logo` — Attach Image
- `status` — Select (Aktif/Non-Aktif), default Aktif

After migration: `sekolahpro.Sekolah.organisasi` and `sekolahpro.Koperasi.organisasi` Link fields point to `Organisasi` (Frappe resolves cross-app links by doctype name — no module prefix needed in Link fields).

### API Module: `vernon_saas/api/tenant.py`

All functions are `@frappe.whitelist()`.

```python
get_tenant_list()
# Returns: list of Organisasi with stats
# Fields: name, nama, logo, status, jenis_organisasi, email, telepon
# Stats: institution_count (Sekolah + Koperasi), user_count (User Permissions)

get_tenant_detail(org)
# Returns: {
#   info: Organisasi doc fields,
#   institutions: [{name, nama, type, status, logo, lembaga[], modul_aktif[]}],
#   users: [{name, full_name, email, role, institution, institution_type}]
# }

update_tenant(org, data)
# data: {nama, npwp, telepon, email, alamat, logo, status, jenis_organisasi}
# PUT /api/resource/Organisasi/:org

create_tenant(data)
# Create new Organisasi
# data: {nama, jenis_organisasi, npwp, telepon, email, alamat}

toggle_institution_status(name, doctype, status)
# doctype: "Sekolah" | "Koperasi"
# status: "Aktif" | "Non-Aktif"
# Updates status field on the institution doc

get_org_users(org)
# Returns users who have User Permission for any Sekolah/Koperasi under this org
# Includes: name, full_name, email, enabled, roles[], institution assignments

create_org_user(org, email, full_name, password, role, institution, institution_doctype)
# 1. frappe.get_doc("User", {...}).insert() — creates Frappe user
# 2. Add role via user.add_roles(role)
# 3. frappe.get_doc("User Permission", {
#      user, allow=institution_doctype, for_value=institution
#    }).insert() — restricts user to that institution
# Returns: {name, email, full_name}

toggle_module(institution, institution_doctype, module_name, aktif)
# Updates modul_aktif child table on Sekolah or Koperasi doc
# Finds existing row with nama_modul=module_name, sets aktif=1/0
# If row doesn't exist and aktif=True, inserts new row
```

### App Registration

`apps.txt` and `site2.localhost/apps.txt` must include `vernon_saas`.
`sekolahpro/hooks.py` adds `required_apps = ["vernon_saas"]`.

---

## Part 2: Web Dashboard

### New Routes

```
/su/tenants                → TenantListPage
/su/tenants/:orgId         → TenantDetailPage
```

Both wrapped in `SuperuserRoute > AppShell context="superuser"`.

### New Files

```
src/pages/Admin/
├── TenantListPage.tsx
├── TenantListPage.module.css
├── TenantDetailPage.tsx
└── TenantDetailPage.module.css
```

### New Service Methods (`auth.service.ts` or `tenant.service.ts`)

```typescript
tenantService.getTenantList()         → Tenant[]
tenantService.getTenantDetail(org)    → TenantDetail
tenantService.updateTenant(org, data) → void
tenantService.createTenant(data)      → void
tenantService.toggleInstitutionStatus(name, doctype, status) → void
tenantService.getOrgUsers(org)        → OrgUser[]
tenantService.createOrgUser(payload)  → void
tenantService.toggleModule(institution, doctype, module, aktif) → void
```

All call `POST /api/method/vernon_saas.api.tenant.<fn>`.

### New Types (`src/types/tenant.types.ts`)

```typescript
export interface Tenant {
  name: string          // Frappe docname
  nama: string
  logo?: string
  status: 'Aktif' | 'Non-Aktif'
  jenis_organisasi?: string
  email?: string
  telepon?: string
  npwp?: string
  alamat?: string
  institution_count: number
  user_count: number
}

export interface TenantInstitution {
  name: string
  nama: string
  type: 'sekolah' | 'koperasi'
  status: 'Aktif' | 'Non-Aktif'
  logo?: string
  lembaga: { name: string; nama: string; jenjang: string }[]
  modul_aktif: { nama_modul: string; aktif: boolean }[]
}

export interface OrgUser {
  name: string
  full_name: string
  email: string
  enabled: boolean
  roles: string[]
  institution: string
  institution_doctype: string
}

export interface TenantDetail {
  info: Tenant
  institutions: TenantInstitution[]
  users: OrgUser[]
}
```

---

## Part 3: UI Spec

### TenantListPage (`/su/tenants`)

**Layout:** page header + search bar + "Tambah Tenant" button + table/list.

**Table columns:**
- Logo (24px avatar)
- Nama + jenis_organisasi (subtext)
- Institusi count badge
- User count badge
- Status badge (Aktif=green, Non-Aktif=gray)
- "Lihat →" link → `/su/tenants/:name`

**"Tambah Tenant" modal fields:** Nama (required), Jenis Organisasi (select), Email, Telepon.

**Empty state:** "Belum ada tenant. Tambahkan yang pertama."

---

### TenantDetailPage (`/su/tenants/:orgId`)

**Breadcrumb:** Dashboard / Tenants / {nama}

**Header:** Tenant logo + nama + status badge + back button.

**4 Tabs:**

#### Tab 1 — Info

Edit form fields:
- Nama, Jenis Organisasi (select), NPWP
- Email, Telepon
- Alamat (textarea)
- Logo (attach image — show preview)
- Status (Aktif/Non-Aktif toggle)

"Simpan" button — calls `update_tenant`.

**Danger Zone** (red section at bottom):
- "Nonaktifkan Tenant" button → sets status=Non-Aktif + confirm dialog.

#### Tab 2 — Institusi

List of institutions in this tenant. Same row design as AdminDashboardPage.

Per row: logo/icon, nama, type badge, status badge, "Modul" chip count, toggle aktif/nonaktif button.

"Tambah Institusi" button → existing CreateModal (pre-fills organisasi=this org).

#### Tab 3 — Users

List table: Full Name, Email, Role(s), Institution, Status (enabled/disabled).

"Tambah User" button → slide-in form:
- Full Name (required)
- Email (required)
- Password (required, shown once)
- Role (select: Teller/Supervisor/Pustakawan/Admin Guru/Tata Usaha)
- Institusi (select from org's institutions)

On submit: calls `create_org_user`.

Empty state: "Belum ada user di tenant ini."

#### Tab 4 — Modul

Grid per institution. Each institution = a card with:
- Institution name as header
- Toggle rows for each module: Akademik | Koperasi | Perpustakaan | Infrastruktur
- Each toggle = switch UI, updates on change (no save button — immediate)

Calls `toggle_module` on each switch change.

---

## Migration Plan

1. Create `vernon_saas` app with `bench new-app vernon_saas` inside container.
2. Create `Organisasi` doctype in `vernon_saas`.
3. Run `bench migrate` → creates `tabOrganisasi` under `vernon_saas`.
4. Copy data: `INSERT INTO tabOrganisasi SELECT * FROM tabOrganisasi` (same table name, different module ownership).
5. Update `sekolahpro/pengaturan/doctype/sekolah/sekolah.json` — `organisasi` Link field: `options` stays `"Organisasi"` (unchanged, Frappe resolves by doctype name).
6. Remove `Organisasi` doctype from `sekolahpro`.
7. Run `bench migrate` on `sekolahpro`.

**Risk:** Low. Frappe Link fields resolve by doctype name, not app. No data loss — same table name.

---

## Out of Scope

- Billing / subscription management
- Email notifications on user creation
- Audit log / activity feed per tenant
- Bulk user import (CSV)
- `vernonedu3` franchise/partner integration
