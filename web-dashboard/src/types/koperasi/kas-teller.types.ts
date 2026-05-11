// src/types/koperasi/kas-teller.types.ts

export type SesiKasStatus = 'Draft' | 'Aktif' | 'Pending Approval' | 'Selesai'
export type Shift = 'Pagi' | 'Siang' | 'Sore'

export interface DenominasiUang {
  name: string       // doc name, e.g. "Rp 100.000"
  nama: string
  nilai: number
  jenis: 'Kertas' | 'Koin'
  urutan: number
  aktif: 0 | 1
}

export interface DenominasiRow {
  denominasi: string  // FK → Denominasi Uang.name
  jumlah: number
}

export interface DenominasiBukaRow extends DenominasiRow {
  name?: string       // child row name (assigned by Frappe)
  nilai?: number      // resolved for display
  subtotal?: number   // = nilai * jumlah
}

export interface SesiKasTeller {
  name: string
  teller: string                   // User link
  tanggal: string                  // YYYY-MM-DD
  shift: Shift
  status: SesiKasStatus
  supervisor_buka: string          // User link
  modal_kas: number
  waktu_buka?: string
  total_denominasi_buka?: number
  denominasi_buka: DenominasiBukaRow[]
  waktu_tutup?: string
  total_denominasi_tutup?: number
  denominasi_tutup?: DenominasiBukaRow[]
  total_setoran?: number
  total_penarikan?: number
  saldo_seharusnya?: number
  selisih?: number
  catatan_selisih?: string
  supervisor_tutup?: string
  waktu_approve?: string
  catatan_supervisor?: string
  docstatus?: 0 | 1 | 2
}

export interface BukaSesiPayload {
  tanggal: string
  shift: Shift
  supervisor_buka: string
  modal_kas: number
  denominasi_buka: DenominasiRow[]
}
