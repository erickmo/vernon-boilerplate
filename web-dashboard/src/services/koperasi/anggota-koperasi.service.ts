// src/services/koperasi/anggota-koperasi.service.ts
import { createEntityService } from '@/services/createEntityService'
import type { AnggotaKoperasi } from '@/types/koperasi/anggota.types'

export const anggotaKoperasiService = createEntityService<AnggotaKoperasi>(
  '/api/resource/Anggota Koperasi',
)
