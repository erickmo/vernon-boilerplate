# SekolahPro3

## Communication

- Use caveman mode by default.
- Keep responses terse, direct, and technical.

## Dev Rules

- Use `rtk-tdd` for all Rust implementation and bugfix work.
- Start with a failing test, then minimal code to pass, then refactor.
- Run the Rust verification gate before calling work done:
  - `cargo fmt --all --check`
  - `cargo clippy --all-targets`
  - `cargo test`

## API Source

Proyek ini TIDAK menggunakan `boilerplate/api/`.

Backend API → Frappe/ERPNext app di:
```
../frappe/apps/sekolahpro
```

### API Docs
```
../frappe/apps/sekolahpro/docs/api/README.md          ← Auth, base URL, format request
../frappe/apps/sekolahpro/docs/api/akademik-absensi.md
../frappe/apps/sekolahpro/docs/api/akademik-laporan.md
../frappe/apps/sekolahpro/docs/api/koperasi-kartu.md
```

### Base URL Pattern
```
POST https://<site>/api/method/sekolahpro.<module>.api.<endpoint>
```

### Auth
- **Session**: cookie `sid` (Frappe desk)
- **API Key**: `Authorization: token <api_key>:<api_secret>`
- **Terminal**: `X-Terminal-Id` + `X-Api-Key` (koperasi kartu endpoints)

## Dashboard Types

Aplikasi ini memiliki 2 jenis dashboard:

### 1. Dashboard Sekolah
- Untuk siswa, guru, dan admin sekolah
- Fitur: absensi, akademik, laporan nilai, jadwal, informasi sekolah

### 2. Dashboard Koperasi
- Untuk pengelola dan anggota koperasi sekolah
- Fitur: kartu koperasi, transaksi, saldo, laporan koperasi

## Stack Skills

~/.claude/skills/flutter-coding-standard/SKILL.md
~/.claude/skills/mobile-design/SKILL.md
~/.claude/skills/erpnext-api/SKILL.md
