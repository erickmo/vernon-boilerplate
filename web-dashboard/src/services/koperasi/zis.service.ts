// src/services/koperasi/zis.service.ts

import { createEntityService } from '@/services/createEntityService'
import type { PenerimaanZIS, ProgramPenyaluran, PenyaluranZIS, AsetWakaf } from '@/types/koperasi/zis.types'

export const penerimaanZISService = createEntityService<PenerimaanZIS>('/api/resource/Penerimaan ZIS')

export const programPenyaluranService = createEntityService<ProgramPenyaluran>('/api/resource/Program Penyaluran')

export const penyaluranZISService = createEntityService<PenyaluranZIS>('/api/resource/Penyaluran ZIS')

export const asetWakafService = createEntityService<AsetWakaf>('/api/resource/Aset Wakaf')
