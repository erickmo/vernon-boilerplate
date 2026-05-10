// src/services/koperasi/simpanan-pokok.service.ts
import { createEntityService } from '@/services/createEntityService'
import type { SimpananPokok } from '@/types/koperasi/anggota.types'

export const simpananPokokService = createEntityService<SimpananPokok>(
  '/api/resource/Simpanan Pokok Wajib',
)
