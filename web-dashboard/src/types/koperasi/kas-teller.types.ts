// src/types/koperasi/kas-teller.types.ts

export type SesiKasTellerStatus = 'aktif' | 'tutup'

export interface DenominasiUang {
  id: string
  nilai: number
  label: string
}

export interface ItemDenominasiKas {
  denominasi_id: string
  denominasi_nilai: number
  denominasi_label: string
  jumlah_lembar: number
  total: number
}

export interface RingkasanTransaksi {
  jumlah_setoran: number
  total_setoran: number
  jumlah_penarikan: number
  total_penarikan: number
  jumlah_topup: number
  total_topup: number
  selisih_kas: number
}

export interface SesiKasTeller {
  id: string
  tanggal: string
  teller_id: string
  teller_nama: string
  jam_buka: string
  jam_tutup?: string
  saldo_awal: number
  saldo_akhir?: number
  status: SesiKasTellerStatus
  denominasi_awal: ItemDenominasiKas[]
  denominasi_akhir?: ItemDenominasiKas[]
  ringkasan?: RingkasanTransaksi
}
