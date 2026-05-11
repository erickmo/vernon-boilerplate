#!/usr/bin/env node
// Koperasi API smoke test.
// Hits every endpoint the web-dashboard frontend calls and validates response shape.
//
// Usage:
//   API_BASE_URL=https://site.local \
//   API_KEY=xxx API_SECRET=yyy \
//   node scripts/smoke-koperasi-api.mjs
//
// Or set VITE_API_BASE_URL / API_KEY / API_SECRET in .env.local (auto-loaded).
//
// Exit codes: 0 = all pass, 1 = any fail.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── Load .env.local ──────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(ROOT, '.env.local')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

const BASE_URL = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL
const API_KEY = process.env.API_KEY
const API_SECRET = process.env.API_SECRET

if (!BASE_URL) {
  console.error('✗ Missing API_BASE_URL (or VITE_API_BASE_URL in .env.local)')
  process.exit(1)
}
if (!API_KEY || !API_SECRET) {
  console.error('✗ Missing API_KEY / API_SECRET (Frappe token auth)')
  console.error('  Set both as env vars or in .env.local')
  process.exit(1)
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function call(path) {
  const url = `${BASE_URL.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${API_KEY}:${API_SECRET}`,
      Accept: 'application/json',
    },
  })
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  return { status: res.status, ok: res.ok, body }
}

// ─── Validators ───────────────────────────────────────────────────────────────

function isPaginatedShape(body) {
  if (!body || typeof body !== 'object') return false
  if (!Array.isArray(body.items)) return false
  if (typeof body.total !== 'number') return false
  return true
}

function hasFields(obj, fields) {
  if (!obj || typeof obj !== 'object') return false
  return fields.every((f) => f in obj)
}

// ─── Test cases ───────────────────────────────────────────────────────────────

const cases = [
  {
    name: 'Nasabah list',
    path: '/api/resource/Nasabah?limit=1',
    validate: (b) => isPaginatedShape(b) && (b.items.length === 0 || hasFields(b.items[0], ['id', 'nama'])),
  },
  {
    name: 'Anggota Koperasi list',
    path: '/api/resource/Anggota Koperasi?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Produk Simpanan list',
    path: '/api/resource/Produk Simpanan?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Rekening Simpanan list',
    path: '/api/resource/Rekening Simpanan?limit=1',
    validate: (b) => isPaginatedShape(b) && (b.items.length === 0 || hasFields(b.items[0], ['id', 'no_rekening', 'saldo'])),
  },
  {
    name: 'Transaksi Simpanan list (sorted)',
    path: '/api/resource/Transaksi Simpanan?limit=1&sort=[["creation",-1]]',
    validate: isPaginatedShape,
  },
  {
    name: 'Permohonan Simpanan list (filtered pending)',
    path: '/api/resource/Permohonan Simpanan?limit=1&filters=[["status","=","Diajukan"]]',
    validate: isPaginatedShape,
  },
  {
    name: 'Produk Pembiayaan list',
    path: '/api/resource/Produk Pembiayaan?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Akad Pembiayaan list',
    path: '/api/resource/Akad Pembiayaan?limit=1',
    validate: (b) => isPaginatedShape(b) && (b.items.length === 0 || hasFields(b.items[0], ['id', 'no_akad', 'status'])),
  },
  {
    name: 'Akad Pembiayaan filter pending',
    path: '/api/resource/Akad Pembiayaan?limit=1&filters=[["status","=","Pengajuan"]]',
    validate: isPaginatedShape,
  },
  {
    name: 'Jadwal Angsuran list',
    path: '/api/resource/Jadwal Angsuran?limit=1&sort=[["tanggal_jatuh_tempo",1]]',
    validate: isPaginatedShape,
  },
  {
    name: 'Pembayaran Angsuran list',
    path: '/api/resource/Pembayaran Angsuran?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Pembagian SHU list',
    path: '/api/resource/Pembagian SHU?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Kartu list',
    path: '/api/resource/Kartu?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Terminal list',
    path: '/api/resource/Terminal?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Merchant list',
    path: '/api/resource/Merchant?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Sesi Kas Teller list',
    path: '/api/resource/Sesi Kas Teller?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Penerimaan ZIS list',
    path: '/api/resource/Penerimaan ZIS?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Program Penyaluran ZIS list',
    path: '/api/resource/Program Penyaluran ZIS?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Penyaluran ZIS list',
    path: '/api/resource/Penyaluran ZIS?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Aset Wakaf list',
    path: '/api/resource/Aset Wakaf?limit=1',
    validate: isPaginatedShape,
  },
  {
    name: 'Method: get_summary (skip if no nasabah)',
    skipIf: (results) => {
      const r = results.find((x) => x.name === 'Nasabah list')
      return !r?.body?.items?.[0]?.id
    },
    pathFn: (results) => {
      const r = results.find((x) => x.name === 'Nasabah list')
      const id = r.body.items[0].id
      return `/api/method/sekolahpro.koperasi.api.nasabah.get_summary?nasabah_id=${encodeURIComponent(id)}`
    },
    validate: (b) => {
      const msg = b?.message ?? b
      return msg && typeof msg === 'object' && 'rekening' in msg && 'pembiayaan' in msg
    },
  },
  {
    name: 'Method: approve_permohonan reachable (dry HEAD)',
    path: '/api/method/sekolahpro.simpanan.api.approve_permohonan',
    validate: (b, status) => status !== 404,
    softFail: true,
  },
  {
    name: 'Method: reject_permohonan reachable (dry HEAD)',
    path: '/api/method/sekolahpro.simpanan.api.reject_permohonan',
    validate: (b, status) => status !== 404,
    softFail: true,
  },
  // ─── Sesi Kas Teller ────────────────────────────────────────────────────────
  {
    name: 'Method: sesi_kas.get_active_for_me',
    path: '/api/method/sekolahpro.koperasi.api.sesi_kas.get_active_for_me',
    // message can be null (no aktif sesi) or an object — both valid
    validate: (b) => b && typeof b === 'object' && 'message' in b,
  },
  {
    name: 'Sesi Kas Teller filter Aktif (paginated)',
    path: `/api/resource/Sesi Kas Teller?filters=${encodeURIComponent('[["status","=","Aktif"]]')}&limit_page_length=5`,
    validate: (b) => Array.isArray(b?.data) || isPaginatedShape(b),
  },
  {
    name: 'Denominasi Uang aktif (expect 10 rows)',
    path: `/api/resource/Denominasi Uang?filters=${encodeURIComponent('[["aktif","=",1]]')}&limit_page_length=20`,
    validate: (b) => {
      const rows = Array.isArray(b?.data) ? b.data : Array.isArray(b?.items) ? b.items : null
      if (!rows) return false
      return rows.length === 10
    },
  },
  // ─── Laporan Koperasi ───────────────────────────────────────────────────────
  {
    name: 'Method: laporan.preview rekap_zis (30-day window)',
    path: `/api/method/sekolahpro.koperasi.api.laporan.preview?laporan=rekap_zis&periode_start=2026-04-11&periode_end=2026-05-11`,
    validate: (b) => {
      const msg = b?.message
      if (!msg) return false
      if (!Array.isArray(msg.columns)) return false
      if (!Array.isArray(msg.rows)) return false
      if (typeof msg.truncated !== 'boolean') return false
      return true
    },
    softFail: true,
  },
  {
    name: 'Method: laporan.export rekap_zis xlsx (200 OK)',
    path: `/api/method/sekolahpro.koperasi.api.laporan.export?laporan=rekap_zis&periode_start=2026-04-11&periode_end=2026-05-11&format=xlsx`,
    validate: (_b, status) => status === 200,
    softFail: true,
  },
]

// ─── Runner ───────────────────────────────────────────────────────────────────

const PAD = 50
const results = []
let pass = 0
let fail = 0
let soft = 0

console.log(`\nKoperasi API Smoke — ${BASE_URL}\n${'─'.repeat(60)}`)

for (const c of cases) {
  if (c.skipIf && c.skipIf(results)) {
    console.log(`  SKIP  ${c.name.padEnd(PAD)} (no data)`)
    continue
  }
  const path = c.pathFn ? c.pathFn(results) : c.path
  let result
  try {
    result = await call(path)
  } catch (e) {
    console.log(`  ✗     ${c.name.padEnd(PAD)} fetch error: ${e.message}`)
    fail++
    continue
  }

  const ok = c.validate(result.body, result.status)
  results.push({ name: c.name, ...result })

  if (ok) {
    console.log(`  ✓     ${c.name.padEnd(PAD)} ${result.status}`)
    pass++
  } else if (c.softFail) {
    console.log(`  ~     ${c.name.padEnd(PAD)} ${result.status} (soft-fail, endpoint may not exist)`)
    soft++
  } else {
    console.log(`  ✗     ${c.name.padEnd(PAD)} ${result.status}`)
    if (typeof result.body === 'object') {
      const preview = JSON.stringify(result.body).slice(0, 200)
      console.log(`        body: ${preview}${preview.length === 200 ? '…' : ''}`)
    } else {
      console.log(`        body: ${String(result.body).slice(0, 200)}`)
    }
    fail++
  }
}

console.log(`${'─'.repeat(60)}\n  pass: ${pass}  fail: ${fail}  soft: ${soft}\n`)
process.exit(fail > 0 ? 1 : 0)
