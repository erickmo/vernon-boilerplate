// src/types/sekolah/akademik.types.ts
import type { BaseEntity } from '@/types/entity.types'

// ─── Master Data ─────────────────────────────────────────────────────────────

export interface MataPelajaran extends BaseEntity {
  nama: string
  kode: string
  kurikulum: string
}

export interface JadwalPelajaran extends BaseEntity {
  rombel: string
  rombel_nama: string
  tahun_ajaran: string
  semester: string
  jumlah_slot: number
}

export interface SlotJadwal extends BaseEntity {
  jadwal_pelajaran: string
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'
  jam_mulai: string   // "HH:MM"
  jam_selesai: string // "HH:MM"
  mata_pelajaran: string
  mata_pelajaran_nama: string
  guru: string
  guru_nama: string
  ruangan?: string
}

export interface JadwalOverride extends BaseEntity {
  jadwal_pelajaran: string
  tanggal: string  // "YYYY-MM-DD"
  keterangan: string
  slots: SlotJadwal[]
}

// ─── Absensi Siswa ───────────────────────────────────────────────────────────

export type StatusAbsensiSiswa = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Terlambat'

export interface DetailAbsensiHarian extends BaseEntity {
  absensi_harian: string
  siswa: string
  siswa_nama: string
  nis: string
  status: StatusAbsensiSiswa
  keterangan?: string
}

export interface AbsensiHarian extends BaseEntity {
  rombel: string
  rombel_nama: string
  tanggal: string        // "YYYY-MM-DD"
  tahun_ajaran: string
  semester: string
  jumlah_hadir: number
  jumlah_sakit: number
  jumlah_izin: number
  jumlah_alpha: number
  detail: DetailAbsensiHarian[]
}

// ─── Absensi Guru ────────────────────────────────────────────────────────────

export type StatusAbsensiGuru = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dinas Luar'

export interface DetailAbsensiGuru extends BaseEntity {
  absensi_guru: string
  guru: string
  guru_nama: string
  nip: string
  status: StatusAbsensiGuru
  keterangan?: string
}

export interface AbsensiGuru extends BaseEntity {
  tanggal: string  // "YYYY-MM-DD"
  tahun_ajaran: string
  jumlah_guru: number
  jumlah_hadir: number
  keterangan?: string
  detail: DetailAbsensiGuru[]
}

// ─── Penilaian ───────────────────────────────────────────────────────────────

export interface EntriNilai extends BaseEntity {
  mata_pelajaran: string
  mata_pelajaran_nama: string
  rombel: string
  rombel_nama: string
  komponen: string          // e.g. "UH1", "UTS", "UAS"
  semester: string
  tahun_ajaran: string
  guru: string
  guru_nama: string
  jumlah_siswa: number
}

// ─── Raport ──────────────────────────────────────────────────────────────────

export type StatusRaport = 'Draft' | 'Final' | 'Diterbitkan'

export interface RaportMapel extends BaseEntity {
  raport: string
  mata_pelajaran: string
  mata_pelajaran_nama: string
  nilai_akhir: number
  predikat: 'A' | 'B' | 'C' | 'D'
  kkm: number
  catatan?: string
}

export interface Raport extends BaseEntity {
  siswa: string
  siswa_nama: string
  nis: string
  rombel: string
  rombel_nama: string
  semester: string
  tahun_ajaran: string
  status: StatusRaport
  rata_rata: number
  mapel: RaportMapel[]
}

// ─── Laporan Dinas ───────────────────────────────────────────────────────────

export type LaporanDinasReportName =
  | 'Rekap Absensi Siswa'
  | 'Rekap Absensi Guru'
  | 'Laporan TPG'

export interface LaporanDinasFilters {
  sekolah?: string
  tahun_ajaran?: string
  semester?: string
  rombel?: string
  bulan?: string   // "YYYY-MM" — required for Rekap Absensi Guru
}

export interface LaporanDinasForm {
  report_name: LaporanDinasReportName
  filters: LaporanDinasFilters
}
