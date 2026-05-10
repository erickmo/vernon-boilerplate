// src/services/koperasi/kas-teller.service.ts

import { createEntityService } from '@/services/createEntityService'
import type { SesiKasTeller } from '@/types/koperasi/kas-teller.types'

export const sesiKasTellerService = createEntityService<SesiKasTeller>('/api/resource/Sesi Kas Teller')
