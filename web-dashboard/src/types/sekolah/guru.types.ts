import type { BaseEntity } from '@/types/entity.types'

export interface Guru extends BaseEntity {
  nip: string
  nama: string
  mata_pelajaran: string
  status: 'Aktif' | 'Cuti' | 'Nonaktif'
  alamat?: string
  foto?: string
  no_telepon?: string
  email?: string
  tanggal_lahir?: string
  jenis_kelamin?: 'Laki-laki' | 'Perempuan'
}

export interface PenugasanGuru extends BaseEntity {
  guru_id: string
  tahun_ajaran: string
  semester: string
  mata_pelajaran: string
  kelas: string
  jam_mengajar?: number
}

export interface BerkasGuru extends BaseEntity {
  guru_id: string
  jenis_berkas: 'SK Pengangkatan' | 'SK Mutasi' | 'Sertifikat' | 'Ijazah' | 'Lainnya'
  nama_berkas: string
  tanggal_berkas?: string
  file_url?: string
  keterangan?: string
}

export type GuruFormValues = {
  nip: string
  nama: string
  mata_pelajaran: string
  status: string
  alamat: string
  foto: string
}
