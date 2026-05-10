// src/types/koperasi/kartu.types.ts

export type KartuTipe = 'debit' | 'emoney'
export type KartuStatus = 'aktif' | 'blokir' | 'expired' | 'nonaktif'
export type TransaksiKartuTipe = 'pembayaran' | 'emoney' | 'manual' | 'auto'
export type TransaksiKartuStatus = 'sukses' | 'gagal' | 'pending'
export type TerminalStatus = 'aktif' | 'nonaktif'
export type MerchantStatus = 'aktif' | 'nonaktif'

export interface Kartu {
  id: string
  uid_nfc: string
  tipe: KartuTipe
  status: KartuStatus
  expired: string
  nasabah_id: string
  nasabah_nama: string
  rekening_id?: string
  rekening_nomor?: string
  wallet_id?: string
  saldo?: number
}

export interface EMoneyWallet {
  id: string
  kartu_id: string
  saldo: number
  threshold_topup: number
  nominal_topup: number
  auto_topup: boolean
  rekening_sumber_id?: string
  rekening_sumber_nomor?: string
}

export interface TransaksiKartu {
  id: string
  kartu_id: string
  nominal: number
  tipe: TransaksiKartuTipe
  status: TransaksiKartuStatus
  saldo_sebelum: number
  saldo_sesudah: number
  terminal_id?: string
  terminal_nama?: string
  merchant_nama?: string
  referensi?: string
  creation: string
}

export interface Terminal {
  id: string
  terminal_id: string
  merchant_id: string
  merchant_nama: string
  api_key: string
  status: TerminalStatus
  creation: string
}

export interface Merchant {
  id: string
  nama: string
  rekening_settlement_id: string
  rekening_settlement_nomor?: string
  status: MerchantStatus
  creation: string
}

export interface KartuHistoryResponse {
  kartu: string
  page: number
  data: TransaksiKartu[]
}

export interface KartuBalanceResponse {
  kartu: string
  tipe: KartuTipe
  saldo: number
}
