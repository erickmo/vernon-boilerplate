// src/services/koperasi/kas-teller.service.ts

import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type {
  SesiKasTeller,
  DenominasiRow,
  BukaSesiPayload,
} from '@/types/koperasi/kas-teller.types'

const baseService = createEntityService<SesiKasTeller>('/api/resource/Sesi Kas Teller')

const ENDPOINT_GET_ACTIVE =
  '/api/method/sekolahpro.koperasi.api.sesi_kas.get_active_for_me'
const ENDPOINT_RUN_METHOD = '/api/method/run_doc_method'
const RESOURCE = '/api/resource/Sesi Kas Teller'
const DOCTYPE = 'Sesi Kas Teller'

interface FrappeMethodResponse<T> { message: T | null }
interface ResourcePostResponse<T> { data: T }

async function callDocMethod(name: string, method: string, args: Record<string, unknown>) {
  await apiClient.post<FrappeMethodResponse<unknown>>(ENDPOINT_RUN_METHOD, {
    dt: DOCTYPE,
    dn: name,
    method,
    args: JSON.stringify(args),
  })
}

export const sesiKasTellerService = {
  ...baseService,

  async getActiveForMe(): Promise<SesiKasTeller | null> {
    const res = await apiClient.get<FrappeMethodResponse<SesiKasTeller>>(ENDPOINT_GET_ACTIVE)
    return res.message
  },

  async bukaSesi(payload: BukaSesiPayload): Promise<SesiKasTeller> {
    const body = { ...payload, docstatus: 1 }
    const res = await apiClient.post<ResourcePostResponse<SesiKasTeller>>(RESOURCE, body)
    return res.data
  },

  async tutupKas(
    name: string,
    denominasi_tutup: DenominasiRow[],
    catatan_selisih?: string,
  ): Promise<void> {
    // 1. Update doc fields (allow_on_submit=1 on these)
    await apiClient.put(`${RESOURCE}/${encodeURIComponent(name)}`, {
      denominasi_tutup,
      ...(catatan_selisih !== undefined ? { catatan_selisih } : {}),
    })
    // 2. Trigger the whitelisted method (no args needed)
    await callDocMethod(name, 'tutup_kas', {})
  },

  async approveTutup(name: string, catatan_supervisor?: string): Promise<void> {
    if (catatan_supervisor !== undefined) {
      await apiClient.put(`${RESOURCE}/${encodeURIComponent(name)}`, {
        catatan_supervisor,
      })
    }
    await callDocMethod(name, 'approve_tutup', {})
  },
}
