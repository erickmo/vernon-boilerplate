import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type { Guru, PenugasanGuru, BerkasGuru } from '@/types/sekolah/guru.types'
import type { ListParams } from '@/services/createEntityService'
import type { PaginatedResponse } from '@/types/api.types'

const GURU_LIST_FIELDS = '["name","nip","nama","mata_pelajaran","status"]'
const GURU_LIST_FILTERS = '[["docstatus","!=","2"]]'

const _base = createEntityService<Guru>('/api/resource/Guru')

export const guruService = {
  list: (params?: ListParams): Promise<PaginatedResponse<Guru>> =>
    _base.list({
      ...params,
      fields: GURU_LIST_FIELDS,
      filters: GURU_LIST_FILTERS,
    }),

  getById: (id: string): Promise<Guru> => _base.getById(id),

  create: (data: Partial<Guru>): Promise<Guru> => _base.create(data),

  update: (id: string, data: Partial<Guru>): Promise<Guru> => _base.update(id, data),

  delete: (id: string): Promise<void> => _base.delete(id),

  getPenugasan: (guruId: string): Promise<PenugasanGuru[]> =>
    apiClient.get<PenugasanGuru[]>(
      `/api/resource/Penugasan Guru?filters=[["guru","=","${guruId}"]]&fields=["name","tahun_ajaran","semester","mata_pelajaran","kelas","jam_mengajar"]&order_by=tahun_ajaran desc`
    ),

  getBerkas: (guruId: string): Promise<BerkasGuru[]> =>
    apiClient.get<BerkasGuru[]>(
      `/api/resource/Berkas Guru?filters=[["guru","=","${guruId}"]]&fields=["name","jenis_berkas","nama_berkas","tanggal_berkas","file_url","keterangan"]`
    ),
}
