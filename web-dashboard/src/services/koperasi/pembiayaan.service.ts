// src/services/koperasi/pembiayaan.service.ts
import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type { ProdukPembiayaan, AkadPembiayaan, JadwalAngsuran, PembayaranAngsuran, PembagianSHU, ItemSHUAnggota } from '@/types/koperasi/pembiayaan.types'
import type { ListParams } from '@/services/createEntityService'
import type { PaginatedResponse } from '@/types/api.types'

export const produkPembiayaanService = createEntityService<ProdukPembiayaan>(
  '/api/resource/Produk Pembiayaan',
)

const akadBase = createEntityService<AkadPembiayaan>(
  '/api/resource/Akad Pembiayaan',
)

export const akadPembiayaanService = {
  ...akadBase,

  /** Jadwal angsuran for a specific akad */
  listJadwal: (akadId: string, params?: ListParams): Promise<PaginatedResponse<JadwalAngsuran>> =>
    apiClient.get(`/api/resource/Jadwal Angsuran${buildQS({ ...params, akad_id: akadId })}`),

  /** Payment history for a specific akad */
  listPembayaran: (akadId: string, params?: ListParams): Promise<PaginatedResponse<PembayaranAngsuran>> =>
    apiClient.get(`/api/resource/Pembayaran Angsuran${buildQS({ ...params, akad_id: akadId })}`),
}

export const pembayaranAngsuranService = createEntityService<PembayaranAngsuran>(
  '/api/resource/Pembayaran Angsuran',
)

const shuBase = createEntityService<PembagianSHU>(
  '/api/resource/Pembagian SHU',
)

export const pembagianSHUService = {
  ...shuBase,

  /** Per-anggota items for a specific SHU period */
  listItems: (shuId: string, params?: ListParams): Promise<PaginatedResponse<ItemSHUAnggota>> =>
    apiClient.get(`/api/resource/Item SHU Anggota${buildQS({ ...params, shu_id: shuId })}`),
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return ''
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}
