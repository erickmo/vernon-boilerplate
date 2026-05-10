// src/types/sekolah/pengaturan.types.ts

export interface Sekolah {
  id: string
  nama: string
  npsn: string
  alamat: string
  kota?: string
  provinsi?: string
  telepon?: string
  email?: string
  website?: string
  kepala_sekolah: string
  logo?: string
  updated_at: string
}

export interface TahunAjaran {
  id: string
  periode: string    // e.g. "2024/2025"
  status_aktif: boolean
  created_at: string
}

export interface SemesterTahunAjaran {
  id: string
  semester: 'Ganjil' | 'Genap'
  tahun_ajaran_id: string
  tahun_ajaran_periode: string
  status_aktif: boolean
}

export type NamaModul = 'Akademik' | 'Perpustakaan' | 'Koperasi' | 'Absensi' | 'Raport'

export interface ModulAktif {
  id: string
  akademik: boolean
  perpustakaan: boolean
  koperasi: boolean
  absensi: boolean
  raport: boolean
  updated_at: string
}
