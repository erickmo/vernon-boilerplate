// src/services/sekolah/pengaturan.service.ts

import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type { Sekolah, TahunAjaran, SemesterTahunAjaran, ModulAktif } from '@/types/sekolah/pengaturan.types'

const BASE = '/api/method/sekolahpro.pengaturan.api'

export const tahunAjaranService = createEntityService<TahunAjaran>(`${BASE}.tahun_ajaran`)
export const semesterService = createEntityService<SemesterTahunAjaran>(`${BASE}.semester_tahun_ajaran`)

/** Single doctype — GET returns one object, no list */
export async function getSekolah(): Promise<Sekolah> {
  return apiClient.get<Sekolah>(`${BASE}.sekolah`)
}

export async function updateSekolah(data: Partial<Sekolah>): Promise<Sekolah> {
  return apiClient.put<Sekolah>(`${BASE}.sekolah`, data)
}

/** Single doctype for module toggles */
export async function getModulAktif(): Promise<ModulAktif> {
  return apiClient.get<ModulAktif>(`${BASE}.modul_aktif`)
}

export async function updateModulAktif(data: Partial<ModulAktif>): Promise<ModulAktif> {
  return apiClient.put<ModulAktif>(`${BASE}.modul_aktif`, data)
}
