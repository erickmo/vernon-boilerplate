// src/services/koperasi/nasabah.service.ts
import { apiClient } from '@/services/api.client'
import { createEntityService } from '@/services/createEntityService'
import type { Nasabah, NasabahSummary } from '@/types/koperasi/anggota.types'

export const nasabahService = {
  ...createEntityService<Nasabah>('/api/resource/Nasabah'),

  /**
   * Fetches aggregated hub data: rekening, pembiayaan, kartu linked to this nasabah.
   * Used by NasabahDetailPage tabs that show related entities.
   */
  getNasabahSummary: (nasabahId: string): Promise<NasabahSummary> =>
    apiClient.get<NasabahSummary>(
      `/api/method/sekolahpro.koperasi.api.nasabah.get_summary?nasabah_id=${nasabahId}`,
    ),
}
