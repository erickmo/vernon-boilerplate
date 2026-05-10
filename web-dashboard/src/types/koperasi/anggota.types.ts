// src/types/koperasi/anggota.types.ts
import type { BaseEntity } from '@/types/entity.types'

// ─── Nasabah ──────────────────────────────────────────────────────────────────

export type NasabahStatus = 'Aktif' | 'Non-Aktif'
export type JenisKelamin = 'Laki-laki' | 'Perempuan'

export interface Nasabah extends BaseEntity {
  nama: string
  nik: string
  no_hp: string
  alamat: string
  foto?: string
  tanggal_lahir: string        // ISO date string, e.g. "1990-05-12"
  jenis_kelamin: JenisKelamin
  status: NasabahStatus
  // Summary fields returned by getNasabahSummary
  total_rekening?: number
  total_pembiayaan?: number
  kartu_aktif?: number
}

// ─── Rekening Simpanan (slim — used in Nasabah hub tab) ───────────────────────

export interface RekeningSlim {
  id: string
  nomor_rekening: string
  produk_simpanan: string
  saldo: number
  status: string
}

// ─── Akad Pembiayaan (slim — used in Nasabah hub tab) ─────────────────────────

export interface AkadSlim {
  id: string
  nomor_akad: string
  produk_pembiayaan: string
  pokok: number
  sisa_pokok: number
  status: string
}

// ─── Kartu (slim — used in Nasabah hub tab) ───────────────────────────────────

export interface KartuSlim {
  id: string
  nomor_kartu: string
  tipe: 'debit' | 'emoney'
  uid: string
  status: string
  saldo_emoney?: number        // Only populated for tipe === 'emoney'
}

// ─── Nasabah Summary (returned by getNasabahSummary) ─────────────────────────

export interface NasabahSummary {
  nasabah_id: string
  total_rekening: number
  total_pembiayaan: number
  kartu_aktif: number
  rekening: RekeningSlim[]
  pembiayaan: AkadSlim[]
  kartu: KartuSlim[]
}

// ─── Anggota Koperasi ─────────────────────────────────────────────────────────

export interface AnggotaKoperasi extends BaseEntity {
  nasabah: string              // Nasabah id (link)
  nasabah_nama: string         // Denormalized for display
  no_anggota: string
  tanggal_bergabung: string    // ISO date string
  status: 'Aktif' | 'Non-Aktif'
}

// ─── Simpanan Pokok ───────────────────────────────────────────────────────────

export interface SimpananPokok extends BaseEntity {
  nasabah: string
  nasabah_nama: string
  jumlah: number
  tanggal: string              // ISO date string
  status_lunas: 'Lunas' | 'Belum Lunas'
}
