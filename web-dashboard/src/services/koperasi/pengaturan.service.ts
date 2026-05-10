// src/services/koperasi/pengaturan.service.ts

import { apiClient } from '@/services/api.client'
import type { PengaturanKoperasi } from '@/types/koperasi/pengaturan.types'

const SINGLE_DOCTYPE_NAME = 'Pengaturan Koperasi'
const BASE = `/api/resource/${encodeURIComponent(SINGLE_DOCTYPE_NAME)}/${encodeURIComponent(SINGLE_DOCTYPE_NAME)}`

export const pengaturanKoperasiService = {
  get: (): Promise<PengaturanKoperasi> =>
    apiClient.get<{ data: PengaturanKoperasi }>(BASE).then((res) => res.data),

  save: (data: Partial<PengaturanKoperasi>): Promise<PengaturanKoperasi> =>
    apiClient.put<{ data: PengaturanKoperasi }>(BASE, data).then((res) => res.data),
}
