# Laporan Koperasi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship preview + XLSX/PDF/CSV export for 4 koperasi laporan types (rekap_transaksi_simpanan, rekap_angsuran, rekap_zis, kas_teller_summary) with 4-bucket kolektibilitas and row-click drill-down.

**Architecture:** Backend `sekolahpro.koperasi.api.laporan` module exposes `preview` + `export` whitelisted methods dispatching to 4 helper functions. Three format builders (`_make_xlsx` via openpyxl, `_make_pdf` via `frappe.utils.pdf.get_pdf` + Jinja template, `_make_csv` via stdlib). Frontend service wraps both endpoints; existing `LaporanKoperasiPage` gets preview table + summary cards + drill-down row click + three export buttons.

**Tech Stack:** Frappe (Python 3.11), `openpyxl`, `frappe.utils.pdf` (wkhtmltopdf), stdlib `csv`; React 18 + TypeScript strict, React Query, existing `DataTable` widget.

**Spec:** `docs/superpowers/specs/2026-05-11-laporan-koperasi-design.md`.

**Branches:**
- Frontend: `feat/laporan-koperasi` (active in this workspace).
- Backend: separate branch in `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro` — create `feat/laporan-api` at the start of Task 1.

**Drill-down route audit (frontend, already verified):**
- `Sesi Kas Teller` → existing route `/koperasi/kas-teller/:name`
- `Penerimaan ZIS` → existing `/koperasi/zis/penerimaan/:id`
- `Penyaluran ZIS` → existing `/koperasi/zis/penyaluran/:id`
- `Transaksi Simpanan` → no detail route → Frappe desk fallback
- `Pembayaran Angsuran` → no detail route → Frappe desk fallback

---

## Task 0: Branch + baseline

**Files:** none.

- [ ] **Step 1: Confirm frontend branch + baseline**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git branch --show-current  # expect feat/laporan-koperasi
cd web-dashboard
npx tsc -b
echo "tsc exit: $?"
npx vite build 2>&1 | tail -3
```

All clean.

- [ ] **Step 2: Create backend branch**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro
git status -sb  # note pre-existing dirty state — do NOT touch
git checkout -b feat/laporan-api
```

Pre-existing dirty work travels with the branch — only stage files this plan creates/modifies.

---

## Task 1: Backend dispatcher + first helper (rekap_transaksi_simpanan)

**Files (backend repo):**
- Create: `sekolahpro/koperasi/api/laporan.py`
- Create: `sekolahpro/koperasi/api/test_laporan.py`

- [ ] **Step 1: Probe Frappe API for query helper**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro
grep -rn "frappe.db.get_list\|frappe.db.sql" sekolahpro/koperasi/api/card.py | head -5
```

Note the existing patterns; reuse same style.

- [ ] **Step 2: Write failing test**

Create `sekolahpro/koperasi/api/test_laporan.py`:

```python
import frappe
import unittest
from datetime import date

from sekolahpro.koperasi.api.laporan import preview, _rekap_transaksi_simpanan


class TestLaporanPreview(unittest.TestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def test_preview_dispatches_to_known_laporan(self):
        result = preview(
            laporan="rekap_transaksi_simpanan",
            periode_start="2020-01-01",
            periode_end="2020-12-31",
        )
        self.assertIn("columns", result)
        self.assertIn("rows", result)
        self.assertIn("summary", result)
        self.assertIn("truncated", result)
        self.assertIsInstance(result["rows"], list)

    def test_preview_throws_on_unknown_laporan(self):
        with self.assertRaises(frappe.ValidationError):
            preview(
                laporan="not_a_real_laporan",
                periode_start="2020-01-01",
                periode_end="2020-12-31",
            )

    def test_rekap_transaksi_simpanan_returns_shape(self):
        result = _rekap_transaksi_simpanan(
            date(2020, 1, 1), date(2020, 12, 31), None,
        )
        self.assertEqual(
            [c["key"] for c in result["columns"]],
            ["tanggal", "rekening", "nasabah_nama", "jenis", "jumlah", "keterangan"],
        )
        # summary must contain these keys regardless of data presence
        for key in ("total_setoran", "total_penarikan", "total_bagi_hasil",
                    "total_bunga", "net", "count_transaksi"):
            self.assertIn(key, result["summary"])
        self.assertFalse(result["truncated"])
```

- [ ] **Step 3: Run failing test (or syntax-check if bench unavailable)**

```bash
python3 -c "import ast; ast.parse(open('sekolahpro/koperasi/api/test_laporan.py').read()); print('syntax ok')"
```

If a docker bench is available:
```bash
docker compose exec frappe bench --site site2.localhost run-tests --app sekolahpro --module sekolahpro.koperasi.api.test_laporan 2>&1 | tail -10
```

Otherwise note the test as "deferred to docker-aware runner".

- [ ] **Step 4: Create the module**

Create `sekolahpro/koperasi/api/laporan.py`:

```python
"""Laporan Koperasi API.

Whitelisted entry points:
- preview(laporan, periode_start, periode_end, nasabah?) -> dict
- export(laporan, periode_start, periode_end, format, nasabah?) -> bytes (HTTP response)

Internal dispatch by laporan name; format generators in separate functions.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Callable

import frappe

MAX_ROWS = 5000


def _parse_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def _strip_source(rows: list[dict]) -> list[dict]:
    """Return rows without the UI-only _source key (for export serializers)."""
    return [{k: v for k, v in r.items() if k != "_source"} for r in rows]


# ─── Helper: rekap_transaksi_simpanan ─────────────────────────────────────────

def _rekap_transaksi_simpanan(start: date, end: date, nasabah: str | None) -> dict[str, Any]:
    filters: dict[str, Any] = {"tanggal": ["between", [start, end]]}

    rekening_filter: dict[str, Any] = {}
    if nasabah:
        rekening_filter["nasabah"] = nasabah
        rekening_names = [
            r.name for r in frappe.get_all("Rekening Simpanan", filters=rekening_filter, fields=["name"])
        ]
        filters["rekening_simpanan"] = ["in", rekening_names or [""]]

    raw = frappe.get_all(
        "Transaksi Simpanan",
        filters=filters,
        fields=["name", "tanggal", "rekening_simpanan", "jenis", "jumlah", "keterangan"],
        order_by="tanggal asc",
        limit_page_length=MAX_ROWS + 1,
    )

    truncated = len(raw) > MAX_ROWS
    raw = raw[:MAX_ROWS]

    # Resolve nasabah names per rekening (single roundtrip)
    rek_names = list({r["rekening_simpanan"] for r in raw if r.get("rekening_simpanan")})
    nasabah_by_rek: dict[str, str] = {}
    if rek_names:
        for rs in frappe.get_all(
            "Rekening Simpanan",
            filters={"name": ["in", rek_names]},
            fields=["name", "nasabah"],
        ):
            nasabah_by_rek[rs.name] = rs.nasabah or ""

    rows = []
    totals = {"Setoran": 0.0, "Penarikan": 0.0, "Bagi Hasil": 0.0, "Bunga": 0.0}
    for r in raw:
        jenis = r["jenis"] or ""
        jumlah = float(r["jumlah"] or 0)
        if jenis in totals:
            totals[jenis] += jumlah
        rows.append({
            "tanggal": r["tanggal"].isoformat() if r["tanggal"] else None,
            "rekening": r["rekening_simpanan"],
            "nasabah_nama": nasabah_by_rek.get(r["rekening_simpanan"], ""),
            "jenis": jenis,
            "jumlah": jumlah,
            "keterangan": r["keterangan"] or "",
            "_source": {"doctype": "Transaksi Simpanan", "name": r["name"]},
        })

    return {
        "columns": [
            {"key": "tanggal", "header": "Tanggal", "kind": "date"},
            {"key": "rekening", "header": "Rekening", "kind": "text"},
            {"key": "nasabah_nama", "header": "Nasabah", "kind": "text"},
            {"key": "jenis", "header": "Jenis", "kind": "text"},
            {"key": "jumlah", "header": "Jumlah", "kind": "currency"},
            {"key": "keterangan", "header": "Keterangan", "kind": "text"},
        ],
        "rows": rows,
        "summary": {
            "total_setoran": totals["Setoran"],
            "total_penarikan": totals["Penarikan"],
            "total_bagi_hasil": totals["Bagi Hasil"],
            "total_bunga": totals["Bunga"],
            "net": totals["Setoran"] - totals["Penarikan"] + totals["Bagi Hasil"] + totals["Bunga"],
            "count_transaksi": len(rows),
        },
        "truncated": truncated,
    }


# ─── Dispatcher (other helpers added in following tasks) ──────────────────────

_HELPERS: dict[str, Callable[[date, date, str | None], dict[str, Any]]] = {
    "rekap_transaksi_simpanan": _rekap_transaksi_simpanan,
}


@frappe.whitelist()
def preview(
    laporan: str,
    periode_start: str,
    periode_end: str,
    nasabah: str | None = None,
) -> dict[str, Any]:
    if laporan not in _HELPERS:
        frappe.throw(f"Laporan tidak dikenal: {laporan}")
    return _HELPERS[laporan](_parse_date(periode_start), _parse_date(periode_end), nasabah)
```

- [ ] **Step 5: Run test**

```bash
python3 -c "import ast; ast.parse(open('sekolahpro/koperasi/api/laporan.py').read()); print('syntax ok')"
```

If docker bench available, run the test module; expect 3/3 (or skipped if fixtures absent).

- [ ] **Step 6: Commit (backend)**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro
git add sekolahpro/koperasi/api/laporan.py sekolahpro/koperasi/api/test_laporan.py
git status  # verify only 2 files staged
git commit -m "feat(laporan): dispatcher + rekap_transaksi_simpanan helper"
```

---

## Task 2: Helper — rekap_angsuran with 4-bucket kolektibilitas

**Files (backend):**
- Modify: `sekolahpro/koperasi/api/laporan.py` (add `_rekap_angsuran` + dispatch entry)
- Modify: `sekolahpro/koperasi/api/test_laporan.py` (add tests)

- [ ] **Step 1: Add failing tests**

Append to `test_laporan.py`:

```python
def test_kolektibilitas_buckets(self):
    from sekolahpro.koperasi.api.laporan import _kolektibilitas_from_days
    # Edges based on spec table: 0-30 / 31-60 / 61-90 / 91+
    self.assertEqual(_kolektibilitas_from_days(0),  "Lancar")
    self.assertEqual(_kolektibilitas_from_days(30), "Lancar")
    self.assertEqual(_kolektibilitas_from_days(31), "Kurang Lancar")
    self.assertEqual(_kolektibilitas_from_days(60), "Kurang Lancar")
    self.assertEqual(_kolektibilitas_from_days(61), "Diragukan")
    self.assertEqual(_kolektibilitas_from_days(90), "Diragukan")
    self.assertEqual(_kolektibilitas_from_days(91), "Macet")
    self.assertEqual(_kolektibilitas_from_days(-5), "Lancar")  # early payment clamps

def test_rekap_angsuran_returns_shape(self):
    from datetime import date
    from sekolahpro.koperasi.api.laporan import _rekap_angsuran
    result = _rekap_angsuran(date(2020, 1, 1), date(2020, 12, 31), None)
    self.assertEqual(
        [c["key"] for c in result["columns"]],
        ["tanggal_bayar", "nasabah", "akad_id", "angsuran_ke",
         "jumlah_bayar", "denda", "hari_telat", "kolektibilitas"],
    )
    for key in ("total_bayar", "total_denda",
                "count_lancar", "count_kurang_lancar",
                "count_diragukan", "count_macet", "count_total"):
        self.assertIn(key, result["summary"])
```

- [ ] **Step 2: Implement bucketing helper + rekap_angsuran**

Add to `laporan.py`:

```python
def _kolektibilitas_from_days(hari_telat: int) -> str:
    days = max(0, hari_telat)
    if days <= 30:
        return "Lancar"
    if days <= 60:
        return "Kurang Lancar"
    if days <= 90:
        return "Diragukan"
    return "Macet"


def _rekap_angsuran(start: date, end: date, nasabah: str | None) -> dict[str, Any]:
    filters: dict[str, Any] = {"tanggal_bayar": ["between", [start, end]]}

    if nasabah:
        akad_names = [
            a.name for a in frappe.get_all(
                "Akad Pembiayaan", filters={"nasabah": nasabah}, fields=["name"],
            )
        ]
        filters["akad_pembiayaan"] = ["in", akad_names or [""]]

    raw = frappe.get_all(
        "Pembayaran Angsuran",
        filters=filters,
        fields=["name", "tanggal_bayar", "akad_pembiayaan", "angsuran_ke",
                "jumlah_bayar", "denda"],
        order_by="tanggal_bayar asc",
        limit_page_length=MAX_ROWS + 1,
    )

    truncated = len(raw) > MAX_ROWS
    raw = raw[:MAX_ROWS]

    # Resolve nasabah names per akad
    akad_names = list({r["akad_pembiayaan"] for r in raw if r.get("akad_pembiayaan")})
    akad_to_nasabah: dict[str, str] = {}
    if akad_names:
        for a in frappe.get_all(
            "Akad Pembiayaan",
            filters={"name": ["in", akad_names]},
            fields=["name", "nasabah"],
        ):
            akad_to_nasabah[a.name] = a.nasabah or ""

    # Resolve jadwal angsuran (tanggal_jatuh_tempo) per (akad, angsuran_ke)
    jadwal_map: dict[tuple[str, int], date] = {}
    if akad_names:
        for j in frappe.get_all(
            "Jadwal Angsuran",
            filters={"akad_pembiayaan": ["in", akad_names]},
            fields=["akad_pembiayaan", "angsuran_ke", "tanggal_jatuh_tempo"],
        ):
            if j.tanggal_jatuh_tempo:
                jadwal_map[(j.akad_pembiayaan, j.angsuran_ke)] = j.tanggal_jatuh_tempo

    counts = {"Lancar": 0, "Kurang Lancar": 0, "Diragukan": 0, "Macet": 0}
    total_bayar = 0.0
    total_denda = 0.0
    rows = []
    for r in raw:
        tanggal_bayar = r["tanggal_bayar"]
        jatuh_tempo = jadwal_map.get((r["akad_pembiayaan"], r["angsuran_ke"]))
        hari_telat = (tanggal_bayar - jatuh_tempo).days if jatuh_tempo else 0
        kolek = _kolektibilitas_from_days(hari_telat)
        counts[kolek] += 1
        total_bayar += float(r["jumlah_bayar"] or 0)
        total_denda += float(r["denda"] or 0)
        rows.append({
            "tanggal_bayar": tanggal_bayar.isoformat() if tanggal_bayar else None,
            "nasabah": akad_to_nasabah.get(r["akad_pembiayaan"], ""),
            "akad_id": r["akad_pembiayaan"],
            "angsuran_ke": r["angsuran_ke"],
            "jumlah_bayar": float(r["jumlah_bayar"] or 0),
            "denda": float(r["denda"] or 0),
            "hari_telat": max(0, hari_telat),
            "kolektibilitas": kolek,
            "_source": {"doctype": "Pembayaran Angsuran", "name": r["name"]},
        })

    return {
        "columns": [
            {"key": "tanggal_bayar", "header": "Tanggal Bayar", "kind": "date"},
            {"key": "nasabah", "header": "Nasabah", "kind": "text"},
            {"key": "akad_id", "header": "Akad", "kind": "text"},
            {"key": "angsuran_ke", "header": "Angsuran Ke", "kind": "number"},
            {"key": "jumlah_bayar", "header": "Jumlah Bayar", "kind": "currency"},
            {"key": "denda", "header": "Denda", "kind": "currency"},
            {"key": "hari_telat", "header": "Hari Telat", "kind": "number"},
            {"key": "kolektibilitas", "header": "Kolektibilitas", "kind": "text"},
        ],
        "rows": rows,
        "summary": {
            "total_bayar": total_bayar,
            "total_denda": total_denda,
            "count_lancar": counts["Lancar"],
            "count_kurang_lancar": counts["Kurang Lancar"],
            "count_diragukan": counts["Diragukan"],
            "count_macet": counts["Macet"],
            "count_total": len(rows),
        },
        "truncated": truncated,
    }
```

Add to dispatcher:

```python
_HELPERS: dict[str, Callable[[date, date, str | None], dict[str, Any]]] = {
    "rekap_transaksi_simpanan": _rekap_transaksi_simpanan,
    "rekap_angsuran":            _rekap_angsuran,
}
```

- [ ] **Step 3: Verify**

```bash
python3 -c "import ast; ast.parse(open('sekolahpro/koperasi/api/laporan.py').read()); print('ok')"
```

Run tests if bench available.

- [ ] **Step 4: Commit**

```bash
git add sekolahpro/koperasi/api/laporan.py sekolahpro/koperasi/api/test_laporan.py
git commit -m "feat(laporan): rekap_angsuran with 4-bucket kolektibilitas (Lancar/Kurang Lancar/Diragukan/Macet)"
```

---

## Task 3: Helper — rekap_zis (union of Penerimaan + Penyaluran)

**Files (backend):**
- Modify: `sekolahpro/koperasi/api/laporan.py`
- Modify: `sekolahpro/koperasi/api/test_laporan.py`

- [ ] **Step 1: Add test**

```python
def test_rekap_zis_returns_unioned_rows(self):
    from datetime import date
    from sekolahpro.koperasi.api.laporan import _rekap_zis
    result = _rekap_zis(date(2020, 1, 1), date(2020, 12, 31), None)
    self.assertEqual(
        [c["key"] for c in result["columns"]],
        ["tanggal", "tipe", "jenis_dana", "pihak", "jumlah", "keterangan"],
    )
    for key in ("total_penerimaan", "total_penyaluran",
                "saldo_zis", "count_penerimaan", "count_penyaluran"):
        self.assertIn(key, result["summary"])
```

- [ ] **Step 2: Implement**

Add to `laporan.py`:

```python
def _rekap_zis(start: date, end: date, nasabah: str | None) -> dict[str, Any]:
    pen_filters: dict[str, Any] = {"tanggal": ["between", [start, end]]}
    if nasabah:
        pen_filters["nasabah"] = nasabah

    penerimaan = frappe.get_all(
        "Penerimaan ZIS",
        filters=pen_filters,
        fields=["name", "tanggal", "jenis_dana", "nasabah", "jumlah", "keterangan"],
        order_by="tanggal asc",
        limit_page_length=MAX_ROWS + 1,
    )

    # Penyaluran is not nasabah-filtered (uses dynamic link penerima_tipe + penerima)
    sal_filters: dict[str, Any] = {"tanggal": ["between", [start, end]]}
    penyaluran = frappe.get_all(
        "Penyaluran ZIS",
        filters=sal_filters,
        fields=["name", "tanggal", "program_penyaluran", "penerima_tipe",
                "penerima", "jumlah", "keterangan"],
        order_by="tanggal asc",
        limit_page_length=MAX_ROWS + 1,
    )

    rows = []
    total_pen = 0.0
    total_sal = 0.0
    for r in penerimaan:
        rows.append({
            "tanggal": r["tanggal"].isoformat() if r["tanggal"] else None,
            "tipe": "Penerimaan",
            "jenis_dana": r["jenis_dana"] or "",
            "pihak": r["nasabah"] or "",
            "jumlah": float(r["jumlah"] or 0),
            "keterangan": r["keterangan"] or "",
            "_source": {"doctype": "Penerimaan ZIS", "name": r["name"]},
        })
        total_pen += float(r["jumlah"] or 0)
    for r in penyaluran:
        rows.append({
            "tanggal": r["tanggal"].isoformat() if r["tanggal"] else None,
            "tipe": "Penyaluran",
            "jenis_dana": r["program_penyaluran"] or "",
            "pihak": r["penerima"] or "",
            "jumlah": float(r["jumlah"] or 0),
            "keterangan": r["keterangan"] or "",
            "_source": {"doctype": "Penyaluran ZIS", "name": r["name"]},
        })
        total_sal += float(r["jumlah"] or 0)

    rows.sort(key=lambda x: x["tanggal"] or "")
    truncated = len(rows) > MAX_ROWS
    rows = rows[:MAX_ROWS]

    return {
        "columns": [
            {"key": "tanggal", "header": "Tanggal", "kind": "date"},
            {"key": "tipe", "header": "Tipe", "kind": "text"},
            {"key": "jenis_dana", "header": "Jenis Dana / Program", "kind": "text"},
            {"key": "pihak", "header": "Pihak", "kind": "text"},
            {"key": "jumlah", "header": "Jumlah", "kind": "currency"},
            {"key": "keterangan", "header": "Keterangan", "kind": "text"},
        ],
        "rows": rows,
        "summary": {
            "total_penerimaan": total_pen,
            "total_penyaluran": total_sal,
            "saldo_zis": total_pen - total_sal,
            "count_penerimaan": sum(1 for r in rows if r["tipe"] == "Penerimaan"),
            "count_penyaluran": sum(1 for r in rows if r["tipe"] == "Penyaluran"),
        },
        "truncated": truncated,
    }
```

Add to dispatcher:

```python
_HELPERS["rekap_zis"] = _rekap_zis
```

- [ ] **Step 2: Verify + commit**

```bash
python3 -c "import ast; ast.parse(open('sekolahpro/koperasi/api/laporan.py').read()); print('ok')"
git add sekolahpro/koperasi/api/laporan.py sekolahpro/koperasi/api/test_laporan.py
git commit -m "feat(laporan): rekap_zis union of Penerimaan + Penyaluran ZIS"
```

---

## Task 4: Helper — kas_teller_summary

**Files (backend):** same `laporan.py` + `test_laporan.py`.

- [ ] **Step 1: Add test**

```python
def test_kas_teller_summary_returns_shape(self):
    from datetime import date
    from sekolahpro.koperasi.api.laporan import _kas_teller_summary
    result = _kas_teller_summary(date(2020, 1, 1), date(2020, 12, 31), None)
    self.assertEqual(
        [c["key"] for c in result["columns"]],
        ["tanggal", "teller", "shift", "modal_kas", "total_setoran",
         "total_penarikan", "total_denominasi_tutup", "selisih",
         "supervisor_buka", "supervisor_tutup"],
    )
    for key in ("count_sesi", "total_selisih", "total_setoran", "total_penarikan"):
        self.assertIn(key, result["summary"])
```

- [ ] **Step 2: Implement**

```python
def _kas_teller_summary(start: date, end: date, _nasabah: str | None) -> dict[str, Any]:
    raw = frappe.get_all(
        "Sesi Kas Teller",
        filters={
            "status": "Selesai",
            "tanggal": ["between", [start, end]],
        },
        fields=["name", "tanggal", "teller", "shift", "modal_kas",
                "total_setoran", "total_penarikan", "total_denominasi_tutup",
                "selisih", "supervisor_buka", "supervisor_tutup"],
        order_by="tanggal asc, shift asc",
        limit_page_length=MAX_ROWS + 1,
    )

    truncated = len(raw) > MAX_ROWS
    raw = raw[:MAX_ROWS]

    rows = []
    total_setoran = 0.0
    total_penarikan = 0.0
    total_selisih = 0.0
    for r in raw:
        rows.append({
            "tanggal": r["tanggal"].isoformat() if r["tanggal"] else None,
            "teller": r["teller"],
            "shift": r["shift"],
            "modal_kas": float(r["modal_kas"] or 0),
            "total_setoran": float(r["total_setoran"] or 0),
            "total_penarikan": float(r["total_penarikan"] or 0),
            "total_denominasi_tutup": float(r["total_denominasi_tutup"] or 0),
            "selisih": float(r["selisih"] or 0),
            "supervisor_buka": r["supervisor_buka"] or "",
            "supervisor_tutup": r["supervisor_tutup"] or "",
            "_source": {"doctype": "Sesi Kas Teller", "name": r["name"]},
        })
        total_setoran += float(r["total_setoran"] or 0)
        total_penarikan += float(r["total_penarikan"] or 0)
        total_selisih += float(r["selisih"] or 0)

    return {
        "columns": [
            {"key": "tanggal", "header": "Tanggal", "kind": "date"},
            {"key": "teller", "header": "Teller", "kind": "text"},
            {"key": "shift", "header": "Shift", "kind": "text"},
            {"key": "modal_kas", "header": "Modal Kas", "kind": "currency"},
            {"key": "total_setoran", "header": "Setoran", "kind": "currency"},
            {"key": "total_penarikan", "header": "Penarikan", "kind": "currency"},
            {"key": "total_denominasi_tutup", "header": "Total Tutup", "kind": "currency"},
            {"key": "selisih", "header": "Selisih", "kind": "currency"},
            {"key": "supervisor_buka", "header": "Supervisor Buka", "kind": "text"},
            {"key": "supervisor_tutup", "header": "Supervisor Tutup", "kind": "text"},
        ],
        "rows": rows,
        "summary": {
            "count_sesi": len(rows),
            "total_selisih": total_selisih,
            "total_setoran": total_setoran,
            "total_penarikan": total_penarikan,
        },
        "truncated": truncated,
    }
```

Add to dispatcher:

```python
_HELPERS["kas_teller_summary"] = _kas_teller_summary
```

- [ ] **Step 3: Verify + commit**

```bash
python3 -c "import ast; ast.parse(open('sekolahpro/koperasi/api/laporan.py').read()); print('ok')"
git add sekolahpro/koperasi/api/laporan.py sekolahpro/koperasi/api/test_laporan.py
git commit -m "feat(laporan): kas_teller_summary helper"
```

---

## Task 5: Backend — XLSX/CSV/PDF export endpoint

**Files (backend):**
- Modify: `sekolahpro/koperasi/api/laporan.py`
- Create: `sekolahpro/koperasi/api/laporan_pdf.html`

- [ ] **Step 1: Implement format generators**

Append to `laporan.py`:

```python
import io
import csv
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment


_CURRENCY_FMT = "#,##0"


def _make_xlsx(title: str, columns: list[dict], rows: list[dict], summary: dict) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Laporan"

    headers = [c["header"] for c in columns]
    keys = [c["key"] for c in columns]

    ws.append([title])
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(headers))
    ws.cell(row=1, column=1).font = Font(bold=True, size=14)

    ws.append([])  # blank
    ws.append(headers)
    header_row = ws.max_row
    for cell in ws[header_row]:
        cell.font = Font(bold=True)
        cell.fill = PatternFill("solid", fgColor="DDDDDD")
        cell.alignment = Alignment(horizontal="left")

    for r in rows:
        ws.append([r.get(k, "") for k in keys])

    # Currency format
    for col_idx, c in enumerate(columns, start=1):
        if c["kind"] == "currency":
            for row_idx in range(header_row + 1, ws.max_row + 1):
                ws.cell(row=row_idx, column=col_idx).number_format = _CURRENCY_FMT

    ws.append([])
    for k, v in summary.items():
        ws.append([k, v])

    out = io.BytesIO()
    wb.save(out)
    return out.getvalue()


def _make_csv(title: str, columns: list[dict], rows: list[dict], summary: dict) -> bytes:
    keys = [c["key"] for c in columns]
    headers = [c["header"] for c in columns]
    out = io.StringIO()
    w = csv.writer(out, quoting=csv.QUOTE_MINIMAL)
    w.writerow([title])
    w.writerow([])
    w.writerow(headers)
    for r in rows:
        w.writerow([r.get(k, "") for k in keys])
    w.writerow([])
    for k, v in summary.items():
        w.writerow([k, v])
    return ("﻿" + out.getvalue()).encode("utf-8")


def _format_cell(row: dict, col: dict) -> str:
    v = row.get(col["key"])
    if v is None or v == "":
        return ""
    kind = col["kind"]
    if kind == "currency":
        try:
            return f"{float(v):,.0f}"
        except (TypeError, ValueError):
            return str(v)
    if kind == "number":
        return str(v)
    return str(v)


def _make_pdf(title: str, columns: list[dict], rows: list[dict],
              summary: dict, meta: dict) -> bytes:
    template_path = frappe.get_app_path("sekolahpro", "koperasi", "api", "laporan_pdf.html")
    with open(template_path, "r", encoding="utf-8") as f:
        template_str = f.read()
    html = frappe.render_template(template_str, {
        "title": title,
        "columns": columns,
        "rows": rows,
        "summary": summary,
        "meta": meta,
        "format_cell": _format_cell,
    })
    from frappe.utils.pdf import get_pdf
    return get_pdf(html)


_TITLES = {
    "rekap_transaksi_simpanan": "Rekap Transaksi Simpanan",
    "rekap_angsuran":            "Rekap Angsuran Pembiayaan",
    "rekap_zis":                 "Rekap ZIS",
    "kas_teller_summary":        "Kas Teller Summary",
}


@frappe.whitelist()
def export(
    laporan: str,
    periode_start: str,
    periode_end: str,
    format: str,
    nasabah: str | None = None,
):
    if laporan not in _HELPERS:
        frappe.throw(f"Laporan tidak dikenal: {laporan}")
    if format not in ("xlsx", "csv", "pdf"):
        frappe.throw(f"Format tidak didukung: {format}")

    start = _parse_date(periode_start)
    end = _parse_date(periode_end)
    data = _HELPERS[laporan](start, end, nasabah)
    title = _TITLES[laporan]
    clean_rows = _strip_source(data["rows"])

    if format == "xlsx":
        body = _make_xlsx(title, data["columns"], clean_rows, data["summary"])
        filename = f"{laporan}_{periode_start}_{periode_end}.xlsx"
        mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif format == "csv":
        body = _make_csv(title, data["columns"], clean_rows, data["summary"])
        filename = f"{laporan}_{periode_start}_{periode_end}.csv"
        mime = "text/csv; charset=utf-8"
    else:  # pdf
        meta = {
            "periode": f"{periode_start} – {periode_end}",
            "nasabah": nasabah or "",
            "generated_at": frappe.utils.now(),
        }
        body = _make_pdf(title, data["columns"], clean_rows, data["summary"], meta)
        filename = f"{laporan}_{periode_start}_{periode_end}.pdf"
        mime = "application/pdf"

    frappe.local.response.filename = filename
    frappe.local.response.filecontent = body
    frappe.local.response.type = "download"
    frappe.local.response.content_type = mime
```

- [ ] **Step 2: Create PDF template**

Create `sekolahpro/koperasi/api/laporan_pdf.html`:

```html
<!doctype html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: Helvetica, Arial, sans-serif; font-size: 10px; color: #222; }
  h1 { font-size: 16px; margin: 0 0 8px; }
  table.meta { margin-bottom: 12px; font-size: 9px; color: #555; }
  table.meta th { text-align: left; padding-right: 8px; font-weight: 600; }
  table.data { width: 100%; border-collapse: collapse; }
  table.data th, table.data td { border: 1px solid #ccc; padding: 4px 6px; }
  table.data thead th { background: #eee; font-weight: 700; text-align: left; }
  table.data tbody tr:nth-child(even) td { background: #fafafa; }
  td.kind-currency, td.kind-number { text-align: right; font-variant-numeric: tabular-nums; }
  table.summary { margin-top: 12px; font-size: 10px; }
  table.summary th { text-align: left; padding-right: 12px; }
  table.summary td { text-align: right; font-variant-numeric: tabular-nums; }
</style>
</head><body>
  <h1>{{ title }}</h1>
  <table class="meta">
    <tr><th>Periode</th><td>{{ meta.periode }}</td></tr>
    <tr><th>Filter Nasabah</th><td>{{ meta.nasabah or "—" }}</td></tr>
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
        <td class="kind-{{ c.kind }}">{{ format_cell(row, c) }}</td>
        {% endfor %}
      </tr>
      {% endfor %}
    </tbody>
  </table>
  <table class="summary">
    {% for k, v in summary.items() %}
    <tr><th>{{ k }}</th><td>{{ "{:,.0f}".format(v) if v is number else v }}</td></tr>
    {% endfor %}
  </table>
</body></html>
```

- [ ] **Step 3: Add tests**

Append to `test_laporan.py`:

```python
def test_export_xlsx_bytes(self):
    from sekolahpro.koperasi.api.laporan import export
    # Smoke: just verify the call doesn't raise on empty data
    export(
        laporan="rekap_transaksi_simpanan",
        periode_start="2099-01-01",
        periode_end="2099-12-31",
        format="xlsx",
    )
    self.assertEqual(frappe.local.response.content_type,
                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

def test_export_csv_bom(self):
    from sekolahpro.koperasi.api.laporan import export
    export(
        laporan="rekap_zis",
        periode_start="2099-01-01",
        periode_end="2099-12-31",
        format="csv",
    )
    self.assertEqual(frappe.local.response.content_type, "text/csv; charset=utf-8")
    self.assertTrue(frappe.local.response.filecontent.startswith(b"\xef\xbb\xbf"))

def test_export_rejects_unknown_format(self):
    from sekolahpro.koperasi.api.laporan import export
    with self.assertRaises(frappe.ValidationError):
        export(
            laporan="rekap_zis",
            periode_start="2099-01-01",
            periode_end="2099-12-31",
            format="txt",
        )
```

- [ ] **Step 4: Verify + commit**

```bash
python3 -c "import ast; ast.parse(open('sekolahpro/koperasi/api/laporan.py').read()); print('ok')"
git add sekolahpro/koperasi/api/laporan.py sekolahpro/koperasi/api/laporan_pdf.html sekolahpro/koperasi/api/test_laporan.py
git commit -m "feat(laporan): export endpoint with XLSX/PDF/CSV format builders"
```

---

## Task 6: Backend — API doc

**Files (backend):**
- Create: `docs/api/koperasi-laporan.md`

- [ ] **Step 1: Write doc**

Create `docs/api/koperasi-laporan.md`:

```markdown
# API: Koperasi Laporan

**Module path:** `sekolahpro.koperasi.api.laporan`

**Auth:** Login required (session cookie or API key).

---

## `GET /api/method/sekolahpro.koperasi.api.laporan.preview`

Query params:
- `laporan` — one of: `rekap_transaksi_simpanan`, `rekap_angsuran`, `rekap_zis`, `kas_teller_summary`
- `periode_start` — `YYYY-MM-DD`
- `periode_end` — `YYYY-MM-DD`
- `nasabah` — optional doc name; ignored by `kas_teller_summary` and by Penyaluran rows in `rekap_zis`

**Response 200:**

```json
{
  "message": {
    "columns": [{"key": "tanggal", "header": "Tanggal", "kind": "date"}, ...],
    "rows": [{
      "tanggal": "2026-03-15",
      "rekening": "RS-2026-0001",
      "jenis": "Setoran",
      "jumlah": 250000,
      ...,
      "_source": {"doctype": "Transaksi Simpanan", "name": "TS-2026-0123"}
    }],
    "summary": {"total_setoran": 1234567, ...},
    "truncated": false
  }
}
```

`_source` is UI-only and is stripped from export rows.

Rows are capped at 5000. When `truncated=true`, narrow the periode.

## `GET /api/method/sekolahpro.koperasi.api.laporan.export`

Same params plus:
- `format` — `xlsx` | `pdf` | `csv`

Returns binary attachment.

## Kolektibilitas buckets (rekap_angsuran)

| `hari_telat` | `kolektibilitas` |
|--------------|------------------|
| 0–30         | Lancar           |
| 31–60        | Kurang Lancar    |
| 61–90        | Diragukan        |
| 91+          | Macet            |
```

- [ ] **Step 2: Commit**

```bash
git add docs/api/koperasi-laporan.md
git commit -m "docs(api): koperasi laporan preview + export endpoints"
```

---

## Task 7: Backend — push + PR

**Files:** none.

- [ ] **Step 1: Push backend branch**

```bash
cd /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro
git push -u origin feat/laporan-api 2>&1 | tail -3
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --base main --title "feat(koperasi): Laporan preview + XLSX/PDF/CSV export API" --body "$(cat <<'EOF'
## Summary

Adds \`sekolahpro.koperasi.api.laporan\` with \`preview\` + \`export\` whitelisted methods.

- 4 laporan types: rekap_transaksi_simpanan, rekap_angsuran (with 4-bucket kolektibilitas), rekap_zis, kas_teller_summary
- 3 export formats: XLSX (openpyxl), PDF (frappe.utils.pdf + Jinja template), CSV (stdlib, UTF-8 with BOM)
- Each preview row carries \`_source: {doctype, name}\` for frontend drill-down; stripped from exports
- 5000-row cap with \`truncated\` flag

Required by frontend PR (web-dashboard).

## Test plan
- [ ] \`bench run-tests --app sekolahpro --module sekolahpro.koperasi.api.test_laporan\`
- [ ] Manual GET preview + export for each of 4 laporan types

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" 2>&1 | tail -3
```

Record PR URL.

---

## Task 8: Frontend — service + types

**Files (frontend):**
- Create: `web-dashboard/src/services/koperasi/laporan.service.ts`
- Create: `web-dashboard/src/__ui_tests__/laporan.service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__ui_tests__/laporan.service.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/services/api.client'
import { laporanService, getDrillDownPath } from '@/services/koperasi/laporan.service'

const mockGet = vi.mocked(apiClient.get)

describe('laporanService.preview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls the preview endpoint with required params', async () => {
    mockGet.mockResolvedValue({
      message: { columns: [], rows: [], summary: {}, truncated: false },
    })
    await laporanService.preview({
      laporan: 'rekap_zis',
      periode_start: '2026-01-01',
      periode_end: '2026-12-31',
    })
    expect(mockGet).toHaveBeenCalledTimes(1)
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('/api/method/sekolahpro.koperasi.api.laporan.preview')
    expect(url).toContain('laporan=rekap_zis')
    expect(url).toContain('periode_start=2026-01-01')
    expect(url).toContain('periode_end=2026-12-31')
    expect(url).not.toContain('nasabah=')
  })

  it('includes nasabah param when provided', async () => {
    mockGet.mockResolvedValue({
      message: { columns: [], rows: [], summary: {}, truncated: false },
    })
    await laporanService.preview({
      laporan: 'rekap_transaksi_simpanan',
      periode_start: '2026-01-01',
      periode_end: '2026-12-31',
      nasabah: 'NAS-001',
    })
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('nasabah=NAS-001')
  })
})

describe('laporanService.export', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requests blob for xlsx format', async () => {
    const blob = new Blob(['xlsx'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    mockGet.mockResolvedValue(blob)
    const result = await laporanService.export(
      { laporan: 'rekap_angsuran', periode_start: '2026-01-01', periode_end: '2026-12-31' },
      'xlsx',
    )
    expect(result).toBeInstanceOf(Blob)
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('/api/method/sekolahpro.koperasi.api.laporan.export')
    expect(url).toContain('format=xlsx')
  })
})

describe('getDrillDownPath', () => {
  it('routes ZIS to detail pages', () => {
    expect(getDrillDownPath({ doctype: 'Penerimaan ZIS', name: 'PZ-001' }))
      .toBe('/koperasi/zis/penerimaan/PZ-001')
    expect(getDrillDownPath({ doctype: 'Penyaluran ZIS', name: 'YZ-001' }))
      .toBe('/koperasi/zis/penyaluran/YZ-001')
  })

  it('routes Sesi Kas Teller to its detail page', () => {
    expect(getDrillDownPath({ doctype: 'Sesi Kas Teller', name: 'SST-001' }))
      .toBe('/koperasi/kas-teller/SST-001')
  })

  it('returns null for doctypes without a frontend detail page', () => {
    expect(getDrillDownPath({ doctype: 'Transaksi Simpanan', name: 'TS-001' })).toBeNull()
    expect(getDrillDownPath({ doctype: 'Pembayaran Angsuran', name: 'PA-001' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run failing test**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/web-dashboard
npx vitest run src/__ui_tests__/laporan.service.test.ts --reporter=basic 2>&1 | tail -10
```

Expected: module-not-found / import error.

- [ ] **Step 3: Implement service**

Create `src/services/koperasi/laporan.service.ts`:

```ts
// src/services/koperasi/laporan.service.ts

import { apiClient } from '@/services/api.client'

export type LaporanNama =
  | 'rekap_transaksi_simpanan'
  | 'rekap_angsuran'
  | 'rekap_zis'
  | 'kas_teller_summary'

export type ExportFormat = 'xlsx' | 'pdf' | 'csv'

export interface PreviewParams {
  laporan: LaporanNama
  periode_start: string  // YYYY-MM-DD
  periode_end: string
  nasabah?: string
}

export interface LaporanColumn {
  key: string
  header: string
  kind: 'date' | 'text' | 'currency' | 'number'
}

export interface LaporanSource {
  doctype: string
  name: string
}

export interface LaporanRow extends Record<string, unknown> {
  _source?: LaporanSource
}

export interface LaporanPreview {
  columns: LaporanColumn[]
  rows: LaporanRow[]
  summary: Record<string, number>
  truncated: boolean
}

interface FrappeMethodResponse<T> {
  message: T
}

const PREVIEW = '/api/method/sekolahpro.koperasi.api.laporan.preview'
const EXPORT = '/api/method/sekolahpro.koperasi.api.laporan.export'

function buildQS(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, v)
  }
  return sp.toString()
}

export const laporanService = {
  async preview(params: PreviewParams): Promise<LaporanPreview> {
    const qs = buildQS({
      laporan: params.laporan,
      periode_start: params.periode_start,
      periode_end: params.periode_end,
      nasabah: params.nasabah,
    })
    const res = await apiClient.get<FrappeMethodResponse<LaporanPreview>>(`${PREVIEW}?${qs}`)
    return res.message
  },

  async export(params: PreviewParams, format: ExportFormat): Promise<Blob> {
    const qs = buildQS({
      laporan: params.laporan,
      periode_start: params.periode_start,
      periode_end: params.periode_end,
      nasabah: params.nasabah,
      format,
    })
    return apiClient.get<Blob>(`${EXPORT}?${qs}`)
  },
}

const DRILL_DOWN_MAP: Record<string, (name: string) => string> = {
  'Penerimaan ZIS': (name) => `/koperasi/zis/penerimaan/${encodeURIComponent(name)}`,
  'Penyaluran ZIS': (name) => `/koperasi/zis/penyaluran/${encodeURIComponent(name)}`,
  'Sesi Kas Teller': (name) => `/koperasi/kas-teller/${encodeURIComponent(name)}`,
}

export function getDrillDownPath(source: LaporanSource): string | null {
  const fn = DRILL_DOWN_MAP[source.doctype]
  return fn ? fn(source.name) : null
}

export function getFrappeDeskUrl(source: LaporanSource): string {
  return `/app/${encodeURIComponent(source.doctype.toLowerCase().replace(/ /g, '-'))}/${encodeURIComponent(source.name)}`
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__ui_tests__/laporan.service.test.ts --reporter=basic 2>&1 | tail -10
```

Expected: all pass.

- [ ] **Step 5: tsc + commit**

```bash
npx tsc -b 2>&1 | grep -c "error TS"  # expect 0
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/services/koperasi/laporan.service.ts web-dashboard/src/__ui_tests__/laporan.service.test.ts
git commit -m "feat(koperasi): laporanService with preview+export+getDrillDownPath helpers"
```

---

## Task 9: Frontend — refactor LaporanKoperasiPage with preview + 3 exports + drill-down

**Files (frontend):**
- Modify: `web-dashboard/src/pages/koperasi/laporan/LaporanKoperasiPage.tsx`
- Possibly modify: `web-dashboard/src/pages/koperasi/laporan/LaporanKoperasiPage.module.css` (if module CSS exists)

- [ ] **Step 1: Read the current page + DataTable widget contract**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/web-dashboard
wc -l src/pages/koperasi/laporan/LaporanKoperasiPage.tsx
head -100 src/pages/koperasi/laporan/LaporanKoperasiPage.tsx
grep -E "^export interface|onRowClick|getRowId" src/widgets/DataTable/DataTable.tsx | head -10
```

Note the existing inline-style approach; preview section will follow the same inline-style convention to minimize CSS file changes.

- [ ] **Step 2: Replace page contents**

Replace `LaporanKoperasiPage.tsx` with:

```tsx
// src/pages/koperasi/laporan/LaporanKoperasiPage.tsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, FileText, FileDown, Eye } from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { DataTable, type ColumnDef } from '@/widgets/DataTable/DataTable'
import { toast } from '@/widgets/Toast/Toast'
import { formatCurrency, formatNumber } from '@/utils/format'
import {
  laporanService,
  getDrillDownPath,
  getFrappeDeskUrl,
  type LaporanNama,
  type ExportFormat,
  type PreviewParams,
  type LaporanRow,
  type LaporanColumn,
} from '@/services/koperasi/laporan.service'

const LAPORAN_OPTIONS: { value: LaporanNama; label: string; description: string }[] = [
  { value: 'rekap_transaksi_simpanan', label: 'Rekap Transaksi Simpanan',
    description: 'Setoran, penarikan, bagi hasil, bunga per periode.' },
  { value: 'rekap_angsuran',           label: 'Rekap Angsuran Pembiayaan',
    description: 'Pembayaran angsuran + kolektibilitas (Lancar/Kurang Lancar/Diragukan/Macet).' },
  { value: 'rekap_zis',                label: 'Rekap ZIS',
    description: 'Penerimaan + penyaluran ZIS.' },
  { value: 'kas_teller_summary',       label: 'Kas Teller Summary',
    description: 'Sesi kas selesai + rekonsiliasi.' },
]

function buildColumns(cols: LaporanColumn[]): ColumnDef<LaporanRow>[] {
  return cols.map((c) => ({
    key: c.key,
    header: c.header,
    render: (_v, row) => {
      const v = row[c.key]
      if (v === null || v === undefined || v === '') return '—'
      if (c.kind === 'currency') return formatCurrency(Number(v))
      if (c.kind === 'number') return formatNumber(Number(v))
      if (c.kind === 'date') return String(v)
      return String(v)
    },
  }))
}

function SummaryGrid({ summary }: { summary: Record<string, number> }) {
  const entries = Object.entries(summary)
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 12,
      marginBottom: 16,
    }}>
      {entries.map(([k, v]) => {
        const isCount = k.startsWith('count_')
        return (
          <div key={k} style={{
            background: 'white',
            border: '1px solid var(--color-slate-200)',
            borderRadius: 8,
            padding: '12px 14px',
          }}>
            <p style={{ fontSize: 11, color: 'var(--color-slate-500)', margin: 0, textTransform: 'capitalize' }}>
              {k.replace(/_/g, ' ')}
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 0' }}>
              {isCount ? formatNumber(v) : formatCurrency(v)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export function LaporanKoperasiPage() {
  const navigate = useNavigate()
  const [laporanNama, setLaporanNama] = useState<LaporanNama>('rekap_transaksi_simpanan')
  const [periodeStart, setPeriodeStart] = useState('')
  const [periodeEnd, setPeriodeEnd] = useState('')
  const [nasabah, setNasabah] = useState('')
  const [previewParams, setPreviewParams] = useState<PreviewParams | null>(null)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const selected = LAPORAN_OPTIONS.find((l) => l.value === laporanNama)!

  const previewQuery = useQuery({
    queryKey: ['laporan', 'preview', previewParams],
    queryFn: () => laporanService.preview(previewParams!),
    enabled: previewParams !== null,
  })

  function validate(): PreviewParams | null {
    if (!periodeStart || !periodeEnd) {
      toast.error('Periode wajib diisi.')
      return null
    }
    if (periodeStart > periodeEnd) {
      toast.error('Periode awal lebih besar dari akhir.')
      return null
    }
    return {
      laporan: laporanNama,
      periode_start: periodeStart,
      periode_end: periodeEnd,
      nasabah: nasabah || undefined,
    }
  }

  function handlePreview() {
    const params = validate()
    if (params) setPreviewParams(params)
  }

  async function handleExport(format: ExportFormat) {
    const params = validate()
    if (!params) return
    setExporting(format)
    try {
      const blob = await laporanService.export(params, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${laporanNama}_${periodeStart}_${periodeEnd}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Laporan ${format.toUpperCase()} berhasil diunduh.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunduh laporan.')
    } finally {
      setExporting(null)
    }
  }

  function handleRowClick(row: LaporanRow) {
    const source = row._source
    if (!source) return
    const path = getDrillDownPath(source)
    if (path) {
      navigate(path)
    } else {
      window.open(getFrappeDeskUrl(source), '_blank', 'noopener')
    }
  }

  const data = previewQuery.data
  const isPreviewing = previewQuery.isFetching

  return (
    <>
      <PageHeader title="Laporan Koperasi" subtitle="Preview + export laporan operasional koperasi" />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Filter card */}
        <div style={{
          background: 'white',
          border: '1px solid var(--color-slate-200)',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>Jenis Laporan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LAPORAN_OPTIONS.map((opt) => (
                <label key={opt.value} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  border: `1.5px solid ${laporanNama === opt.value ? 'var(--color-indigo-500)' : 'var(--color-slate-200)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: laporanNama === opt.value ? 'var(--color-indigo-50)' : 'white',
                }}>
                  <input
                    type="radio"
                    name="laporan"
                    value={opt.value}
                    checked={laporanNama === opt.value}
                    onChange={(e) => {
                      setLaporanNama(e.target.value as LaporanNama)
                      setPreviewParams(null)
                    }}
                    style={{ marginTop: 4 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-slate-600)' }}>{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <span>Periode Awal *</span>
              <input type="date" value={periodeStart} onChange={(e) => setPeriodeStart(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <span>Periode Akhir *</span>
              <input type="date" value={periodeEnd} onChange={(e) => setPeriodeEnd(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <span>Nasabah (opsional)</span>
              <input
                type="text"
                placeholder="NAS-..."
                value={nasabah}
                onChange={(e) => setNasabah(e.target.value)}
                disabled={selected.value === 'kas_teller_summary'}
              />
              {selected.value === 'kas_teller_summary' && (
                <small style={{ color: 'var(--color-slate-500)' }}>
                  Filter nasabah tidak berlaku untuk laporan ini.
                </small>
              )}
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={handlePreview} disabled={isPreviewing}>
              <Eye size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {isPreviewing ? 'Memuat…' : 'Preview'}
            </button>
            <button type="button" onClick={() => handleExport('xlsx')} disabled={exporting !== null}>
              <FileSpreadsheet size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {exporting === 'xlsx' ? 'Export…' : 'Excel'}
            </button>
            <button type="button" onClick={() => handleExport('pdf')} disabled={exporting !== null}>
              <FileText size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {exporting === 'pdf' ? 'Export…' : 'PDF'}
            </button>
            <button type="button" onClick={() => handleExport('csv')} disabled={exporting !== null}>
              <FileDown size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {exporting === 'csv' ? 'Export…' : 'CSV'}
            </button>
          </div>
        </div>

        {/* Preview section */}
        {previewQuery.isError && (
          <div style={{ padding: 16, background: 'var(--color-red-50)', border: '1px solid var(--color-red-200)', borderRadius: 8 }}>
            Gagal memuat preview: {previewQuery.error instanceof Error ? previewQuery.error.message : 'Unknown error'}
          </div>
        )}

        {data && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              Preview — {selected.label}
            </h3>

            {data.truncated && (
              <div style={{
                marginBottom: 12,
                padding: '10px 14px',
                background: 'var(--color-amber-50)',
                border: '1px solid var(--color-amber-200)',
                borderRadius: 8,
                fontSize: 13,
              }}>
                Menampilkan 5000 baris pertama. Persempit periode untuk hasil lengkap.
              </div>
            )}

            <SummaryGrid summary={data.summary} />

            {data.rows.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-slate-500)' }}>
                Tidak ada data pada periode ini.
              </div>
            ) : (
              <DataTable
                columns={buildColumns(data.columns)}
                rows={data.rows}
                getRowId={(row) => (row._source?.name as string) ?? Math.random().toString(36)}
                onRowClick={handleRowClick}
              />
            )}
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 3: Verify DataTable contract**

If `DataTable` accepts `onRowClick` and `getRowId` props, code above works. If not:

```bash
grep -E "onRowClick|getRowId|rowKey" src/widgets/DataTable/DataTable.tsx | head -10
```

If `onRowClick` is missing, fall back to a click-handler `onClick` wrapper on each row externally — but most `DataTable` implementations support it. If `getRowId` is named differently (e.g. `rowKey`), adjust.

If both are missing entirely, the simplest fallback is to render `<tr onClick={...}>` ourselves outside `DataTable` (a 30-line custom table). Note in commit.

- [ ] **Step 4: tsc + vite + vitest**

```bash
cd web-dashboard
npx tsc -b 2>&1 | grep -c "error TS"  # expect 0
npx vite build 2>&1 | tail -3
npx vitest run --reporter=basic 2>&1 | tail -5
```

All green. Vitest pass count should still be ≥ baseline (124 from PR #10 merge).

- [ ] **Step 5: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/src/pages/koperasi/laporan/LaporanKoperasiPage.tsx
git commit -m "feat(laporan): preview table + summary cards + XLSX/PDF/CSV export + drill-down

Preview button fetches via React Query. Each row in DataTable becomes
clickable: route to frontend detail page if registered, else open
Frappe desk in a new tab. Truncated banner when >5000 rows."
```

---

## Task 10: Frontend — smoke API extension

**Files (frontend):**
- Modify: `web-dashboard/scripts/smoke-koperasi-api.mjs`

- [ ] **Step 1: Add cases**

Read the existing file to confirm the `cases` array convention:

```bash
grep -B2 -A10 "Sesi Kas Teller\|sesi_kas" web-dashboard/scripts/smoke-koperasi-api.mjs | head -30
```

Append (adjust to the existing case shape) at the end of the array:

```js
{
  name: 'Method: laporan.preview rekap_zis (30-day window)',
  path: `/api/method/sekolahpro.koperasi.api.laporan.preview?laporan=rekap_zis&periode_start=2026-04-11&periode_end=2026-05-11`,
  validate: (json) => {
    if (!json.message) throw new Error('Missing message')
    if (!Array.isArray(json.message.columns)) throw new Error('Missing columns array')
    if (!Array.isArray(json.message.rows)) throw new Error('Missing rows array')
    if (typeof json.message.truncated !== 'boolean') throw new Error('Missing truncated')
    return true
  },
},
{
  name: 'Method: laporan.export rekap_zis xlsx (content-type)',
  path: `/api/method/sekolahpro.koperasi.api.laporan.export?laporan=rekap_zis&periode_start=2026-04-11&periode_end=2026-05-11&format=xlsx`,
  // Validate via response headers, not body
  responseCheck: (res) => {
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('spreadsheetml')) {
      throw new Error(`Expected XLSX content-type, got ${ct}`)
    }
    return true
  },
},
```

(Adapt to whatever the existing case shape uses — `responseCheck` may be inline `validate` with custom signature. Read first.)

- [ ] **Step 2: Commit**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git add web-dashboard/scripts/smoke-koperasi-api.mjs
git commit -m "test(smoke): add laporan preview + export xlsx checks"
```

---

## Task 11: Frontend — push + PR

**Files:** none.

- [ ] **Step 1: Push**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3
git push -u origin feat/laporan-koperasi 2>&1 | tail -3
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --base main --title "feat(koperasi): Laporan preview + XLSX/PDF/CSV export with drill-down" --body "$(cat <<'EOF'
## Summary

Adds preview + XLSX/PDF/CSV export for the 4 existing laporan types:
- rekap_transaksi_simpanan
- rekap_angsuran (with 4-bucket kolektibilitas: Lancar / Kurang Lancar / Diragukan / Macet)
- rekap_zis
- kas_teller_summary

Each preview row carries \`_source: {doctype, name}\` and is clickable — routes to the frontend detail page for ZIS / Sesi Kas Teller, falls back to Frappe desk for Transaksi Simpanan / Pembayaran Angsuran (no frontend detail pages yet).

**Depends on backend PR** (see other PR in sekolahpro3 repo).

## Changes

- New service \`laporan.service.ts\` with \`preview\`, \`export\`, \`getDrillDownPath\`, \`getFrappeDeskUrl\`
- Refactored \`LaporanKoperasiPage\` to add Preview button + 3 export buttons (Excel/PDF/CSV) + summary cards + DataTable
- Smoke API: 2 new endpoint checks

## Test plan
- [ ] \`npx tsc -b\` exits 0
- [ ] \`npx vite build\` succeeds
- [ ] \`npx vitest run\` — new tests pass, no regressions
- [ ] Manual: each of the 4 laporan types → Preview → see table + summary
- [ ] Manual: download XLSX, PDF, CSV for each type
- [ ] Manual: click a row in rekap_zis preview → routes to ZIS detail
- [ ] Manual: click a row in rekap_transaksi_simpanan → opens Frappe desk in new tab
- [ ] \`npm run smoke:api\` — 2 new cases pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" 2>&1 | tail -3
```

Record URL.

---

## Verification matrix

| After task | Status |
|-----------|--------|
| 0 baseline | tsc 0, vite green |
| 1 backend dispatch + first helper | Python syntax ok, 3 tests written |
| 2 angsuran helper | 4-bucket kolektibilitas tested |
| 3 zis helper | union pattern tested |
| 4 kas_teller_summary helper | 4 helpers complete |
| 5 export endpoint | XLSX/PDF/CSV builders tested |
| 6 backend docs | api doc complete |
| 7 backend PR | branch pushed, PR opened |
| 8 frontend service | unit tests pass |
| 9 frontend page | preview + exports + drill-down working |
| 10 smoke API | 2 new cases added |
| 11 frontend PR | branch pushed, PR opened |

## Rollback

Each task is one commit (Task 5 is the biggest single commit). Revert any single task if it breaks. Backend and frontend PRs are independent (frontend PR will return 404s on preview/export until backend PR merges — surface as toast errors; not a build break).

## Open questions surfaced during implementation

- **DataTable widget contract:** If `onRowClick` / `getRowId` props don't exist or are named differently, Task 9 Step 3 has fallback notes.
- **PDF rendering time on large datasets:** Spec mentions wkhtmltopdf can take seconds for >1000 rows. No client-side timeout in this plan — relies on backend gateway timeout. Add explicit timeout if reports of slow PDF surface.
- **CSV BOM compatibility:** UTF-8 BOM is added so Excel opens it cleanly. Users of CSV in code pipelines should strip the BOM. Documented in API doc.
