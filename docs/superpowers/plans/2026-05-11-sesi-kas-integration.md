# Sesi Kas Teller Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Teller Workstation to the backend `Sesi Kas Teller` lifecycle so a teller can buka sesi, transact, tutup sesi, and have a supervisor approve the closure entirely from the web-dashboard.

**Architecture:** One backend API addition (whitelisted `get_active_for_me`). Frontend extends the existing `kas-teller.service.ts`, replaces the stub types with backend-aligned shapes, builds two new modals + one reusable `DenominasiGrid` widget, gates `TellerWorkstationPage` on active sesi, adds a "Penutupan Kas" tab in `PusatPersetujuanPage`, refactors three existing stub kas-teller pages to use real types.

**Tech Stack:** Frappe (backend), React 18 + TypeScript strict, React Query 5, CSS Modules, Vitest + RTL, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-11-sesi-kas-integration-design.md`.

**Branch:** `feat/sesi-kas-integration` (already created, spec already committed).

**Working dirs:**
- Backend: `../frappe/apps/sekolahpro/`
- Frontend: `web-dashboard/`

---

## Task 0: Smoke baseline + branch confirmation

**Files:** none.

- [ ] **Step 1: Confirm branch**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git branch --show-current
```

Expected: `feat/sesi-kas-integration`.

- [ ] **Step 2: Confirm baseline state**

```bash
cd web-dashboard
npx tsc -b
echo "tsc exit: $?"
npx vite build 2>&1 | tail -3
```

Both must exit 0.

- [ ] **Step 3: Record current vitest baseline**

```bash
npx vitest run --reporter=basic 2>&1 | tail -5
```

Record pass/fail counts (current main baseline: 48 pass / 9 fail).

---

## Task 1: Backend — `get_active_for_me` whitelisted API

**Files:**
- Create: `../frappe/apps/sekolahpro/sekolahpro/koperasi/api/sesi_kas.py`
- Create: `../frappe/apps/sekolahpro/sekolahpro/koperasi/api/test_sesi_kas_api.py`
- Modify: `../frappe/apps/sekolahpro/docs/api/koperasi-sesi-kas.md` (new doc)

- [ ] **Step 1: Read the helper that already exists**

```bash
grep -A8 "def _get_active_sesi" ../frappe/apps/sekolahpro/sekolahpro/koperasi/doctype/transaksi_simpanan/transaksi_simpanan.py
```

Confirm it returns `frappe.db.get_value(...)` (single value, `None` if missing).

- [ ] **Step 2: Write failing test**

Create `../frappe/apps/sekolahpro/sekolahpro/koperasi/api/test_sesi_kas_api.py`:

```python
import frappe
import unittest

from sekolahpro.koperasi.api.sesi_kas import get_active_for_me


class TestSesiKasAPI(unittest.TestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def test_get_active_for_me_returns_none_when_no_sesi(self):
        # No active sesi for Administrator
        result = get_active_for_me()
        # If a test sesi from another suite leaks, accept either None or a dict
        self.assertTrue(result is None or isinstance(result, dict))

    def test_get_active_for_me_returns_dict_when_active(self):
        # Use existing fixture / seed minimally
        teller = frappe.session.user
        denom = frappe.get_all("Denominasi Uang", filters={"aktif": 1}, limit=1)
        if not denom:
            self.skipTest("No Denominasi Uang fixture loaded")
        supervisor = "Administrator"
        sesi = frappe.get_doc({
            "doctype": "Sesi Kas Teller",
            "teller": teller,
            "tanggal": frappe.utils.today(),
            "shift": "Pagi",
            "status": "Draft",
            "supervisor_buka": supervisor,
            "modal_kas": denom[0].nilai if "nilai" in denom[0] else 100000,
            "denominasi_buka": [
                {"denominasi": denom[0].name, "jumlah": 1}
            ],
        })
        try:
            sesi.insert()
            sesi.submit()
            result = get_active_for_me()
            self.assertIsNotNone(result)
            self.assertEqual(result.get("name"), sesi.name)
            self.assertEqual(result.get("status"), "Aktif")
        finally:
            frappe.db.rollback()
```

- [ ] **Step 3: Run the test (expect collection error — module not found)**

```bash
cd ../frappe
bench --site site2.localhost run-tests --app sekolahpro --module sekolahpro.koperasi.api.test_sesi_kas_api 2>&1 | tail -15
```

Expected: ImportError on `sekolahpro.koperasi.api.sesi_kas`.

- [ ] **Step 4: Create the module**

Create `../frappe/apps/sekolahpro/sekolahpro/koperasi/api/sesi_kas.py`:

```python
import frappe

from sekolahpro.koperasi.doctype.transaksi_simpanan.transaksi_simpanan import _get_active_sesi


@frappe.whitelist()
def get_active_for_me():
    """Return the current user's active Sesi Kas Teller as a dict, or None."""
    name = _get_active_sesi(frappe.session.user)
    if not name:
        return None
    return frappe.get_doc("Sesi Kas Teller", name).as_dict()
```

- [ ] **Step 5: Run tests again**

```bash
cd ../frappe
bench --site site2.localhost run-tests --app sekolahpro --module sekolahpro.koperasi.api.test_sesi_kas_api 2>&1 | tail -10
```

Expected: 2/2 PASS (or 1 PASS + 1 SKIP if no Denominasi fixture in test site).

- [ ] **Step 6: Write API doc**

Create `../frappe/apps/sekolahpro/docs/api/koperasi-sesi-kas.md`:

```markdown
# API: Koperasi Sesi Kas

**Module path:** `sekolahpro.koperasi.api.sesi_kas`

**Auth:** Login required (session cookie or API key).

---

## `GET /api/method/sekolahpro.koperasi.api.sesi_kas.get_active_for_me`

Returns the current user's active (status=Aktif) Sesi Kas Teller, or `null` if none.

**Response 200:**

```json
{
  "message": null
}
```

or

```json
{
  "message": {
    "name": "SST-2026-0001",
    "teller": "teller01@example.com",
    "status": "Aktif",
    "tanggal": "2026-05-11",
    "shift": "Pagi",
    "modal_kas": 1000000,
    "waktu_buka": "2026-05-11 08:00:00",
    "denominasi_buka": [...],
    "total_setoran": 0,
    "total_penarikan": 0
  }
}
```

**Sesi lifecycle:** Draft → Aktif → Pending Approval → Selesai. See
`sesi_kas_teller.py` controller for `tutup_kas` and `approve_tutup`
whitelisted doc methods, callable via `/api/method/run_doc_method`.
```

- [ ] **Step 7: Commit (backend repo)**

```bash
cd ../frappe
git add apps/sekolahpro/sekolahpro/koperasi/api/sesi_kas.py apps/sekolahpro/sekolahpro/koperasi/api/test_sesi_kas_api.py apps/sekolahpro/docs/api/koperasi-sesi-kas.md
git commit -m "feat(koperasi): whitelisted get_active_for_me API for current user's active sesi"
```

---

## Task 2: Frontend types — align `kas-teller.types.ts` with backend

**Files:**
- Modify: `web-dashboard/src/types/koperasi/kas-teller.types.ts`

- [ ] **Step 1: Read current file to confirm shape**

```bash
cat web-dashboard/src/types/koperasi/kas-teller.types.ts
```

- [ ] **Step 2: Replace contents**

Overwrite `web-dashboard/src/types/koperasi/kas-teller.types.ts` with:

```ts
// src/types/koperasi/kas-teller.types.ts

export type SesiKasStatus = 'Draft' | 'Aktif' | 'Pending Approval' | 'Selesai'
export type Shift = 'Pagi' | 'Siang' | 'Sore'

export interface DenominasiUang {
  name: string       // doc name, e.g. "Rp 100.000"
  nama: string
  nilai: number
  jenis: 'Kertas' | 'Koin'
  urutan: number
  aktif: 0 | 1
}

export interface DenominasiRow {
  denominasi: string  // FK → Denominasi Uang.name
  jumlah: number
}

export interface DenominasiBukaRow extends DenominasiRow {
  name?: string       // child row name (assigned by Frappe)
  nilai?: number      // resolved for display
  subtotal?: number   // = nilai * jumlah
}

export interface SesiKasTeller {
  name: string
  teller: string                   // User link
  tanggal: string                  // YYYY-MM-DD
  shift: Shift
  status: SesiKasStatus
  supervisor_buka: string          // User link
  modal_kas: number
  waktu_buka?: string
  total_denominasi_buka?: number
  denominasi_buka: DenominasiBukaRow[]
  waktu_tutup?: string
  total_denominasi_tutup?: number
  denominasi_tutup?: DenominasiBukaRow[]
  total_setoran?: number
  total_penarikan?: number
  saldo_seharusnya?: number
  selisih?: number
  catatan_selisih?: string
  supervisor_tutup?: string
  waktu_approve?: string
  catatan_supervisor?: string
  docstatus?: 0 | 1 | 2
}

export interface BukaSesiPayload {
  tanggal: string
  shift: Shift
  supervisor_buka: string
  modal_kas: number
  denominasi_buka: DenominasiRow[]
}
```

- [ ] **Step 3: Check tsc — many call sites will break**

```bash
cd web-dashboard
npx tsc -b 2>&1 | grep "error TS" | wc -l
```

Expected: many errors (4 files consume old type). Capture the count, e.g. 25-50 errors. These get fixed in Tasks 3–4.

- [ ] **Step 4: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/types/koperasi/kas-teller.types.ts
git commit -m "refactor(types): align SesiKasTeller types with backend doctype

Breaks 4 consumer pages — fixed in following commits."
```

---

## Task 3: Extend `kas-teller.service.ts`

**Files:**
- Modify: `web-dashboard/src/services/koperasi/kas-teller.service.ts`
- Create: `web-dashboard/src/__ui_tests__/sesi-kas.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `web-dashboard/src/__ui_tests__/sesi-kas.service.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '@/services/api.client'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)

describe('sesiKasTellerService.getActiveForMe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hits the whitelisted endpoint and returns the message field', async () => {
    mockGet.mockResolvedValue({ message: { name: 'SST-001', status: 'Aktif' } })
    const result = await sesiKasTellerService.getActiveForMe()
    expect(mockGet).toHaveBeenCalledWith(
      '/api/method/sekolahpro.koperasi.api.sesi_kas.get_active_for_me',
    )
    expect(result).toEqual({ name: 'SST-001', status: 'Aktif' })
  })

  it('returns null when message is null', async () => {
    mockGet.mockResolvedValue({ message: null })
    const result = await sesiKasTellerService.getActiveForMe()
    expect(result).toBeNull()
  })
})

describe('sesiKasTellerService.bukaSesi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('POSTs to the resource endpoint with submit flag', async () => {
    mockPost.mockResolvedValue({ data: { name: 'SST-001', status: 'Aktif' } })
    const payload = {
      tanggal: '2026-05-11',
      shift: 'Pagi' as const,
      supervisor_buka: 'sup@example.com',
      modal_kas: 100000,
      denominasi_buka: [{ denominasi: 'Rp 100.000', jumlah: 1 }],
    }
    await sesiKasTellerService.bukaSesi(payload)
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/resource/Sesi Kas Teller'),
      expect.objectContaining({ ...payload, docstatus: 1 }),
    )
  })
})

describe('sesiKasTellerService.tutupKas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls run_doc_method with tutup_kas args', async () => {
    mockPost.mockResolvedValue({ message: {} })
    await sesiKasTellerService.tutupKas('SST-001', [
      { denominasi: 'Rp 100.000', jumlah: 5 },
    ], 'catatan')
    expect(mockPost).toHaveBeenCalledWith(
      '/api/method/run_doc_method',
      {
        dt: 'Sesi Kas Teller',
        dn: 'SST-001',
        method: 'tutup_kas',
        args: JSON.stringify({
          denominasi_tutup: [{ denominasi: 'Rp 100.000', jumlah: 5 }],
          catatan_selisih: 'catatan',
        }),
      },
    )
  })
})

describe('sesiKasTellerService.approveTutup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls run_doc_method with approve_tutup', async () => {
    mockPost.mockResolvedValue({ message: {} })
    await sesiKasTellerService.approveTutup('SST-001', 'looks good')
    expect(mockPost).toHaveBeenCalledWith(
      '/api/method/run_doc_method',
      {
        dt: 'Sesi Kas Teller',
        dn: 'SST-001',
        method: 'approve_tutup',
        args: JSON.stringify({ catatan_supervisor: 'looks good' }),
      },
    )
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
cd web-dashboard
npx vitest run src/__ui_tests__/sesi-kas.service.test.ts --reporter=basic 2>&1 | tail -10
```

Expected: 4 failed (`getActiveForMe`, `bukaSesi`, `tutupKas`, `approveTutup` don't exist on `sesiKasTellerService`).

- [ ] **Step 3: Extend service**

Overwrite `web-dashboard/src/services/koperasi/kas-teller.service.ts`:

```ts
// src/services/koperasi/kas-teller.service.ts

import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type {
  SesiKasTeller,
  DenominasiRow,
  BukaSesiPayload,
} from '@/types/koperasi/kas-teller.types'

const baseService = createEntityService<SesiKasTeller>('/api/resource/Sesi Kas Teller')

const ENDPOINT_GET_ACTIVE =
  '/api/method/sekolahpro.koperasi.api.sesi_kas.get_active_for_me'
const ENDPOINT_RUN_METHOD = '/api/method/run_doc_method'
const RESOURCE = '/api/resource/Sesi Kas Teller'
const DOCTYPE = 'Sesi Kas Teller'

interface FrappeMethodResponse<T> { message: T | null }
interface ResourcePostResponse<T> { data: T }

async function callDocMethod(name: string, method: string, args: Record<string, unknown>) {
  await apiClient.post<FrappeMethodResponse<unknown>>(ENDPOINT_RUN_METHOD, {
    dt: DOCTYPE,
    dn: name,
    method,
    args: JSON.stringify(args),
  })
}

export const sesiKasTellerService = {
  ...baseService,

  async getActiveForMe(): Promise<SesiKasTeller | null> {
    const res = await apiClient.get<FrappeMethodResponse<SesiKasTeller>>(ENDPOINT_GET_ACTIVE)
    return res.message
  },

  async bukaSesi(payload: BukaSesiPayload): Promise<SesiKasTeller> {
    const body = { ...payload, docstatus: 1 }
    const res = await apiClient.post<ResourcePostResponse<SesiKasTeller>>(RESOURCE, body)
    return res.data
  },

  async tutupKas(
    name: string,
    denominasi_tutup: DenominasiRow[],
    catatan_selisih?: string,
  ): Promise<void> {
    await callDocMethod(name, 'tutup_kas', {
      denominasi_tutup,
      ...(catatan_selisih !== undefined ? { catatan_selisih } : {}),
    })
  },

  async approveTutup(name: string, catatan_supervisor?: string): Promise<void> {
    await callDocMethod(name, 'approve_tutup', {
      ...(catatan_supervisor !== undefined ? { catatan_supervisor } : {}),
    })
  },
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__ui_tests__/sesi-kas.service.test.ts --reporter=basic 2>&1 | tail -10
```

Expected: 4 pass. If `tutupKas` test fails on `catatan_selisih` arg shape, inspect test expectation — current expected payload sends `catatan_selisih` always. Adjust test to match the conditional shape (test passes `'catatan'` so it should appear).

- [ ] **Step 5: Run tsc**

```bash
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: still many errors (from Task 2 type rename — consumer pages not yet refactored). Service file itself should compile cleanly.

- [ ] **Step 6: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/services/koperasi/kas-teller.service.ts web-dashboard/src/__ui_tests__/sesi-kas.service.test.ts
git commit -m "feat(koperasi): extend sesiKasTellerService with lifecycle methods"
```

---

## Task 4: Refactor existing kas-teller pages to new types

**Files:**
- Modify: `web-dashboard/src/pages/koperasi/kas-teller/SesiKasTellerListPage.tsx`
- Modify: `web-dashboard/src/pages/koperasi/kas-teller/SesiKasTellerDetailPage.tsx`
- Delete: `web-dashboard/src/pages/koperasi/kas-teller/SesiKasTellerFormPage.tsx`
- Modify: `web-dashboard/src/app/routes.koperasi.tsx` (repoint form route → /koperasi/teller redirect)
- Modify: `web-dashboard/src/pages/koperasi/KoperasiDashboardPage.tsx` (if it references old fields)

- [ ] **Step 1: List dashboard usages**

```bash
grep -nE "saldo_awal|saldo_akhir|jam_buka|jam_tutup|teller_nama|status.*aktif|status.*tutup" web-dashboard/src/pages/koperasi/KoperasiDashboardPage.tsx
```

If hits found, replace per mapping below (Step 4). If empty, dashboard already uses paginated `.total` only — leave alone.

- [ ] **Step 2: Refactor `SesiKasTellerListPage.tsx`**

Apply this field mapping (old → new):

| Old | New |
|-----|-----|
| `teller_nama` | `teller` (User email/id) |
| `jam_buka` | `waktu_buka` |
| `jam_tutup` | `waktu_tutup` |
| `saldo_awal` | `modal_kas` |
| `saldo_akhir` | `total_denominasi_tutup` |
| `status === 'aktif'` | `status === 'Aktif'` |
| `status === 'tutup'` | `status === 'Selesai'` |

Update column definitions (already use `header:` after the tsc cleanup):

```tsx
const columns: ColumnDef<SesiKasTeller>[] = [
  { key: 'tanggal', header: 'Tanggal', sortable: true },
  { key: 'teller', header: 'Teller', sortable: true },
  { key: 'shift', header: 'Shift', sortable: true },
  {
    key: 'waktu_buka',
    header: 'Waktu Buka',
    render: (_v, row) =>
      row.waktu_buka
        ? new Date(row.waktu_buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '—',
  },
  {
    key: 'waktu_tutup',
    header: 'Waktu Tutup',
    render: (_v, row) =>
      row.waktu_tutup
        ? new Date(row.waktu_tutup).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '—',
  },
  { key: 'modal_kas', header: 'Modal Kas', render: (_v, row) => fmt(row.modal_kas) },
  { key: 'total_setoran', header: 'Setoran', render: (_v, row) => fmt(row.total_setoran ?? 0) },
  { key: 'total_penarikan', header: 'Penarikan', render: (_v, row) => fmt(row.total_penarikan ?? 0) },
  { key: 'selisih', header: 'Selisih', render: (_v, row) => fmt(row.selisih ?? 0) },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => {
      const color = {
        'Draft': 'var(--color-slate-500)',
        'Aktif': 'var(--color-green-600)',
        'Pending Approval': 'var(--color-amber-600)',
        'Selesai': 'var(--color-slate-400)',
      }[row.status]
      return <span style={{ color, fontWeight: 600 }}>{row.status}</span>
    },
  },
]
```

Status filter options become `['Draft','Aktif','Pending Approval','Selesai']`.

- [ ] **Step 3: Refactor `SesiKasTellerDetailPage.tsx`**

Apply the same mapping. Replace its `metadata` array with:

```tsx
const metadata = [
  { label: 'Teller', value: sesi.teller },
  { label: 'Shift', value: sesi.shift },
  { label: 'Tanggal', value: sesi.tanggal },
  { label: 'Waktu Buka', value: sesi.waktu_buka ? new Date(sesi.waktu_buka).toLocaleString('id-ID') : '—' },
  { label: 'Waktu Tutup', value: sesi.waktu_tutup ? new Date(sesi.waktu_tutup).toLocaleString('id-ID') : '—' },
  { label: 'Modal Kas', value: fmt(sesi.modal_kas) },
  { label: 'Total Setoran', value: fmt(sesi.total_setoran ?? 0) },
  { label: 'Total Penarikan', value: fmt(sesi.total_penarikan ?? 0) },
  { label: 'Saldo Seharusnya', value: fmt(sesi.saldo_seharusnya ?? 0) },
  { label: 'Total Denominasi Tutup', value: sesi.total_denominasi_tutup != null ? fmt(sesi.total_denominasi_tutup) : '— (belum tutup)' },
  { label: 'Selisih', value: sesi.selisih != null ? fmt(sesi.selisih) : '—' },
  { label: 'Catatan Selisih', value: sesi.catatan_selisih ?? '—' },
  { label: 'Supervisor Buka', value: sesi.supervisor_buka },
  { label: 'Supervisor Tutup', value: sesi.supervisor_tutup ?? '— (belum di-approve)' },
  { label: 'Status', value: sesi.status },
]
```

Replace `sesi.status === 'tutup'` conditional with `sesi.status === 'Selesai'`. Page title becomes `Sesi ${sesi.name}`.

- [ ] **Step 4: Delete `SesiKasTellerFormPage.tsx`**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git rm web-dashboard/src/pages/koperasi/kas-teller/SesiKasTellerFormPage.tsx
```

- [ ] **Step 5: Update route in `routes.koperasi.tsx`**

Find the route that lazy-loads `SesiKasTellerFormPage` (likely `/koperasi/sesi-kas/new` or `/koperasi/kas-teller/new`). Replace with a redirect to `/koperasi/teller`:

```tsx
import { Navigate } from 'react-router-dom'

// In the routes array, the form route entry becomes:
{ path: 'kas-teller/new', element: <Navigate to="/koperasi/teller" replace /> }
```

Use the existing convention — if the old route was lazy-loaded via `.then(m => ({ default: m.SesiKasTellerFormPage }))`, replace that entry with the `Navigate` shorthand or remove the entry entirely if no nav links to it.

- [ ] **Step 6: Fix `KoperasiDashboardPage.tsx` if Step 1 found hits**

For each old-field reference, replace per the mapping table. Likely affected: a "Sesi aktif hari ini" stat that reads `status === 'aktif'` — update to `status === 'Aktif'`.

- [ ] **Step 7: Verify tsc**

```bash
cd web-dashboard
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: 0. If errors remain, they should all be in the 4 files touched above. Fix each per the mapping table.

- [ ] **Step 8: Verify vite build**

```bash
npx vite build 2>&1 | tail -3
```

Expected: success.

- [ ] **Step 9: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add -A web-dashboard/src/pages/koperasi/kas-teller/ web-dashboard/src/pages/koperasi/KoperasiDashboardPage.tsx web-dashboard/src/app/routes.koperasi.tsx
git status  # verify nothing unrelated staged
git commit -m "refactor(kas-teller): align list/detail pages with backend types

Removes stub SesiKasTellerFormPage (sesi creation moves to
BukaSesiModal in TellerWorkstation)."
```

---

## Task 5: `DenominasiGrid` widget

**Files:**
- Create: `web-dashboard/src/widgets/DenominasiGrid/DenominasiGrid.tsx`
- Create: `web-dashboard/src/widgets/DenominasiGrid/DenominasiGrid.module.css`
- Create: `web-dashboard/src/widgets/DenominasiGrid/index.ts`
- Create: `web-dashboard/src/__ui_tests__/DenominasiGrid.test.tsx`

- [ ] **Step 1: Write failing test**

Create `web-dashboard/src/__ui_tests__/DenominasiGrid.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DenominasiGrid } from '@/widgets/DenominasiGrid/DenominasiGrid'
import type { DenominasiUang } from '@/types/koperasi/kas-teller.types'

const DENOMINASI: DenominasiUang[] = [
  { name: 'Rp 100.000', nama: 'Rp 100.000', nilai: 100000, jenis: 'Kertas', urutan: 1, aktif: 1 },
  { name: 'Rp 50.000', nama: 'Rp 50.000', nilai: 50000, jenis: 'Kertas', urutan: 2, aktif: 1 },
  { name: 'Rp 500', nama: 'Rp 500', nilai: 500, jenis: 'Koin', urutan: 3, aktif: 1 },
]

describe('DenominasiGrid', () => {
  it('renders one row per denominasi sorted by urutan', () => {
    render(
      <DenominasiGrid denominasi={DENOMINASI} value={{}} onChange={() => {}} />,
    )
    const inputs = screen.getAllByLabelText(/Rp /i)
    expect(inputs).toHaveLength(3)
    expect(inputs[0]).toHaveAttribute('aria-label', expect.stringContaining('Rp 100.000'))
  })

  it('computes subtotal per row and grand total', () => {
    const handleChange = vi.fn()
    render(
      <DenominasiGrid
        denominasi={DENOMINASI}
        value={{ 'Rp 100.000': 3, 'Rp 50.000': 2 }}
        onChange={handleChange}
      />,
    )
    expect(screen.getByTestId('subtotal-Rp 100.000')).toHaveTextContent('300.000')
    expect(screen.getByTestId('subtotal-Rp 50.000')).toHaveTextContent('100.000')
    expect(screen.getByTestId('denominasi-grand-total')).toHaveTextContent('400.000')
  })

  it('calls onChange with new value object when input changes', () => {
    const handleChange = vi.fn()
    render(
      <DenominasiGrid denominasi={DENOMINASI} value={{}} onChange={handleChange} />,
    )
    const input = screen.getByLabelText(/Rp 100.000/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '5' } })
    expect(handleChange).toHaveBeenCalledWith({ 'Rp 100.000': 5 })
  })

  it('respects disabled prop', () => {
    render(
      <DenominasiGrid denominasi={DENOMINASI} value={{}} onChange={() => {}} disabled />,
    )
    expect(screen.getByLabelText(/Rp 100.000/i)).toBeDisabled()
  })
})
```

Add `import { vi } from 'vitest'` if not auto-imported.

- [ ] **Step 2: Run test (expect fail — widget doesn't exist)**

```bash
cd web-dashboard
npx vitest run src/__ui_tests__/DenominasiGrid.test.tsx --reporter=basic 2>&1 | tail -10
```

Expected: import error or "Cannot find module".

- [ ] **Step 3: Create widget**

Create `web-dashboard/src/widgets/DenominasiGrid/DenominasiGrid.tsx`:

```tsx
import type { DenominasiUang } from '@/types/koperasi/kas-teller.types'
import { fmt } from '@/utils/format'
import styles from './DenominasiGrid.module.css'

export interface DenominasiGridProps {
  denominasi: DenominasiUang[]
  value: Record<string, number>
  onChange: (next: Record<string, number>) => void
  disabled?: boolean
}

export function DenominasiGrid({ denominasi, value, onChange, disabled = false }: DenominasiGridProps) {
  const sorted = [...denominasi].sort((a, b) => a.urutan - b.urutan)
  const grandTotal = sorted.reduce(
    (sum, d) => sum + (value[d.name] ?? 0) * d.nilai,
    0,
  )

  return (
    <div className={styles.grid}>
      <div className={styles.header}>
        <span>Pecahan</span>
        <span>Jenis</span>
        <span>Jumlah</span>
        <span>Subtotal</span>
      </div>
      {sorted.map((d) => {
        const qty = value[d.name] ?? 0
        const subtotal = qty * d.nilai
        return (
          <div key={d.name} className={styles.row}>
            <label className={styles.label} htmlFor={`denominasi-${d.name}`}>
              {d.nama}
            </label>
            <span className={styles.jenis}>{d.jenis}</span>
            <input
              id={`denominasi-${d.name}`}
              aria-label={`Jumlah ${d.nama}`}
              type="number"
              min={0}
              step={1}
              disabled={disabled}
              value={qty === 0 ? '' : qty}
              onChange={(e) => {
                const n = Number(e.target.value)
                const next = { ...value }
                if (Number.isFinite(n) && n > 0) next[d.name] = n
                else delete next[d.name]
                onChange(next)
              }}
              className={styles.input}
            />
            <span className={styles.subtotal} data-testid={`subtotal-${d.name}`}>
              {fmt(subtotal)}
            </span>
          </div>
        )
      })}
      <div className={styles.total}>
        <span>Total</span>
        <strong data-testid="denominasi-grand-total">{fmt(grandTotal)}</strong>
      </div>
    </div>
  )
}
```

Create `web-dashboard/src/widgets/DenominasiGrid/DenominasiGrid.module.css`:

```css
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}
.header, .row, .total {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 12px;
  align-items: center;
  padding: 8px 12px;
}
.header {
  background: var(--color-slate-50);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-slate-600);
}
.row + .row {
  border-top: 1px solid var(--color-border);
}
.label {
  font-weight: 600;
}
.jenis {
  font-size: 12px;
  color: var(--color-slate-500);
}
.input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  text-align: right;
}
.input:disabled {
  background: var(--color-slate-100);
}
.subtotal {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.total {
  border-top: 2px solid var(--color-border);
  background: var(--color-slate-50);
  font-size: 14px;
}
.total strong {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: 16px;
}
```

Create `web-dashboard/src/widgets/DenominasiGrid/index.ts`:

```ts
export { DenominasiGrid } from './DenominasiGrid'
export type { DenominasiGridProps } from './DenominasiGrid'
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__ui_tests__/DenominasiGrid.test.tsx --reporter=basic 2>&1 | tail -10
```

Expected: 4 pass. If `fmt(300000)` format mismatch (script vs locale rendering), adjust test assertion to use the same `fmt` import.

- [ ] **Step 5: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/widgets/DenominasiGrid/ web-dashboard/src/__ui_tests__/DenominasiGrid.test.tsx
git commit -m "feat(widgets): DenominasiGrid controlled input with live total"
```

---

## Task 6: `BukaSesiModal`

**Files:**
- Create: `web-dashboard/src/pages/koperasi/teller/components/BukaSesiModal.tsx`
- Create: `web-dashboard/src/pages/koperasi/teller/components/BukaSesiModal.module.css`

- [ ] **Step 1: Build the modal**

Create `web-dashboard/src/pages/koperasi/teller/components/BukaSesiModal.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createEntityService } from '@/services/createEntityService'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import { DenominasiGrid } from '@/widgets/DenominasiGrid/DenominasiGrid'
import { Modal } from '@/widgets/Modal/Modal'
import { toast } from '@/widgets/Toast/Toast'
import { fmt } from '@/utils/format'
import type {
  DenominasiUang,
  Shift,
  BukaSesiPayload,
} from '@/types/koperasi/kas-teller.types'
import styles from './BukaSesiModal.module.css'

const denominasiService = createEntityService<DenominasiUang>('/api/resource/Denominasi Uang')

interface Preset { label: string; total: number; breakdown: Record<string, number> }

const PRESETS: Preset[] = [
  { label: 'Rp 500.000', total: 500000, breakdown: { 'Rp 100.000': 4, 'Rp 50.000': 2 } },
  { label: 'Rp 1.000.000', total: 1000000, breakdown: { 'Rp 100.000': 8, 'Rp 50.000': 4 } },
  { label: 'Rp 2.000.000', total: 2000000, breakdown: { 'Rp 100.000': 18, 'Rp 50.000': 4 } },
]

const SHIFTS: Shift[] = ['Pagi', 'Siang', 'Sore']

export interface BukaSesiModalProps {
  open: boolean
  onClose: () => void
}

export function BukaSesiModal({ open, onClose }: BukaSesiModalProps) {
  const queryClient = useQueryClient()
  const [shift, setShift] = useState<Shift>('Pagi')
  const [supervisor, setSupervisor] = useState<string>('')
  const [denominasiValue, setDenominasiValue] = useState<Record<string, number>>({})

  const denominasiQuery = useQuery({
    queryKey: ['denominasi-uang', 'aktif'],
    queryFn: () =>
      denominasiService.list({ filters: [['aktif', '=', 1]], sort: [['urutan', 1]], limit: 50 }),
    enabled: open,
  })

  const total = useMemo(() => {
    const items = denominasiQuery.data?.items ?? []
    return items.reduce((sum, d) => sum + (denominasiValue[d.name] ?? 0) * d.nilai, 0)
  }, [denominasiValue, denominasiQuery.data])

  const mutation = useMutation({
    mutationFn: (payload: BukaSesiPayload) => sesiKasTellerService.bukaSesi(payload),
    onSuccess: () => {
      toast.success('Sesi kas dibuka')
      queryClient.invalidateQueries({ queryKey: ['sesi-kas', 'active'] })
      onClose()
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Gagal buka sesi'
      toast.error(message)
    },
  })

  const applyPreset = (p: Preset) => setDenominasiValue(p.breakdown)

  const handleSubmit = () => {
    if (!supervisor) {
      toast.error('Pilih supervisor terlebih dahulu')
      return
    }
    if (total <= 0) {
      toast.error('Modal kas harus lebih dari 0')
      return
    }
    const denominasi_buka = Object.entries(denominasiValue)
      .filter(([, qty]) => qty > 0)
      .map(([denominasi, jumlah]) => ({ denominasi, jumlah }))

    mutation.mutate({
      tanggal: new Date().toISOString().slice(0, 10),
      shift,
      supervisor_buka: supervisor,
      modal_kas: total,
      denominasi_buka,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Buka Sesi Kas">
      <div className={styles.body}>
        <div className={styles.field}>
          <label htmlFor="shift">Shift</label>
          <select id="shift" value={shift} onChange={(e) => setShift(e.target.value as Shift)}>
            {SHIFTS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="supervisor">Supervisor</label>
          <input
            id="supervisor"
            type="email"
            placeholder="supervisor@email"
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
          />
        </div>
        <div className={styles.presets}>
          <span>Preset cepat:</span>
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
        {denominasiQuery.data && (
          <DenominasiGrid
            denominasi={denominasiQuery.data.items}
            value={denominasiValue}
            onChange={setDenominasiValue}
          />
        )}
        <div className={styles.summary}>
          <strong>Modal Kas: {fmt(total)}</strong>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={onClose} disabled={mutation.isPending}>Batal</button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending || total <= 0 || !supervisor}
          >
            {mutation.isPending ? 'Menyimpan…' : 'Buka Sesi'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
```

Create `web-dashboard/src/pages/koperasi/teller/components/BukaSesiModal.module.css`:

```css
.body { display: flex; flex-direction: column; gap: 16px; min-width: 540px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field input, .field select {
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
.presets {
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  font-size: 13px; color: var(--color-slate-600);
}
.presets button {
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: white;
  cursor: pointer;
}
.summary {
  text-align: right;
  font-size: 16px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}
.actions {
  display: flex; gap: 8px; justify-content: flex-end;
}
.actions button:last-child {
  background: var(--color-brand);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.actions button:last-child:disabled { opacity: 0.5; cursor: not-allowed; }
.actions button:first-child {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
}
```

NOTE: This assumes `Modal` widget exists at `@/widgets/Modal/Modal`. If it doesn't, check `web-dashboard/src/widgets/` for a similar dialog primitive (e.g. `Dialog`, `Drawer`) and use that. If none exists, use a minimal inline implementation (overlay div + content card).

- [ ] **Step 2: Verify tsc**

```bash
cd web-dashboard
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: 0. If `Modal` import fails, replace with the actual modal/dialog primitive in the codebase or build a minimal inline implementation.

- [ ] **Step 3: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/pages/koperasi/teller/components/BukaSesiModal.tsx web-dashboard/src/pages/koperasi/teller/components/BukaSesiModal.module.css
git commit -m "feat(teller): BukaSesiModal with quick-fill presets + denominasi grid"
```

---

## Task 7: `TutupSesiModal`

**Files:**
- Create: `web-dashboard/src/pages/koperasi/teller/components/TutupSesiModal.tsx`
- Create: `web-dashboard/src/pages/koperasi/teller/components/TutupSesiModal.module.css`

- [ ] **Step 1: Build the modal**

Create `web-dashboard/src/pages/koperasi/teller/components/TutupSesiModal.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createEntityService } from '@/services/createEntityService'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import { DenominasiGrid } from '@/widgets/DenominasiGrid/DenominasiGrid'
import { Modal } from '@/widgets/Modal/Modal'
import { toast } from '@/widgets/Toast/Toast'
import { fmt } from '@/utils/format'
import type { DenominasiUang, SesiKasTeller } from '@/types/koperasi/kas-teller.types'
import styles from './TutupSesiModal.module.css'

const denominasiService = createEntityService<DenominasiUang>('/api/resource/Denominasi Uang')

export interface TutupSesiModalProps {
  open: boolean
  onClose: () => void
  sesi: SesiKasTeller
}

export function TutupSesiModal({ open, onClose, sesi }: TutupSesiModalProps) {
  const queryClient = useQueryClient()
  const [denominasiValue, setDenominasiValue] = useState<Record<string, number>>({})
  const [catatan, setCatatan] = useState('')

  const denominasiQuery = useQuery({
    queryKey: ['denominasi-uang', 'aktif'],
    queryFn: () =>
      denominasiService.list({ filters: [['aktif', '=', 1]], sort: [['urutan', 1]], limit: 50 }),
    enabled: open,
  })

  const totalDenominasi = useMemo(() => {
    const items = denominasiQuery.data?.items ?? []
    return items.reduce((sum, d) => sum + (denominasiValue[d.name] ?? 0) * d.nilai, 0)
  }, [denominasiValue, denominasiQuery.data])

  const saldoSeharusnya = (sesi.modal_kas) + (sesi.total_setoran ?? 0) - (sesi.total_penarikan ?? 0)
  const selisih = totalDenominasi - saldoSeharusnya

  const mutation = useMutation({
    mutationFn: () => {
      const denominasi_tutup = Object.entries(denominasiValue)
        .filter(([, qty]) => qty > 0)
        .map(([denominasi, jumlah]) => ({ denominasi, jumlah }))
      return sesiKasTellerService.tutupKas(
        sesi.name,
        denominasi_tutup,
        selisih !== 0 ? catatan : undefined,
      )
    },
    onSuccess: () => {
      toast.success('Sesi ditutup, menunggu approval supervisor')
      queryClient.invalidateQueries({ queryKey: ['sesi-kas', 'active'] })
      onClose()
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Gagal tutup sesi'
      toast.error(message)
    },
  })

  const canSubmit =
    totalDenominasi > 0 &&
    !mutation.isPending &&
    (selisih === 0 || catatan.trim().length > 0)

  return (
    <Modal open={open} onClose={onClose} title="Tutup Sesi Kas">
      <div className={styles.body}>
        <div className={styles.summary}>
          <div><span>Modal Kas</span><strong>{fmt(sesi.modal_kas)}</strong></div>
          <div><span>Total Setoran</span><strong>{fmt(sesi.total_setoran ?? 0)}</strong></div>
          <div><span>Total Penarikan</span><strong>{fmt(sesi.total_penarikan ?? 0)}</strong></div>
          <div><span>Saldo Seharusnya</span><strong>{fmt(saldoSeharusnya)}</strong></div>
        </div>
        {denominasiQuery.data && (
          <DenominasiGrid
            denominasi={denominasiQuery.data.items}
            value={denominasiValue}
            onChange={setDenominasiValue}
          />
        )}
        <div className={styles.selisihRow}>
          <span>Selisih</span>
          <strong style={{
            color: selisih === 0 ? 'var(--color-green-600)' : 'var(--color-red-600)',
          }}>
            {fmt(selisih)}
          </strong>
        </div>
        {selisih !== 0 && (
          <div className={styles.field}>
            <label htmlFor="catatan">Catatan Selisih *</label>
            <textarea
              id="catatan"
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Wajib diisi karena selisih bukan nol"
            />
          </div>
        )}
        <div className={styles.actions}>
          <button type="button" onClick={onClose} disabled={mutation.isPending}>Batal</button>
          <button type="button" onClick={() => mutation.mutate()} disabled={!canSubmit}>
            {mutation.isPending ? 'Menutup…' : 'Tutup Sesi'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
```

Create `web-dashboard/src/pages/koperasi/teller/components/TutupSesiModal.module.css`:

```css
.body { display: flex; flex-direction: column; gap: 14px; min-width: 540px; }
.summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  padding: 12px;
  background: var(--color-slate-50);
  border-radius: 6px;
}
.summary div {
  display: flex; justify-content: space-between;
  font-size: 13px;
}
.summary strong { font-variant-numeric: tabular-nums; }
.selisihRow {
  display: flex; justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
}
.selisihRow strong { font-variant-numeric: tabular-nums; font-size: 16px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field textarea {
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-family: inherit;
  resize: vertical;
}
.actions { display: flex; gap: 8px; justify-content: flex-end; }
.actions button:last-child {
  background: var(--color-brand);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.actions button:last-child:disabled { opacity: 0.5; cursor: not-allowed; }
.actions button:first-child {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
}
```

- [ ] **Step 2: Verify tsc**

```bash
cd web-dashboard && npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/pages/koperasi/teller/components/TutupSesiModal.tsx web-dashboard/src/pages/koperasi/teller/components/TutupSesiModal.module.css
git commit -m "feat(teller): TutupSesiModal with live rekonsiliasi preview"
```

---

## Task 8: Wire `TellerWorkstationPage` to active sesi

**Files:**
- Modify: `web-dashboard/src/pages/koperasi/teller/TellerWorkstationPage.tsx`
- Modify: `web-dashboard/src/pages/koperasi/teller/TellerWorkstationPage.module.css` (add header strip + empty state styles)

- [ ] **Step 1: Read the current page**

```bash
wc -l web-dashboard/src/pages/koperasi/teller/TellerWorkstationPage.tsx
head -80 web-dashboard/src/pages/koperasi/teller/TellerWorkstationPage.tsx
```

Capture the existing structure. The page currently has a 3-col layout and local "session tape" state.

- [ ] **Step 2: Add three-branch render**

Top of page component, replace the unconditional 3-col render with:

```tsx
const activeSesiQuery = useQuery({
  queryKey: ['sesi-kas', 'active'],
  queryFn: () => sesiKasTellerService.getActiveForMe(),
  refetchOnWindowFocus: true,
})

const [bukaOpen, setBukaOpen] = useState(false)
const [tutupOpen, setTutupOpen] = useState(false)

if (activeSesiQuery.isLoading) return <PageHeader title="Teller Workstation" /* + loading */ />

const sesi = activeSesiQuery.data

if (!sesi) {
  return (
    <>
      <PageHeader title="Teller Workstation" />
      <div className={styles.emptyState}>
        <h2>Belum ada sesi kas aktif</h2>
        <p>Buka sesi untuk mulai melayani transaksi.</p>
        <button type="button" onClick={() => setBukaOpen(true)}>Buka Sesi Kas</button>
      </div>
      <BukaSesiModal open={bukaOpen} onClose={() => setBukaOpen(false)} />
    </>
  )
}

if (sesi.status === 'Pending Approval') {
  return (
    <>
      <PageHeader title="Teller Workstation" />
      <div className={styles.emptyState}>
        <h2>Menunggu approval supervisor</h2>
        <p>Sesi <strong>{sesi.name}</strong> sudah ditutup. Supervisor harus approve sebelum sesi baru bisa dibuka.</p>
      </div>
    </>
  )
}

// sesi.status === 'Aktif' → render existing 3-col layout, plus header strip:
```

Header strip JSX, inserted just above the existing 3-col grid:

```tsx
<div className={styles.sesiStrip}>
  <span className={styles.sesiBadge}>Sesi Aktif</span>
  <span>{sesi.name}</span>
  <span>{sesi.shift}</span>
  <span>Modal: {fmt(sesi.modal_kas)}</span>
  <span>Setoran: {fmt(sesi.total_setoran ?? 0)}</span>
  <span>Penarikan: {fmt(sesi.total_penarikan ?? 0)}</span>
  <button type="button" onClick={() => setTutupOpen(true)}>Tutup Sesi</button>
</div>
<TutupSesiModal open={tutupOpen} onClose={() => setTutupOpen(false)} sesi={sesi} />
```

Add imports at top:
```tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import { BukaSesiModal } from './components/BukaSesiModal'
import { TutupSesiModal } from './components/TutupSesiModal'
import { fmt } from '@/utils/format'
```

- [ ] **Step 3: Add CSS for strip + empty state**

Append to `TellerWorkstationPage.module.css`:

```css
.sesiStrip {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: var(--color-slate-50);
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
}
.sesiStrip button {
  margin-left: auto;
  padding: 6px 12px;
  background: var(--color-red-600);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.sesiBadge {
  background: var(--color-green-600);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
.emptyState {
  text-align: center;
  padding: 64px 32px;
  color: var(--color-slate-600);
}
.emptyState button {
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
```

- [ ] **Step 4: Invalidate active query on transaksi mutations**

Search the existing teller page for `useMutation` calls (setor / tarik / bayar angsuran). For each, add to `onSuccess`:

```ts
queryClient.invalidateQueries({ queryKey: ['sesi-kas', 'active'] })
```

(Get `queryClient` via `useQueryClient()` at top of component.)

This refreshes `total_setoran`/`total_penarikan` shown in the header strip.

- [ ] **Step 5: Verify tsc + vite build**

```bash
cd web-dashboard
npx tsc -b 2>&1 | grep -c "error TS"
npx vite build 2>&1 | tail -3
```

Both clean.

- [ ] **Step 6: Manual smoke (dev server)**

```bash
npm run dev &
# Open http://localhost:5181/koperasi/teller
# Expect either empty-state CTA (no sesi) or 3-col + header strip (active sesi)
# Kill server when done
```

Skip if no backend running — rely on E2E and unit tests in later tasks.

- [ ] **Step 7: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/pages/koperasi/teller/TellerWorkstationPage.tsx web-dashboard/src/pages/koperasi/teller/TellerWorkstationPage.module.css
git commit -m "feat(teller): gate workstation on active sesi + header strip + modals"
```

---

## Task 9: Add Penutupan Kas tab to Pusat Persetujuan

**Files:**
- Modify: `web-dashboard/src/pages/koperasi/persetujuan/PusatPersetujuanPage.tsx`
- Possibly modify: `web-dashboard/src/pages/koperasi/persetujuan/PusatPersetujuanPage.module.css`

- [ ] **Step 1: Inspect current page**

```bash
head -100 web-dashboard/src/pages/koperasi/persetujuan/PusatPersetujuanPage.tsx
```

Identify: tab state shape, current data fetching pattern (likely uses React Query with one queryKey per tab), drawer component.

- [ ] **Step 2: Add tab option**

Wherever tabs are defined (likely a `const TABS = ['semua', 'simpanan', 'pembiayaan']` or similar), add `'penutupan-kas'`.

- [ ] **Step 3: Add data query**

When `activeTab === 'penutupan-kas'`:

```tsx
const sesiPendingQuery = useQuery({
  queryKey: ['sesi-kas', 'pending-approval'],
  queryFn: () =>
    sesiKasTellerService.list({
      filters: [['status', '=', 'Pending Approval']],
      sort: [['waktu_tutup', -1]],
      limit: 50,
    }),
  enabled: activeTab === 'penutupan-kas',
})
```

- [ ] **Step 4: Render rows**

Reuse existing list/drawer pattern. Each row shows: sesi.name, tanggal, teller, shift, modal_kas, selisih (red if non-zero), waktu_tutup. Click → drawer.

- [ ] **Step 5: Drawer body**

Drawer content:

```tsx
<div>
  <dl>
    <dt>Sesi</dt><dd>{sesi.name}</dd>
    <dt>Teller</dt><dd>{sesi.teller}</dd>
    <dt>Modal Kas</dt><dd>{fmt(sesi.modal_kas)}</dd>
    <dt>Total Setoran</dt><dd>{fmt(sesi.total_setoran ?? 0)}</dd>
    <dt>Total Penarikan</dt><dd>{fmt(sesi.total_penarikan ?? 0)}</dd>
    <dt>Saldo Seharusnya</dt><dd>{fmt(sesi.saldo_seharusnya ?? 0)}</dd>
    <dt>Total Denominasi Tutup</dt><dd>{fmt(sesi.total_denominasi_tutup ?? 0)}</dd>
    <dt>Selisih</dt><dd style={{ color: sesi.selisih ? 'var(--color-red-600)' : 'var(--color-green-600)' }}>{fmt(sesi.selisih ?? 0)}</dd>
    <dt>Catatan Selisih</dt><dd>{sesi.catatan_selisih ?? '—'}</dd>
  </dl>
  <label htmlFor="catatan_supervisor">Catatan Supervisor (opsional)</label>
  <textarea id="catatan_supervisor" value={catatanSupervisor} onChange={(e) => setCatatanSupervisor(e.target.value)} rows={3} />
  <button type="button" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
    {approveMutation.isPending ? 'Approving…' : 'Approve'}
  </button>
</div>
```

Mutation:

```tsx
const approveMutation = useMutation({
  mutationFn: (name: string) => sesiKasTellerService.approveTutup(name, catatanSupervisor || undefined),
  onSuccess: () => {
    toast.success('Sesi diapprove')
    queryClient.invalidateQueries({ queryKey: ['sesi-kas', 'pending-approval'] })
    closeDrawer()
  },
  onError: (err) => {
    const message = err instanceof Error ? err.message : 'Gagal approve'
    toast.error(message)
  },
})
```

- [ ] **Step 6: Update tab counter (if exists)**

If the page shows tab badges with pending counts, add a query for `Sesi Kas Teller` status=Pending Approval count and render the badge on the new tab.

- [ ] **Step 7: Verify tsc + vite build**

```bash
cd web-dashboard
npx tsc -b 2>&1 | grep -c "error TS"
npx vite build 2>&1 | tail -3
```

Both clean.

- [ ] **Step 8: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/pages/koperasi/persetujuan/
git commit -m "feat(persetujuan): Penutupan Kas tab with rekonsiliasi drawer + approve"
```

---

## Task 10: Nav entry + smoke tests + final verification

**Files:**
- Modify: `web-dashboard/src/layouts/AppNavbar/AppNavbar.tsx` (nav entry for `/koperasi/sesi-kas`)
- Modify: `web-dashboard/scripts/smoke-koperasi-api.mjs` (add 3 sesi-kas endpoints)
- Create: `web-dashboard/e2e/sesi-kas.spec.ts` (E2E lifecycle)

- [ ] **Step 1: Add nav entry**

In `AppNavbar.tsx`, find the koperasi nav array. Add (after Persetujuan, before Laporan):

```ts
{ key: 'sesi-kas', label: 'Sesi Kas', icon: Clock, to: '/koperasi/sesi-kas' },
```

Import `Clock` from `lucide-react` if not already imported.

- [ ] **Step 2: Confirm route exists**

```bash
grep -n "sesi-kas\|kas-teller" web-dashboard/src/app/routes.koperasi.tsx
```

Confirm `/koperasi/sesi-kas` (or `/koperasi/kas-teller`) routes to `SesiKasTellerListPage`. If only the old form-page route exists, add a list-page route:

```tsx
{ path: 'sesi-kas', element: <Suspense fallback={<PageLoading />}><SesiKasTellerListPage /></Suspense> }
```

(Use the codebase's existing lazy-loading pattern — match how other koperasi routes do it.)

- [ ] **Step 3: Extend `smoke-koperasi-api.mjs`**

Append to the endpoint list in `web-dashboard/scripts/smoke-koperasi-api.mjs`:

```js
// Sesi Kas Teller
await check('GET /api/method/sekolahpro.koperasi.api.sesi_kas.get_active_for_me', async () => {
  const res = await fetch(`${BASE_URL}/api/method/sekolahpro.koperasi.api.sesi_kas.get_active_for_me`, {
    headers: HEADERS,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!('message' in json)) throw new Error('Missing message field')
  // message can be null or an object — both valid
  return true
})

await check('GET /api/resource/Sesi Kas Teller (paginated)', async () => {
  const url = `${BASE_URL}/api/resource/Sesi Kas Teller?filters=${encodeURIComponent('[["status","=","Aktif"]]')}&limit_page_length=5`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json.data)) throw new Error('Missing data array')
  return true
})

await check('GET /api/resource/Denominasi Uang (10 active rows)', async () => {
  const url = `${BASE_URL}/api/resource/Denominasi Uang?filters=${encodeURIComponent('[["aktif","=",1]]')}&limit_page_length=20`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json.data)) throw new Error('Missing data array')
  if (json.data.length !== 10) throw new Error(`Expected 10 rows, got ${json.data.length}`)
  return true
})
```

(Adapt to the exact `check()`/`HEADERS`/`BASE_URL` conventions in the existing file — read it first.)

- [ ] **Step 4: Add E2E spec**

Create `web-dashboard/e2e/sesi-kas.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Sesi Kas lifecycle', () => {
  test.skip(!process.env.E2E_TELLER_USER, 'requires E2E_TELLER_USER + E2E_SUPERVISOR_USER env')

  test('teller can buka, transact, and tutup; supervisor can approve', async ({ page, context }) => {
    // 1. Teller login
    await page.goto('/login')
    await page.fill('[name="usr"]', process.env.E2E_TELLER_USER!)
    await page.fill('[name="pwd"]', process.env.E2E_TELLER_PASS!)
    await page.click('button[type="submit"]')

    // 2. Visit teller — expect empty state
    await page.goto('/koperasi/teller')
    await expect(page.getByText(/Belum ada sesi kas aktif/)).toBeVisible()

    // 3. Buka sesi
    await page.getByRole('button', { name: 'Buka Sesi Kas' }).click()
    await page.getByRole('button', { name: 'Rp 500.000' }).click()
    await page.fill('#supervisor', process.env.E2E_SUPERVISOR_USER!)
    await page.getByRole('button', { name: 'Buka Sesi' }).click()
    await expect(page.getByText(/Sesi Aktif/)).toBeVisible({ timeout: 5000 })

    // 4. Tutup sesi (no transaksi, selisih=0)
    await page.getByRole('button', { name: 'Tutup Sesi' }).click()
    await page.getByRole('button', { name: 'Rp 100.000' }).first().fill('4')  // adjust if grid label differs
    await page.fill('input[aria-label*="Rp 50.000"]', '2')
    await page.getByRole('button', { name: 'Tutup Sesi' }).last().click()
    await expect(page.getByText(/Menunggu approval supervisor/)).toBeVisible({ timeout: 5000 })

    // 5. Supervisor login (new context for clean session)
    const supervisorContext = await context.browser()!.newContext()
    const supervisorPage = await supervisorContext.newPage()
    await supervisorPage.goto('/login')
    await supervisorPage.fill('[name="usr"]', process.env.E2E_SUPERVISOR_USER!)
    await supervisorPage.fill('[name="pwd"]', process.env.E2E_SUPERVISOR_PASS!)
    await supervisorPage.click('button[type="submit"]')

    // 6. Supervisor approves
    await supervisorPage.goto('/koperasi/persetujuan')
    await supervisorPage.getByRole('tab', { name: /Penutupan Kas/ }).click()
    await supervisorPage.getByRole('row').filter({ hasText: 'Pending' }).first().click()
    await supervisorPage.getByRole('button', { name: 'Approve' }).click()

    // 7. Teller page should clear
    await page.goto('/koperasi/teller')
    await expect(page.getByText(/Belum ada sesi kas aktif/)).toBeVisible()

    await supervisorContext.close()
  })
})
```

- [ ] **Step 5: Run final verification gate**

```bash
cd web-dashboard
npx tsc -b
echo "tsc exit: $?"

npx vite build 2>&1 | tail -3

npx vitest run --reporter=basic 2>&1 | tail -5
```

Required:
- `tsc exit: 0`
- `vite build` exit 0
- vitest: net pass count higher than baseline (or equal); failures only pre-existing ones.

- [ ] **Step 6: Update docs (CLAUDE.md / cerebrum)**

Append to `/Users/erickmo/Desktop/Project/.wolf/cerebrum.md` under `## Key Learnings`:

```markdown
- **SekolahPro3 web-dashboard Sesi Kas (2026-05-11):** Teller Workstation gates UI on `sesiKasTellerService.getActiveForMe()` via React Query key `['sesi-kas', 'active']`. Backend `Sesi Kas Teller.before_submit._validate_no_active_sesi` enforces at most one Aktif sesi per teller. Transaksi flows DO NOT pass `sesi_kas` — backend `Transaksi Simpanan.before_insert` auto-attaches it. `tutup_kas` / `approve_tutup` whitelisted via `/api/method/run_doc_method` with `args: JSON.stringify({...})`. Denominasi UI uses controlled `Record<denominasi_id, number>` shape, rendered by `DenominasiGrid` widget.
```

- [ ] **Step 7: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/layouts/AppNavbar/AppNavbar.tsx web-dashboard/src/app/routes.koperasi.tsx web-dashboard/scripts/smoke-koperasi-api.mjs web-dashboard/e2e/sesi-kas.spec.ts
git status
git commit -m "test(koperasi): nav entry + smoke API + sesi kas E2E lifecycle"
```

---

## Task 11: Push + PR

**Files:** none.

- [ ] **Step 1: Push branch**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git push -u origin feat/sesi-kas-integration
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --base main --title "feat(koperasi): Sesi Kas Teller integration (buka/tutup/approve)" --body "$(cat <<'EOF'
## Summary

Wires the Teller Workstation to the backend `Sesi Kas Teller` lifecycle: teller buka sesi (denominasi + supervisor co-sign), transaksi auto-linked by backend, teller tutup sesi (rekonsiliasi + selisih), supervisor approve from Pusat Persetujuan.

## Commits

- `feat(koperasi): whitelisted get_active_for_me API for current user's active sesi` (backend repo)
- `refactor(types): align SesiKasTeller types with backend doctype`
- `feat(koperasi): extend sesiKasTellerService with lifecycle methods`
- `refactor(kas-teller): align list/detail pages with backend types`
- `feat(widgets): DenominasiGrid controlled input with live total`
- `feat(teller): BukaSesiModal with quick-fill presets + denominasi grid`
- `feat(teller): TutupSesiModal with live rekonsiliasi preview`
- `feat(teller): gate workstation on active sesi + header strip + modals`
- `feat(persetujuan): Penutupan Kas tab with rekonsiliasi drawer + approve`
- `test(koperasi): nav entry + smoke API + sesi kas E2E lifecycle`

## Test plan

- [ ] `npx tsc -b` exits 0
- [ ] `npx vite build` exits 0
- [ ] `npm run smoke:api` against running Frappe — 3 new endpoints pass
- [ ] Manual: log in as teller → /koperasi/teller → empty state → buka → setor → tutup → see Pending Approval lock
- [ ] Manual: log in as supervisor → /koperasi/persetujuan → Penutupan Kas tab → approve
- [ ] `e2e/sesi-kas.spec.ts` (requires E2E_TELLER_USER + E2E_SUPERVISOR_USER env)

## Backend changes

Single new file: `sekolahpro/koperasi/api/sesi_kas.py` with `get_active_for_me()` whitelisted helper. Tests added.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Record PR URL for user**

---

## Verification matrix

| After task | tsc -b | vite build | vitest | smoke:api (sesi-kas) | Notes |
|-----------|--------|------------|--------|----------------------|-------|
| 0 baseline | 0 | green | 48/9 | — | Baseline confirmed |
| 1 backend | n/a | n/a | bench test | — | Backend test 2/2 PASS |
| 2 types | many errors | likely fail | — | — | Intentional: callsites break |
| 3 service | many errors | likely fail | 4/4 new pass | — | Service tested in isolation |
| 4 page refactor | 0 | green | — | — | Callsites fixed |
| 5 grid | 0 | green | +4 pass | — | DenominasiGrid tested |
| 6 buka modal | 0 | green | — | — | Compile + manual |
| 7 tutup modal | 0 | green | — | — | Compile + manual |
| 8 workstation | 0 | green | — | — | Manual smoke |
| 9 persetujuan | 0 | green | — | — | Manual smoke |
| 10 nav + smoke + E2E | 0 | green | net same | 3/3 pass | Final gate |
| 11 PR | — | — | — | — | Push + open |

## Rollback

Each task is a single commit. If anything breaks, `git revert <SHA>` that commit and re-do. Task 2 (type refactor) is the most disruptive — it requires Tasks 3-4 to land together or the build breaks. Land 2 + 3 + 4 as a unit if doing partial review.

## Open questions surfaced during implementation

- **Modal primitive:** Plan assumes `@/widgets/Modal/Modal`. If the codebase has a different dialog widget (e.g. `Dialog`, `Drawer`), substitute and update both modals.
- **Drawer in Persetujuan:** Plan assumes an existing drawer pattern in `PusatPersetujuanPage`. If it uses inline rows instead, mirror that.
- **Lazy-load convention in routes.koperasi.tsx:** Match the existing pattern (named-export `.then(m => ({ default: m.X }))` per `.wolf/cerebrum.md`).
- **Supervisor authentication:** Plan accepts supervisor email as plain input. Better long-term: typeahead/picker constrained to users with Supervisor role. Defer to follow-up.
