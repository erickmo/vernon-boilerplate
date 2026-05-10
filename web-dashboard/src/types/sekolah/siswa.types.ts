import type { BaseEntity } from '@/types/entity.types'

export interface Siswa extends BaseEntity {
  nis: string
  nama_lengkap: string
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: 'Laki-laki' | 'Perempuan'
  agama: string
  alamat: string
  foto?: string
  status: 'Aktif' | 'Lulus' | 'Keluar' | 'Mutasi'
  rombel_aktif?: string
  tahun_ajaran_aktif?: string
}

export interface WaliSiswa extends BaseEntity {
  siswa_id: string
  nama_wali: string
  hubungan: 'Ayah' | 'Ibu' | 'Wali'
  no_telepon: string
  pekerjaan?: string
  alamat?: string
}

export interface AnggotaRombel extends BaseEntity {
  siswa_id: string
  rombel: string
  tahun_ajaran: string
  semester: string
  is_aktif: boolean
}

export interface MutasiSiswa extends BaseEntity {
  siswa_id: string
  tanggal_mutasi: string
  jenis_mutasi: 'Masuk' | 'Keluar'
  sekolah_asal?: string
  sekolah_tujuan?: string
  alasan: string
  keterangan?: string
}

export interface KelulusanSiswa extends BaseEntity {
  siswa_id: string
  tanggal_lulus: string
  tahun_ajaran: string
  nomor_ijazah?: string
  keterangan?: string
}

export type SiswaFormValues = {
  nama_lengkap: string
  nis: string
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: string
  agama: string
  alamat: string
  foto: string
}
