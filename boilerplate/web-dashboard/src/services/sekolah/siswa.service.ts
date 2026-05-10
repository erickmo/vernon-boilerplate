import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type { Siswa, WaliSiswa, AnggotaRombel, MutasiSiswa, KelulusanSiswa } from '@/types/sekolah/siswa.types'
import type { ListParams } from '@/services/createEntityService'
import type { PaginatedResponse } from '@/types/api.types'

const SISWA_LIST_FIELDS = '["name","nis","nama_lengkap","status","rombel_aktif","tahun_ajaran_aktif"]'
const SISWA_LIST_FILTERS = '[["docstatus","!=","2"]]'

const _base = createEntityService<Siswa>('/api/resource/Siswa')

export const siswaService = {
  list: (params?: ListParams): Promise<PaginatedResponse<Siswa>> =>
    _base.list({
      ...params,
      fields: SISWA_LIST_FIELDS,
      filters: SISWA_LIST_FILTERS,
    }),

  getById: (id: string): Promise<Siswa> => _base.getById(id),

  create: (data: Partial<Siswa>): Promise<Siswa> => _base.create(data),

  update: (id: string, data: Partial<Siswa>): Promise<Siswa> => _base.update(id, data),

  delete: (id: string): Promise<void> => _base.delete(id),

  getWali: (siswaId: string): Promise<WaliSiswa[]> =>
    apiClient.get<WaliSiswa[]>(
      `/api/resource/Wali Siswa?filters=[["siswa","=","${siswaId}"]]&fields=["name","nama_wali","hubungan","no_telepon","pekerjaan","alamat"]`
    ),

  getRombel: (siswaId: string): Promise<AnggotaRombel[]> =>
    apiClient.get<AnggotaRombel[]>(
      `/api/resource/Anggota Rombel?filters=[["siswa","=","${siswaId}"]]&fields=["name","rombel","tahun_ajaran","semester","is_aktif"]`
    ),

  getMutasi: (siswaId: string): Promise<MutasiSiswa[]> =>
    apiClient.get<MutasiSiswa[]>(
      `/api/resource/Mutasi Siswa?filters=[["siswa","=","${siswaId}"]]&fields=["name","tanggal_mutasi","jenis_mutasi","sekolah_asal","sekolah_tujuan","alasan"]`
    ),

  getKelulusan: (siswaId: string): Promise<KelulusanSiswa[]> =>
    apiClient.get<KelulusanSiswa[]>(
      `/api/resource/Kelulusan Siswa?filters=[["siswa","=","${siswaId}"]]&fields=["name","tanggal_lulus","tahun_ajaran","nomor_ijazah"]`
    ),
}
