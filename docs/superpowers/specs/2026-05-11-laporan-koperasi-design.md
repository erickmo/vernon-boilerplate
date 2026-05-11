# Laporan Koperasi End-to-End

**Date:** 2026-05-11
**Scope:** Backend export API + frontend preview table for 4 existing laporan types.
**Backend:** new file `sekolahpro/koperasi/api/laporan.py` + tests.
**Frontend:** new service + types; modified `LaporanKoperasiPage`.

## Context

`LaporanKoperasiPage` already exists with a UI that picks one of 4 laporan types (`rekap_transaksi_simpanan`, `rekap_angsuran`, `rekap_zis`, `kas_teller_summary`) + periode + optional nasabah, then calls `/api/method/sekolahpro.koperasi.api.laporan.export` for an XLSX/PDF download.

Backend endpoint `sekolahpro.koperasi.api.laporan` **does not exist**. Page errors on every export click. This sprint builds:

1. Backend `preview` + `export` whitelisted methods covering all 4 laporan types.
2. Frontend in-app preview table (summary card + paginated rows) before export.
3. XLSX export. PDF deferred (hide button this sprint).

## Backend

**New file:** `sekolahpro/koperasi/api/laporan.py`

Two whitelisted entry points:

```python
@frappe.whitelist()
def preview(laporan: str, periode_start: str, periode_end: str, nasabah: str | None = None) -> dict

@frappe.whitelist()
def export(laporan: str, periode_start: str, periode_end: str, format: str, nasabah: str | None = None) -> "bytes"
```

`preview` returns:

```python
{
  "columns": [{"key": "tanggal", "header": "Tanggal", "kind": "date"}, ...],
  "rows": [
    {
      # business fields per laporan...
      "_source": {"doctype": "Transaksi Simpanan", "name": "TS-2026-0001"},
    },
    ...
  ],
  "summary": {...},
  "truncated": bool,
}
```

Each row carries a `_source` object identifying the originating doctype + name. Frontend uses it for drill-down (row click → route to detail page or Frappe desk). XLSX/PDF/CSV exports strip `_source` before writing (it's UI-only).

`export` returns binary in one of three formats:
- `xlsx` — `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (via `openpyxl`)
- `pdf`  — `application/pdf` (via `frappe.utils.pdf.get_pdf` rendering a Jinja HTML template per laporan)
- `csv`  — `text/csv; charset=utf-8` (via stdlib `csv.writer`)

### Internal helpers

Single dispatcher mapping `laporan` value to a helper function:

```python
_HELPERS = {
    "rekap_transaksi_simpanan": _rekap_transaksi_simpanan,
    "rekap_angsuran":            _rekap_angsuran,
    "rekap_zis":                 _rekap_zis,
    "kas_teller_summary":        _kas_teller_summary,
}
```

Each helper has signature `(start: date, end: date, nasabah: str | None) -> dict` returning the shape above.

**1. `_rekap_transaksi_simpanan(start, end, nasabah?)`:**
Query `Transaksi Simpanan` in `[start, end]`, optional join to `Rekening Simpanan` for `nasabah` filter.

Columns: `tanggal`, `rekening`, `nasabah_nama`, `jenis`, `jumlah`, `keterangan`.
Summary: `total_setoran`, `total_penarikan`, `total_bagi_hasil`, `total_bunga`, `net = setoran − penarikan + bagi_hasil + bunga`, `count_transaksi`.

**2. `_rekap_angsuran(start, end, nasabah?)`:**
Query `Pembayaran Angsuran` in `[start, end]`. Join `Akad Pembiayaan` for nasabah; join `Jadwal Angsuran` for `tanggal_jatuh_tempo`. Derive `kolektibilitas` from `hari_telat = (tanggal_bayar - tanggal_jatuh_tempo).days` (clamped at 0 for early/on-time):

| `hari_telat` | `kolektibilitas` |
|--------------|------------------|
| 0 – 30       | Lancar           |
| 31 – 60      | Kurang Lancar    |
| 61 – 90      | Diragukan        |
| 91+          | Macet            |

Columns: `tanggal_bayar`, `nasabah`, `akad_id`, `angsuran_ke`, `jumlah_bayar`, `denda`, `hari_telat`, `kolektibilitas`.
Summary: `total_bayar`, `total_denda`, `count_lancar`, `count_kurang_lancar`, `count_diragukan`, `count_macet`, `count_total`.

**3. `_rekap_zis(start, end, nasabah?)`:**
Union of `Penerimaan ZIS` (rows tagged `tipe='Penerimaan'`) + `Penyaluran ZIS` (rows tagged `tipe='Penyaluran'`) in `[start, end]`. `nasabah` filter applies only to Penerimaan rows. Sort by tanggal.

Columns: `tanggal`, `tipe`, `jenis_dana`, `pihak` (nasabah for Penerimaan / penerima for Penyaluran), `jumlah`, `keterangan`.
Summary: `total_penerimaan`, `total_penyaluran`, `saldo_zis = penerimaan − penyaluran`, `count_penerimaan`, `count_penyaluran`.

**4. `_kas_teller_summary(start, end, nasabah?)`:**
Query `Sesi Kas Teller` with `status = 'Selesai'` AND `tanggal` in `[start, end]`. `nasabah` is ignored (not applicable; document this in API doc).

Columns: `tanggal`, `teller`, `shift`, `modal_kas`, `total_setoran`, `total_penarikan`, `total_denominasi_tutup`, `selisih`, `supervisor_buka`, `supervisor_tutup`.
Summary: `count_sesi`, `total_selisih`, `total_setoran`, `total_penarikan`.

### Format generators

Three shared helpers, one per format. All strip `_source` from rows before serializing:

```python
def _make_xlsx(title: str, columns: list[dict], rows: list[dict], summary: dict) -> bytes:
    """openpyxl. Layout: title row, periode/filter row, blank, header (bold), data, blank, summary."""

def _make_csv(title: str, columns: list[dict], rows: list[dict], summary: dict) -> bytes:
    """stdlib csv. Layout: header row, data rows, blank line, summary key/value rows.
       UTF-8 with BOM so Excel opens it cleanly."""

def _make_pdf(title: str, columns: list[dict], rows: list[dict], summary: dict, meta: dict) -> bytes:
    """frappe.utils.pdf.get_pdf rendered from a Jinja template at
       sekolahpro/koperasi/api/laporan_pdf.html. Template renders title, meta
       (periode, filters, generated_at), a striped table, and summary block.
       Currency right-aligned. Page break every 50 rows."""
```

XLSX currency columns formatted with `#,##0`. Date columns ISO. CSV uses raw numbers (no thousands separator) to keep parsing clean.

### Jinja PDF template

**New file:** `sekolahpro/koperasi/api/laporan_pdf.html`

Skeleton:

```html
<style>/* margins, fonts, table */</style>
<h1>{{ title }}</h1>
<table class="meta">
  <tr><th>Periode</th><td>{{ meta.periode }}</td></tr>
  <tr><th>Filter Nasabah</th><td>{{ meta.nasabah or '—' }}</td></tr>
  <tr><th>Dibuat</th><td>{{ meta.generated_at }}</td></tr>
</table>
<table class="data">
  <thead>
    <tr>{% for c in columns %}<th>{{ c.header }}</th>{% endfor %}</tr>
  </thead>
  <tbody>
    {% for row in rows %}
    <tr>
      {% for c in columns %}
      <td class="kind-{{ c.kind }}">{{ render_cell(row, c) }}</td>
      {% endfor %}
    </tr>
    {% endfor %}
  </tbody>
</table>
<table class="summary">
  {% for k, v in summary.items() %}
  <tr><th>{{ k }}</th><td>{{ fmt_summary(k, v) }}</td></tr>
  {% endfor %}
</table>
```

`render_cell` and `fmt_summary` are Jinja filters defined in `laporan.py` (currency formatter, date formatter, plain text fallback).

### Cap + pagination

Hard cap `MAX_ROWS = 5000`. If query returns more, truncate, set `truncated=True`. Frontend renders banner: "Menampilkan 5000 baris pertama. Persempit periode untuk hasil lengkap."

### Permissions

`@frappe.whitelist()` enforces login. Each query uses `frappe.db.get_list(..., ignore_permissions=False)` so doctype-level permissions apply. No additional role gating this sprint — users see what they can already see in Frappe desk.

### Files

- `sekolahpro/koperasi/api/laporan.py` — module
- `sekolahpro/koperasi/api/test_laporan.py` — pytest, 4 tests
- `docs/api/koperasi-laporan.md` — endpoint doc

## Frontend

### Service

**New file:** `src/services/koperasi/laporan.service.ts`

```ts
export type LaporanNama =
  | 'rekap_transaksi_simpanan'
  | 'rekap_angsuran'
  | 'rekap_zis'
  | 'kas_teller_summary'

export interface PreviewParams {
  laporan: LaporanNama
  periode_start: string  // YYYY-MM-DD
  periode_end: string
  nasabah?: string
}
export type ExportFormat = 'xlsx' | 'pdf' | 'csv'

export interface LaporanColumn {
  key: string
  header: string
  kind: 'date' | 'text' | 'currency' | 'number'
}
export interface LaporanPreview {
  columns: LaporanColumn[]
  rows: Record<string, unknown>[]
  summary: Record<string, number>
  truncated: boolean
}

export const laporanService = {
  preview(params: PreviewParams): Promise<LaporanPreview>
  export(params: PreviewParams, format: ExportFormat): Promise<Blob>
}
```

### Types

**New file:** `src/types/koperasi/laporan.types.ts` — re-exports the types from `laporan.service.ts` so consumers can import from `@/types/...` if preferred. Keeps types module-level, follows existing convention.

### Page changes

**Modified:** `src/pages/koperasi/laporan/LaporanKoperasiPage.tsx`

- Extract inline `handleExport` logic into `laporanService.export(params, format)`.
- Add three export buttons side-by-side: "Excel", "PDF", "CSV". Each downloads the respective format.
- Add a "Preview" button on the left of the export buttons. On click, run `useQuery(['laporan', preview, params])` for preview data.
- Below the filter card, render a preview section: summary stats grid + DataTable.
- Use existing `DataTable` widget with `columns` dynamically derived from API response.
- Summary stats: one card per `summary` key with `formatCurrency` for `total_*` keys, `formatNumber` for `count_*` keys.
- Empty state: "Tidak ada data pada periode ini" when `rows.length === 0` after preview runs.
- Truncated banner: when `preview.truncated`, show amber banner above table.
- **Drill-down:** each row in the DataTable is clickable. `onRowClick(row)` reads `row._source.{doctype, name}` and routes to the appropriate frontend detail page:
  - `Transaksi Simpanan` → `/koperasi/simpanan/transaksi/${name}` (or whatever existing route shows transaksi detail; verify)
  - `Pembayaran Angsuran` → `/koperasi/pembiayaan/angsuran/${name}`
  - `Penerimaan ZIS` → `/koperasi/zis/penerimaan/${name}`
  - `Penyaluran ZIS` → `/koperasi/zis/penyaluran/${name}`
  - `Sesi Kas Teller` → `/koperasi/kas-teller/${name}` (existing SesiKasTellerDetailPage)
  - Fallback (no frontend detail page wired): open Frappe desk URL `/app/${doctype}/${name}` in a new tab.

  Route mapping lives in a small helper `getDrillDownPath(source: { doctype, name }): string | null` inside `laporan.service.ts` (returns null → fallback to desk). Cursor changes to pointer when row is hoverable.

### Routing + nav

Already wired — `/koperasi/laporan` route exists, AppNavbar entry exists. No changes.

## Data flow

```
User picks laporan + periode + nasabah?
  ├─ Click "Preview"
  │    └─ GET /api/method/sekolahpro.koperasi.api.laporan.preview?...
  │         └─ Server runs _<helper>(start, end, nasabah)
  │              └─ Returns { columns, rows, summary, truncated }
  │                   └─ React Query caches by [laporan, periode, nasabah]
  │                        └─ Page renders summary cards + DataTable
  │
  └─ Click "Export Excel"
       └─ GET /api/method/sekolahpro.koperasi.api.laporan.export?...&format=xlsx
            └─ Server runs same helper, then _make_xlsx(title, columns, rows, summary)
                 └─ Returns XLSX blob
                      └─ Frontend triggers browser download
```

## Error handling

| Failure | UI |
|---------|-----|
| Periode invalid (start > end) | Client-side gate before request fires |
| Periode empty | Client-side gate (already exists) |
| `nasabah` not provided when ignored (kas_teller_summary) | Silently ignored server-side; show info note "Filter nasabah tidak berlaku untuk laporan ini" if user fills it for this laporan |
| 400 / unknown laporan | Toast verbatim |
| 500 / backend exception | Toast verbatim |
| Empty result | Empty state in preview table |
| `truncated=true` | Amber banner + count |
| PDF render error (large dataset) | Toast verbatim; suggest narrowing periode |
| CSV row contains commas/quotes | csv.writer handles RFC 4180 quoting automatically |
| Drill-down target route not registered | Helper returns null → fallback opens `/app/${doctype}/${name}` (Frappe desk) in new tab |

## Testing

### Backend (`test_laporan.py`)

Four tests, one per laporan type. Each test:
1. Sets up minimal fixtures (1-3 transactions in a known periode).
2. Calls the helper directly with the periode bounds.
3. Asserts row count, summary totals, key fields.
4. Rolls back.

Plus one test for the dispatcher: unknown `laporan` value → `frappe.throw` with clear message.

Plus one test for `_make_xlsx`: header row + data row + summary row are written; file opens via `openpyxl.load_workbook`.

### Frontend service (`laporan.service.test.ts`)

- `preview` builds correct URL + query string, returns `LaporanPreview` shape.
- `preview` propagates `nasabah` only when provided.
- `export` returns Blob; URL has `format=xlsx`.

### Frontend page (`LaporanKoperasiPage.test.tsx`)

- Renders 4 laporan radio options.
- Clicking Preview without periode → toast error, no request fired.
- After successful preview, summary cards + table appear.
- Empty data → empty state message.
- Truncated banner appears when `truncated=true`.

### Smoke API

Append 2 cases to `scripts/smoke-koperasi-api.mjs`:
- `GET preview rekap_transaksi_simpanan` for a 30-day periode.
- `GET export rekap_transaksi_simpanan format=xlsx` — verify `content-type` header.

## Non-goals

- Neraca + laba-rugi (separate accounting sprint; requires ledger / akun structure).
- Scheduled / emailed exports.
- Print-preview styling beyond the basic PDF template.
- Custom column visibility / reorder.
- Saved filter presets.
- Drill-down editing — drill-down is read-only routing only.

## Success criteria

- Hitting `/koperasi/laporan`, picking any of the 4 types, filling periode, clicking Preview returns data + summary.
- Clicking Export Excel downloads a valid `.xlsx` file containing the same data.
- Backend has 4+ green tests.
- Frontend has new service tests + page integration tests passing.
- Smoke API endpoint count grows by 2.
- `tsc -b` exit 0, `vite build` succeeds.

## Risks

- **`openpyxl` not available in Frappe build:** verify with `python -c "import openpyxl"` in the bench container before starting. If missing, add to `requirements.txt`. (Frappe v14+ bundles it; very low risk.)
- **`Akad Pembiayaan` → nasabah link path:** depends on whether `akad.nasabah` is a direct field or via `rekening_simpanan`. Verify in helper implementation; the spec assumes direct nasabah link.
- **Date range size:** unbounded SQL on `Transaksi Simpanan` table could be slow for full-year queries. The 5000-row cap protects the API, but the SQL itself isn't paginated. If a tenant has >50k rows, queries may take >5s. Mitigation: add server-side `LIMIT 5001` to detect truncation early.
- **`kolektibilitas` buckets:** v1 uses 0-30/31-60/61-90/>90 day thresholds per common Indonesian banking convention (Lancar/Kurang Lancar/Diragukan/Macet). Revise if local cooperative regulation specifies different cutoffs.
- **PDF rendering time:** `frappe.utils.pdf.get_pdf` invokes wkhtmltopdf which can take several seconds for tables >1000 rows. Set a server-side warning when row count > 2000 and recommend XLSX/CSV instead. Hard timeout falls back to the 30s gateway default.
- **Drill-down route drift:** the `getDrillDownPath` helper hardcodes 5 path patterns. If those frontend routes get renamed without updating the helper, drill-down silently falls back to Frappe desk. Mitigate with a test that asserts every path string maps to a registered route in `routes.koperasi.tsx`.
