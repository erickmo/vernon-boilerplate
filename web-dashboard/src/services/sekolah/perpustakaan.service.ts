// src/services/sekolah/perpustakaan.service.ts

import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type {
  Buku, EksemplarBuku, KategoriBuku,
  AnggotaPerpustakaan, PeminjamanBuku, PengembalianBuku,
  DendaPerpustakaan, ReservasiBuku,
} from '@/types/sekolah/perpustakaan.types'

const BASE = '/api/method/sekolahpro.perpustakaan.api'

export const bukuService = createEntityService<Buku>(`${BASE}.buku`)
export const eksemplarService = createEntityService<EksemplarBuku>(`${BASE}.eksemplar_buku`)
export const kategoriBukuService = createEntityService<KategoriBuku>(`${BASE}.kategori_buku`)
export const anggotaPerpustakaanService = createEntityService<AnggotaPerpustakaan>(`${BASE}.anggota_perpustakaan`)
export const peminjamanService = createEntityService<PeminjamanBuku>(`${BASE}.peminjaman_buku`)
export const pengembalianService = createEntityService<PengembalianBuku>(`${BASE}.pengembalian_buku`)
export const dendaService = createEntityService<DendaPerpustakaan>(`${BASE}.denda_perpustakaan`)
export const reservasiService = createEntityService<ReservasiBuku>(`${BASE}.reservasi_buku`)

/** Fetch eksemplar list for a specific buku */
export async function getEksemplarByBuku(bukuId: string): Promise<EksemplarBuku[]> {
  const res = await apiClient.get<{ items: EksemplarBuku[] }>(
    `${BASE}.eksemplar_buku?buku_id=${bukuId}&limit=200`,
  )
  return res.items
}

/** Fetch peminjaman history for a specific buku */
export async function getPeminjamanHistoryByBuku(bukuId: string): Promise<PeminjamanBuku[]> {
  const res = await apiClient.get<{ items: PeminjamanBuku[] }>(
    `${BASE}.peminjaman_buku?buku_id=${bukuId}&limit=50`,
  )
  return res.items
}

/** Fetch all denda for a specific peminjaman */
export async function getDendaByPeminjaman(peminjamanId: string): Promise<DendaPerpustakaan[]> {
  const res = await apiClient.get<{ items: DendaPerpustakaan[] }>(
    `${BASE}.denda_perpustakaan?peminjaman_id=${peminjamanId}&limit=50`,
  )
  return res.items
}
