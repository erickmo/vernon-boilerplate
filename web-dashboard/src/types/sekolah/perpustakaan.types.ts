// src/types/sekolah/perpustakaan.types.ts

export type StatusEksemplar = 'Tersedia' | 'Dipinjam' | 'Dipesan' | 'Rusak' | 'Hilang'
export type StatusReservasi = 'Menunggu' | 'Aktif' | 'Selesai' | 'Dibatalkan'
export type StatusPeminjaman = 'Aktif' | 'Dikembalikan' | 'Terlambat'

export interface KategoriBuku {
  id: string
  nama: string
  deskripsi?: string
}

export interface Buku {
  id: string
  judul: string
  penulis: string
  isbn: string
  penerbit: string
  tahun_terbit: number
  kategori: string
  kategori_nama?: string
  deskripsi?: string
  stok_total: number
  stok_tersedia: number
  created_at: string
  updated_at: string
}

export interface EksemplarBuku {
  id: string
  buku_id: string
  kode_eksemplar: string
  kondisi: string
  status: StatusEksemplar
  lokasi_rak?: string
}

export interface AnggotaPerpustakaan {
  id: string
  siswa_id: string
  siswa_nama: string
  nis: string
  tanggal_daftar: string
  status: 'Aktif' | 'Tidak Aktif'
  jumlah_buku_dipinjam: number
}

export interface ItemPeminjaman {
  id: string
  peminjaman_id: string
  eksemplar_id: string
  kode_eksemplar: string
  judul_buku: string
}

export interface PeminjamanBuku {
  id: string
  nomor: string
  anggota_id: string
  anggota_nama: string
  nis: string
  tanggal_pinjam: string
  jatuh_tempo: string
  tanggal_kembali?: string
  status: StatusPeminjaman
  items: ItemPeminjaman[]
  created_at: string
}

export interface PengembalianBuku {
  id: string
  peminjaman_id: string
  nomor_peminjaman: string
  anggota_nama: string
  tanggal_kembali_rencana: string
  tanggal_kembali_aktual: string
  keterlambatan_hari: number
  denda_total: number
  created_at: string
}

export interface DendaPerpustakaan {
  id: string
  anggota_id: string
  anggota_nama: string
  peminjaman_id: string
  nomor_peminjaman: string
  jumlah_denda: number
  status_lunas: boolean
  tanggal_lunas?: string
  created_at: string
}

export interface ReservasiBuku {
  id: string
  buku_id: string
  judul_buku: string
  anggota_id: string
  anggota_nama: string
  status: StatusReservasi
  tanggal_reservasi: string
  tanggal_aktif?: string
  tanggal_selesai?: string
}
