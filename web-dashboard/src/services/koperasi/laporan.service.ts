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
  periode_start: string // YYYY-MM-DD
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
  const slug = source.doctype.toLowerCase().replace(/ /g, '-')
  return `/app/${encodeURIComponent(slug)}/${encodeURIComponent(source.name)}`
}
