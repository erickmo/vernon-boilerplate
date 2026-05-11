# Sesi Kas Teller Integration — web-dashboard

**Date:** 2026-05-11
**Scope:** Full lifecycle Sesi Kas Teller wiring on `/koperasi/teller` + `/koperasi/persetujuan` + new history page.
**Backend:** `sekolahpro/koperasi/doctype/sesi_kas_teller/` (exists) + new `sekolahpro/koperasi/api/sesi_kas.py` (one whitelisted helper).

## Context

Teller Workstation MVP (PR #7) ships a 3-column UI (member search · action tabs · session tape) where the session tape is local React state. Cash session lifecycle is not wired:

- Teller cannot open a shift with a starting cash count.
- Transactions are not linked to a `Sesi Kas Teller`.
- Teller cannot close the shift with an ending cash count and reconciliation.
- Supervisor has no approval surface for closures.

Backend already has full domain logic: `Sesi Kas Teller` doctype with `tutup_kas` and `approve_tutup` whitelisted methods, `Transaksi Simpanan.before_insert` auto-attaches `sesi_kas` from `_get_active_sesi(user)`, and a `Denominasi Uang` fixture exists (10 IDR denominations).

This spec wires the frontend to that backend.

## State Machine

```
Draft ──(POST + submit)──> Aktif ──(tutup_kas)──> Pending Approval ──(approve_tutup)──> Selesai
```

Backend `on_submit` sets status=Aktif immediately on insert. There is no "Pembukaan Kas approval" state — supervisor_buka is recorded but does not gate the transition. Physical co-sign happens off-system.

## Entry Points

| Role | Page | Action |
|------|------|--------|
| Teller | `/koperasi/teller` (existing) | Buka sesi modal · transaksi (auto-linked by backend) · Tutup sesi modal |
| Supervisor | `/koperasi/persetujuan` (existing) — new tab "Penutupan Kas" | Review rekonsiliasi + selisih, `approve_tutup` |
| Anyone with read perm | `/koperasi/sesi-kas` (new) | History list, filterable by status/tanggal/teller |

## Backend Additions

**One new file:** `sekolahpro/koperasi/api/sesi_kas.py`

```python
import frappe
from sekolahpro.koperasi.doctype.transaksi_simpanan.transaksi_simpanan import _get_active_sesi


@frappe.whitelist()
def get_active_for_me():
    """Return the active Sesi Kas Teller for the logged-in user, or None."""
    name = _get_active_sesi(frappe.session.user)
    if not name:
        return None
    return frappe.get_doc("Sesi Kas Teller", name).as_dict()
```

That's the only backend change. Everything else uses standard Frappe `/api/resource` and `/api/method/run_doc_method` patterns.

## Frontend Files

### Extended service

`src/services/koperasi/kas-teller.service.ts` already exists with a stub `sesiKasTellerService = createEntityService<SesiKasTeller>(...)`. Extend it (keep filename + service export name) — do not create a new file.

**Replace existing types** in `src/types/koperasi/kas-teller.types.ts` (currently stub-mock types that don't match backend). Existing consumers (`SesiKasTellerListPage`, `SesiKasTellerDetailPage`, `SesiKasTellerFormPage`, `KoperasiDashboardPage`) need to be refactored to the new shape. The stub `SesiKasTellerFormPage` is removed (sesi creation moves to BukaSesiModal in TellerWorkstation); its route is repointed to redirect to teller.

```ts
export interface SesiKasTeller { /* mirrors backend doctype */ }
export interface DenominasiRow {
  denominasi: string  // FK to Denominasi Uang
  nilai: number
  jumlah: number
  subtotal: number
}

export const sesiKasService = {
  getActiveForMe(): Promise<SesiKasTeller | null>
  bukaSesi(payload: BukaSesiPayload): Promise<SesiKasTeller>
  tutupKas(name: string, denominasi_tutup: DenominasiRow[], catatan_selisih?: string): Promise<void>
  approveTutup(name: string, catatan_supervisor?: string): Promise<void>
  list(filters?: FilterTuple[], sort?: SortTuple[]): Promise<PaginatedResponse<SesiKasTeller>>
}
```

Uses existing `apiClient`. Method calls go through `/api/method/run_doc_method`.

### New widgets

`src/widgets/DenominasiGrid/`
- `DenominasiGrid.tsx` — controlled 10-row IDR grid. Props: `value: Record<string, number>`, `onChange`, `denominasi: DenominasiUang[]`, `disabled?: boolean`. Calculates total live.
- `DenominasiGrid.module.css`
- `DenominasiGrid.test.tsx`

`src/widgets/SesiKasBadge/SesiKasBadge.tsx` — small status pill (Draft/Aktif/Pending/Selesai with color). Reused in teller header + persetujuan list + sesi-kas list.

### New modals

`src/pages/koperasi/teller/components/BukaSesiModal.tsx`
- Picks shift (Pagi/Siang/Sore — match backend enum)
- Picks supervisor_buka (Link search User with Supervisor role)
- Three quick-fill preset buttons: Rp 500.000 · Rp 1.000.000 · Rp 2.000.000 (auto-fill grid with common breakdowns; user adjusts)
- Embedded `DenominasiGrid` (denominasi_buka)
- Total auto-calculated, must equal `modal_kas` (read-only mirror)
- Submit → `sesiKasService.bukaSesi()` → success toast → invalidate React Query `['sesi-kas', 'active']`

`src/pages/koperasi/teller/components/TutupSesiModal.tsx`
- Header shows: sesi_id, modal_kas, total_setoran (from server), total_penarikan (from server), saldo_seharusnya (calculated by backend in `_calculate_rekonsiliasi`)
- Embedded `DenominasiGrid` (denominasi_tutup)
- Live preview: `selisih = total_denominasi_tutup - saldo_seharusnya` shown with red/green pill
- If `selisih !== 0` → `catatan_selisih` textarea becomes required
- Submit → `sesiKasService.tutupKas()` → success toast → invalidate React Query → close modal → teller UI shows "Pending Approval" empty state until supervisor approves

### New page

`src/pages/koperasi/sesi-kas/SesiKasListPage.tsx`
- ListPageTemplate with DataTable
- Columns: tanggal, teller, shift, status (badge), modal_kas, total_setoran, total_penarikan, selisih, supervisor_buka, supervisor_tutup
- Filters: status (multi-select), tanggal range, teller (link search)
- Default sort: tanggal desc

`src/pages/koperasi/sesi-kas/SesiKasDetailPage.tsx` (optional this sprint — defer if scope pressure)
- Read-only view of full sesi including both denominasi tables
- Route: `/koperasi/sesi-kas/:name`

### Modified pages

`src/pages/koperasi/teller/TellerWorkstationPage.tsx`
- Add React Query: `useQuery(['sesi-kas', 'active'], sesiKasService.getActiveForMe)`
- Three render branches:
  1. **No active sesi** → empty-state hero with "Buka Sesi Kas" CTA opening BukaSesiModal
  2. **Active sesi** → existing 3-col layout PLUS new header strip: sesi badge + waktu_buka + modal_kas + running totals (computed from session tape) + "Tutup Sesi" button (opens TutupSesiModal)
  3. **Pending Approval** → locked empty-state with sesi summary + "Menunggu approval supervisor" message + link to riwayat
- Remove local "session tape" state in favor of fetching `Transaksi Simpanan` list filtered by `sesi_kas=activeSesi.name` (kept short — last 20 transaksi). Defer this if it inflates the diff: leave local tape but invalidate it when sesi closes.

`src/pages/koperasi/persetujuan/PusatPersetujuanPage.tsx`
- Add third tab "Penutupan Kas"
- Query: `Sesi Kas Teller` where `status = 'Pending Approval'`
- Drawer per row: full rekonsiliasi summary + selisih badge + `catatan_selisih` (read-only) + `catatan_supervisor` textarea + Approve button
- Approve → `sesiKasService.approveTutup()` → invalidate, close drawer
- Reject is not in backend scope — Approve only. If supervisor wants reject, they edit via Frappe desk (out of scope).

### Routing

`src/app/routes.koperasi.tsx`
- Add: `/koperasi/sesi-kas` → `SesiKasListPage` (lazy)
- (Defer detail page route — add only if `SesiKasDetailPage` ships)

### Navigation

`src/layouts/AppNavbar/AppNavbar.tsx`
- Add koperasi nav entry: "Sesi Kas" (icon: `Clock` from lucide-react), `/koperasi/sesi-kas`
- Position: after "Persetujuan", before "Laporan" section.

## Data Flow

```
Mount /koperasi/teller
  ├─ useQuery(['sesi-kas','active'])  → GET /api/method/sekolahpro.koperasi.api.sesi_kas.get_active_for_me
  └─ if null:
       └─ BukaSesiModal
            └─ POST /api/resource/Sesi Kas Teller (with submit=1)
                 └─ Backend: on_submit → status=Aktif, waktu_buka=now
                      └─ invalidate ['sesi-kas','active']
                           └─ TellerWorkstation re-renders with active sesi

Transaksi flow (setor/tarik/bayar):
  └─ POST /api/resource/Transaksi Simpanan
       └─ Backend: before_insert → self.sesi_kas = _get_active_sesi(user)
            └─ Frontend never sets sesi_kas explicitly

Tutup sesi:
  └─ TutupSesiModal collects denominasi_tutup + catatan_selisih
       └─ POST /api/method/run_doc_method
            { dt: 'Sesi Kas Teller', dn: name, method: 'tutup_kas',
              args: { denominasi_tutup, catatan_selisih } }
       └─ Backend tutup_kas() calculates total_setoran/penarikan/saldo/selisih
            └─ status=Pending Approval, waktu_tutup=now
                 └─ invalidate ['sesi-kas','active']

Supervisor approve:
  └─ Drawer in /koperasi/persetujuan "Penutupan Kas" tab
       └─ POST /api/method/run_doc_method
            { dt: 'Sesi Kas Teller', dn: name, method: 'approve_tutup',
              args: { catatan_supervisor } }
       └─ Backend approve_tutup() → status=Selesai, supervisor_tutup=current_user
```

## Reconciliation Formula (client preview only — backend is authority)

```
total_denominasi_tutup = Σ (row.nilai × row.jumlah)
saldo_seharusnya       = modal_kas + total_setoran − total_penarikan
selisih                = total_denominasi_tutup − saldo_seharusnya
```

Client computes for live preview. Backend recomputes on submit — if they diverge, surface the discrepancy as a toast (rare; happens only if a transaksi races during close).

## Error Handling

| Failure | UI |
|---------|-----|
| `getActiveForMe` 4xx/5xx | Toast error, render "Tidak bisa muat sesi" empty state with retry |
| Multiple Aktif sesi (shouldn't happen) | Backend `_validate_no_active_sesi` blocks at submit; toast verbatim |
| `modal_kas !== Σdenominasi_buka` | Backend `_validate_denominasi_buka_match_modal` blocks; toast verbatim |
| `denominasi_tutup` empty | Backend `_validate_denominasi_tutup_not_empty` blocks; toast verbatim |
| `catatan_selisih` empty when `selisih !== 0` | Client-side gate + backend `_validate_catatan_selisih` |
| User has no Teller link | `getActiveForMe` returns null; backend submit throws → toast: "Akun Anda tidak terdaftar sebagai teller" |
| Race: transaksi posted between TutupSesi load and submit | Backend reconciliation reads fresh totals; selisih may differ from client preview; show toast comparing client vs server numbers, ask user to retry |

No optimistic updates anywhere — cash UX favors confirmation over speed.

## Testing

### Unit (Vitest)

- `sesiKas.service.test.ts` — mock apiClient. Verify:
  - `getActiveForMe` calls `/api/method/...sesi_kas.get_active_for_me` and returns null on 404 vs object on 200.
  - `bukaSesi` posts to `/api/resource/Sesi Kas Teller` with submit flag.
  - `tutupKas` and `approveTutup` use `run_doc_method` endpoint with correct args shape.
  - `list` builds tuple-array filters per the existing contract.

- `DenominasiGrid.test.tsx`:
  - Controlled input — typing in row updates total.
  - Subtotal = `nilai × jumlah`.
  - Empty values treated as 0.
  - Disabled state — inputs read-only, no onChange fires.
  - Accessibility — each row has label, total is announced.

### Integration (React Testing Library)

- `TellerWorkstationPage.test.tsx`:
  - No active sesi → renders empty state + CTA opens modal.
  - With active sesi → renders 3-col layout + header strip.
  - Pending Approval sesi → locks UI with appropriate message.

### E2E (Playwright)

`e2e/sesi-kas.spec.ts` — full lifecycle against a seeded backend:

1. Login as teller.
2. Visit `/koperasi/teller` → see empty state.
3. Open BukaSesiModal → quick-fill 500k → adjust grid → pick supervisor → submit.
4. Header strip shows Aktif sesi.
5. Perform 1 setor + 1 tarik via action tabs.
6. Open TutupSesiModal → count denominasi_tutup matching expected balance → submit (selisih=0, no catatan needed).
7. Page shows Pending Approval lock.
8. Switch to supervisor session → visit `/koperasi/persetujuan` → Penutupan Kas tab → approve.
9. Refresh teller page → empty state again (ready for next shift).

### Smoke API

Extend `scripts/smoke-koperasi-api.mjs`:

- `GET /api/method/sekolahpro.koperasi.api.sesi_kas.get_active_for_me` (200/null)
- `GET /api/resource/Sesi Kas Teller?filters=[["status","=","Aktif"]]` (200, paginated)
- `GET /api/resource/Denominasi Uang?filters=[["aktif","=",1]]` (200, 10 items)

## Non-Goals

- Thermal print of struk transaksi (separate sprint).
- Cross-shift handoff / multi-day sesi.
- Multi-cashier per terminal.
- Supervisor PIN authentication for buka (off-system co-sign for now).
- Reject flow on Penutupan Kas (Approve only; reject via Frappe desk).
- Real-time push notification to supervisor when sesi enters Pending Approval (poll on tab visit).
- Edit sesi after submit (Frappe submittable doctype; amendments out of scope).
- `SesiKasDetailPage` — list + drawer is enough this sprint; add detail page only if list interactions feel cramped.

## Success Criteria

- Teller can complete the full lifecycle (open → transact → close → see approval-pending) without leaving `/koperasi/teller`.
- Every `Transaksi Simpanan` created during a shift has its `sesi_kas` field populated (backend confirms).
- Supervisor can approve from `/koperasi/persetujuan` and the teller sees the closed sesi disappear from the active slot.
- `npm run smoke:api` passes the 3 new endpoints.
- `e2e/sesi-kas.spec.ts` runs end-to-end against a seeded site.
- No regression on existing teller transaction flows (existing E2E still green).

## Risks

- **`run_doc_method` permissions.** Frappe requires write perm on the doctype to call whitelisted methods on a submitted doc. Verify Teller and Supervisor roles have appropriate perms on `Sesi Kas Teller`. If not, add to `franchise/permission.py` or `permissions.json`. Mitigation: probe with `smoke:api` against a real site early.
- **Auto-link helper edge cases.** `_get_active_sesi(user)` is shared with `Transaksi Simpanan.before_insert` and resolves directly against `Sesi Kas Teller.teller` which is a `Link → User`. No intermediate Teller mapping needed. Verify the helper returns `None` (not raise) when no active sesi exists; frontend depends on null check.
- **Live preview vs server recalc divergence.** If a transaksi races during close, client selisih ≠ server selisih. Documented in Error Handling, but acknowledge UX is slightly jarring — acceptable for v1.
