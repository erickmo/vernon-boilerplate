// src/services/koperasi/simpanan.service.ts
import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type { ProdukSimpanan, RekeningSimapnan, TransaksiSimpanan, PermohonanSimpanan } from '@/types/koperasi/simpanan.types'
import type { ListParams } from '@/services/createEntityService'
import type { PaginatedResponse } from '@/types/api.types'

export const produkSimpananService = createEntityService<ProdukSimpanan>(
  '/api/resource/Produk Simpanan',
)

const rekeningBase = createEntityService<RekeningSimapnan>(
  '/api/resource/Rekening Simpanan',
)

export const rekeningSimapnanService = {
  ...rekeningBase,

  /** Transaksi linked to a specific rekening */
  listTransaksi: (rekeningId: string, params?: ListParams): Promise<PaginatedResponse<TransaksiSimpanan>> =>
    apiClient.get(`/api/resource/Transaksi Simpanan${buildQS({ ...params, rekening_id: rekeningId })}`),

  /** Permohonan linked to a specific rekening */
  listPermohonan: (rekeningId: string, params?: ListParams): Promise<PaginatedResponse<PermohonanSimpanan>> =>
    apiClient.get(`/api/resource/Permohonan Simpanan${buildQS({ ...params, rekening_id: rekeningId })}`),
}

export const transaksiSimpananService = createEntityService<TransaksiSimpanan>(
  '/api/resource/Transaksi Simpanan',
)

const permohonanBase = createEntityService<PermohonanSimpanan>(
  '/api/resource/Permohonan Simpanan',
)

export const permohonanSimpananService = {
  ...permohonanBase,

  approve: (id: string): Promise<PermohonanSimpanan> =>
    apiClient.post(`/api/method/sekolahpro.simpanan.api.approve_permohonan`, { permohonan_id: id }),

  reject: (id: string, alasan: string): Promise<PermohonanSimpanan> =>
    apiClient.post(`/api/method/sekolahpro.simpanan.api.reject_permohonan`, { permohonan_id: id, alasan }),
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
