// src/types/koperasi/zis.types.ts

export type JenisDanaZISNama = 'Zakat' | 'Infaq' | 'Shadaqah'
export type PenerimaanZISStatus = 'draft' | 'dikonfirmasi' | 'dibatalkan'
export type ProgramPenyaluranStatus = 'aktif' | 'selesai' | 'ditunda'

export interface JenisDanaZIS {
  id: string
  nama: JenisDanaZISNama
}

export interface RincianJenisDana {
  jenis_dana_id: string
  jenis_dana_nama: JenisDanaZISNama
  nominal: number
}

export interface PenerimaanZIS {
  id: string
  tanggal: string
  donatur: string
  jenis_dana: JenisDanaZISNama
  nominal: number
  status: PenerimaanZISStatus
  metode_pembayaran: string
  keterangan?: string
  rincian: RincianJenisDana[]
}

export interface ProgramPenyaluran {
  id: string
  nama: string
  target_dana: number
  terealisasi: number
  tanggal_mulai: string
  tanggal_selesai: string
  deskripsi?: string
  status: ProgramPenyaluranStatus
}

export interface PenyaluranZIS {
  id: string
  program_id: string
  program_nama: string
  penerima: string
  nominal: number
  tanggal: string
  keterangan?: string
}

export interface AsetWakaf {
  id: string
  nama_aset: string
  jenis_aset: string
  nilai: number
  wakif: string
  tanggal_wakaf: string
  lokasi?: string
  keterangan?: string
}
