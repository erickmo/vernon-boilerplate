// src/pages/Admin/InstitusiPage/types.ts
import type { Organisasi } from '@/services/organisasi.service'
import type { Sekolah } from '@/services/sekolah.service'
import type { UnitJenjang } from '@/services/jenjang.service'

export type { Organisasi, Sekolah, UnitJenjang }

export type ModalState =
  | { type: 'yayasan-create' }
  | { type: 'yayasan-edit'; yayasan: Organisasi }
  | { type: 'yayasan-delete'; yayasan: Organisasi }
  | { type: 'sekolah-create'; organisasiName: string }
  | { type: 'sekolah-edit'; sekolah: Sekolah }
  | { type: 'sekolah-delete'; sekolah: Sekolah }
  | { type: 'jenjang-create'; sekolahName: string }
  | { type: 'jenjang-edit'; jenjang: UnitJenjang }
  | { type: 'jenjang-delete'; jenjang: UnitJenjang }

export const TINGKAT_OPTIONS = ['SD', 'SMP', 'SMA', 'SMK', 'MI', 'MTs', 'MA'] as const
export type Tingkat = typeof TINGKAT_OPTIONS[number]
