// src/types/koperasi/pembiayaan.types.ts

export type JenisAkad = 'Murabahah' | 'Mudharabah' | 'Musyarakah' | 'Ijarah' | 'Qardh'
export type StatusAkad = 'Pengajuan' | 'Aktif' | 'Lunas' | 'Macet' | 'Ditolak'
export type StatusBayarAngsuran = 'Belum' | 'Sebagian' | 'Lunas' | 'Lewat Jatuh Tempo'
export type StatusPembagianSHU = 'Draft' | 'Diproses' | 'Selesai'

export interface ProdukPembiayaan {
  id: string
  nama: string
  akad: JenisAkad
  margin: number              // percentage, e.g. 2.5
  tenor_max: number           // bulan
  keterangan: string
  status: 'Aktif' | 'Tidak Aktif'
}

export interface AkadPembiayaan {
  id: string
  no_akad: string
  nasabah_id: string
  nasabah_nama: string
  produk_id: string
  produk_nama: string
  akad: JenisAkad
  nominal_pokok: number
  tenor: number               // bulan
  sisa_pokok: number
  tujuan_pembiayaan: string
  tanggal_akad: string        // ISO date string
  agunan: string
  status: StatusAkad
}

export interface JadwalAngsuran {
  id: string
  akad_id: string
  no_angsuran: number
  tanggal_jatuh_tempo: string // ISO date string
  pokok: number
  margin: number
  total: number
  status_bayar: StatusBayarAngsuran
}

export interface PembayaranAngsuran {
  id: string
  akad_id: string
  no_akad: string
  nasabah_id: string
  nasabah_nama: string
  jadwal_id: string
  no_angsuran: number
  nominal: number
  tanggal_bayar: string       // ISO date string
  keterangan?: string
}

export interface ItemSHUAnggota {
  id: string
  shu_id: string
  nasabah_id: string
  nasabah_nama: string
  porsi_persen: number        // e.g. 2.34
  nominal: number
}

export interface PembagianSHU {
  id: string
  periode: string             // e.g. "2025"
  total_shu: number
  status: StatusPembagianSHU
  tanggal: string             // ISO date string
  jumlah_anggota: number
}
