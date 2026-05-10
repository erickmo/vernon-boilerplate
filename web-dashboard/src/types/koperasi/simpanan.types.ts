// src/types/koperasi/simpanan.types.ts

export type TipeSimpanan = 'Tabungan' | 'Deposito' | 'Giro'
export type StatusRekening = 'Aktif' | 'Dormant' | 'Blokir' | 'Tutup'
export type TipeTransaksiSimpanan = 'Setoran' | 'Penarikan' | 'Bagi Hasil'
export type TipePermohonan =
  | 'Buka Rekening'
  | 'Tutup Rekening'
  | 'Blokir Rekening'
  | 'Unblokir Rekening'
  | 'Aktivasi Dormant'
export type StatusPermohonan = 'Draft' | 'Diajukan' | 'Disetujui' | 'Ditolak'

export interface ProdukSimpanan {
  id: string
  nama: string
  tipe: TipeSimpanan
  nisbah_bagi_hasil: number   // percentage, e.g. 5.5
  min_setoran: number         // rupiah
  keterangan: string
  status: 'Aktif' | 'Tidak Aktif'
}

export interface RekeningSimapnan {
  id: string
  no_rekening: string
  nasabah_id: string
  nasabah_nama: string
  produk_id: string
  produk_nama: string
  saldo: number
  status: StatusRekening
  tanggal_buka: string        // ISO date string
}

export interface TransaksiSimpanan {
  id: string
  rekening_id: string
  no_rekening: string
  nasabah_id: string
  nasabah_nama: string
  tipe: TipeTransaksiSimpanan
  nominal: number
  saldo_sebelum: number
  saldo_sesudah: number
  tanggal: string             // ISO date string
  keterangan?: string
}

export interface PermohonanSimpanan {
  id: string
  tipe: TipePermohonan
  rekening_id: string | null  // null when tipe = 'Buka Rekening'
  no_rekening: string | null
  nasabah_id: string
  nasabah_nama: string
  status: StatusPermohonan
  alasan: string
  catatan_reviewer?: string
  tanggal: string             // ISO date string
  reviewed_by?: string
  reviewed_at?: string        // ISO date string
}
