import { lazy, Suspense } from 'react'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { AuthRoute } from './ProtectedRoute'

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div />}>{children}</Suspense>
}

// Anggota
const NasabahListPage              = lazy(() => import('@/pages/koperasi/anggota/NasabahListPage'))
const NasabahDetailPage            = lazy(() => import('@/pages/koperasi/anggota/NasabahDetailPage'))
const NasabahFormPage              = lazy(() => import('@/pages/koperasi/anggota/NasabahFormPage'))
const AnggotaKoperasiListPage      = lazy(() => import('@/pages/koperasi/anggota/AnggotaKoperasiListPage'))
const AnggotaKoperasiFormPage      = lazy(() => import('@/pages/koperasi/anggota/AnggotaKoperasiFormPage'))
const SimpananPokokListPage        = lazy(() => import('@/pages/koperasi/anggota/SimpananPokokListPage'))

// Simpanan
const ProdukSimpananListPage       = lazy(() => import('@/pages/koperasi/simpanan/ProdukSimpananListPage').then(m => ({ default: m.ProdukSimpananListPage })))
const ProdukSimpananFormPage       = lazy(() => import('@/pages/koperasi/simpanan/ProdukSimpananFormPage').then(m => ({ default: m.ProdukSimpananFormPage })))
const RekeningListPage             = lazy(() => import('@/pages/koperasi/simpanan/RekeningListPage').then(m => ({ default: m.RekeningListPage })))
const RekeningDetailPage           = lazy(() => import('@/pages/koperasi/simpanan/RekeningDetailPage').then(m => ({ default: m.RekeningDetailPage })))
const RekeningFormPage             = lazy(() => import('@/pages/koperasi/simpanan/RekeningFormPage').then(m => ({ default: m.RekeningFormPage })))
const TransaksiSimpananListPage    = lazy(() => import('@/pages/koperasi/simpanan/TransaksiSimpananListPage').then(m => ({ default: m.TransaksiSimpananListPage })))
const PermohonanListPage           = lazy(() => import('@/pages/koperasi/simpanan/PermohonanListPage').then(m => ({ default: m.PermohonanListPage })))
const PermohonanDetailPage         = lazy(() => import('@/pages/koperasi/simpanan/PermohonanDetailPage').then(m => ({ default: m.PermohonanDetailPage })))
const PermohonanFormPage           = lazy(() => import('@/pages/koperasi/simpanan/PermohonanFormPage').then(m => ({ default: m.PermohonanFormPage })))

// Pembiayaan
const ProdukPembiayaanListPage     = lazy(() => import('@/pages/koperasi/pembiayaan/ProdukPembiayaanListPage').then(m => ({ default: m.ProdukPembiayaanListPage })))
const ProdukPembiayaanFormPage     = lazy(() => import('@/pages/koperasi/pembiayaan/ProdukPembiayaanFormPage').then(m => ({ default: m.ProdukPembiayaanFormPage })))
const AkadListPage                 = lazy(() => import('@/pages/koperasi/pembiayaan/AkadListPage').then(m => ({ default: m.AkadListPage })))
const AkadDetailPage               = lazy(() => import('@/pages/koperasi/pembiayaan/AkadDetailPage').then(m => ({ default: m.AkadDetailPage })))
const AkadFormPage                 = lazy(() => import('@/pages/koperasi/pembiayaan/AkadFormPage').then(m => ({ default: m.AkadFormPage })))
const PembayaranAngsuranListPage   = lazy(() => import('@/pages/koperasi/pembiayaan/PembayaranAngsuranListPage').then(m => ({ default: m.PembayaranAngsuranListPage })))
const PembayaranAngsuranFormPage   = lazy(() => import('@/pages/koperasi/pembiayaan/PembayaranAngsuranFormPage').then(m => ({ default: m.PembayaranAngsuranFormPage })))
const PembagianSHUListPage         = lazy(() => import('@/pages/koperasi/pembiayaan/PembagianSHUListPage').then(m => ({ default: m.PembagianSHUListPage })))
const PembagianSHUDetailPage       = lazy(() => import('@/pages/koperasi/pembiayaan/PembagianSHUDetailPage').then(m => ({ default: m.PembagianSHUDetailPage })))

// Kartu
const KartuListPage                = lazy(() => import('@/pages/koperasi/kartu/KartuListPage').then(m => ({ default: m.KartuListPage })))
const KartuDetailPage              = lazy(() => import('@/pages/koperasi/kartu/KartuDetailPage').then(m => ({ default: m.KartuDetailPage })))
const TerminalListPage             = lazy(() => import('@/pages/koperasi/kartu/TerminalListPage').then(m => ({ default: m.TerminalListPage })))
const TerminalFormPage             = lazy(() => import('@/pages/koperasi/kartu/TerminalFormPage').then(m => ({ default: m.TerminalFormPage })))
const MerchantListPage             = lazy(() => import('@/pages/koperasi/kartu/MerchantListPage').then(m => ({ default: m.MerchantListPage })))
const MerchantFormPage             = lazy(() => import('@/pages/koperasi/kartu/MerchantFormPage').then(m => ({ default: m.MerchantFormPage })))

// ZIS
const PenerimaanZISListPage        = lazy(() => import('@/pages/koperasi/zis/PenerimaanZISListPage').then(m => ({ default: m.PenerimaanZISListPage })))
const PenerimaanZISDetailPage      = lazy(() => import('@/pages/koperasi/zis/PenerimaanZISDetailPage').then(m => ({ default: m.PenerimaanZISDetailPage })))
const PenerimaanZISFormPage        = lazy(() => import('@/pages/koperasi/zis/PenerimaanZISFormPage').then(m => ({ default: m.PenerimaanZISFormPage })))
const ProgramPenyaluranListPage    = lazy(() => import('@/pages/koperasi/zis/ProgramPenyaluranListPage').then(m => ({ default: m.ProgramPenyaluranListPage })))
const ProgramPenyaluranDetailPage  = lazy(() => import('@/pages/koperasi/zis/ProgramPenyaluranDetailPage').then(m => ({ default: m.ProgramPenyaluranDetailPage })))
const ProgramPenyaluranFormPage    = lazy(() => import('@/pages/koperasi/zis/ProgramPenyaluranFormPage').then(m => ({ default: m.ProgramPenyaluranFormPage })))
const PenyaluranZISListPage        = lazy(() => import('@/pages/koperasi/zis/PenyaluranZISListPage').then(m => ({ default: m.PenyaluranZISListPage })))
const PenyaluranZISFormPage        = lazy(() => import('@/pages/koperasi/zis/PenyaluranZISFormPage').then(m => ({ default: m.PenyaluranZISFormPage })))
const AsetWakafListPage            = lazy(() => import('@/pages/koperasi/zis/AsetWakafListPage').then(m => ({ default: m.AsetWakafListPage })))
const AsetWakafFormPage            = lazy(() => import('@/pages/koperasi/zis/AsetWakafFormPage').then(m => ({ default: m.AsetWakafFormPage })))

// Kas Teller
const SesiKasTellerListPage        = lazy(() => import('@/pages/koperasi/kas-teller/SesiKasTellerListPage').then(m => ({ default: m.SesiKasTellerListPage })))
const SesiKasTellerDetailPage      = lazy(() => import('@/pages/koperasi/kas-teller/SesiKasTellerDetailPage').then(m => ({ default: m.SesiKasTellerDetailPage })))
const SesiKasTellerFormPage        = lazy(() => import('@/pages/koperasi/kas-teller/SesiKasTellerFormPage').then(m => ({ default: m.SesiKasTellerFormPage })))

// Laporan & Pengaturan
const LaporanKoperasiPage          = lazy(() => import('@/pages/koperasi/laporan/LaporanKoperasiPage').then(m => ({ default: m.LaporanKoperasiPage })))
const PengaturanKoperasiPage       = lazy(() => import('@/pages/koperasi/pengaturan/PengaturanKoperasiPage').then(m => ({ default: m.PengaturanKoperasiPage })))

const KoperasiDashboardPage = lazy(() => import('@/pages/koperasi/KoperasiDashboardPage'))
const PusatPersetujuanPage = lazy(() => import('@/pages/koperasi/persetujuan/PusatPersetujuanPage'))
const TellerWorkstationPage = lazy(() => import('@/pages/koperasi/teller/TellerWorkstationPage'))

export const koperasiRoutes = [
  {
    path: '/koperasi',
    element: <AuthRoute><AppShell context="koperasi" /></AuthRoute>,
    children: [
      { path: 'dashboard',            element: <S><KoperasiDashboardPage /></S> },
      { path: 'persetujuan',          element: <S><PusatPersetujuanPage /></S> },
      { path: 'teller',               element: <S><TellerWorkstationPage /></S> },
      // Anggota
      { path: 'anggota',                          element: <S><NasabahListPage /></S> },
      { path: 'anggota/nasabah',                  element: <S><NasabahListPage /></S> },
      { path: 'anggota/nasabah/new',              element: <S><NasabahFormPage /></S> },
      { path: 'anggota/nasabah/:id',              element: <S><NasabahDetailPage /></S> },
      { path: 'anggota/nasabah/:id/edit',         element: <S><NasabahFormPage /></S> },
      { path: 'anggota/anggota-koperasi',         element: <S><AnggotaKoperasiListPage /></S> },
      { path: 'anggota/anggota-koperasi/new',     element: <S><AnggotaKoperasiFormPage /></S> },
      { path: 'anggota/anggota-koperasi/:id/edit',element: <S><AnggotaKoperasiFormPage /></S> },
      { path: 'anggota/simpanan-pokok',           element: <S><SimpananPokokListPage /></S> },
      // Simpanan
      { path: 'simpanan',                         element: <S><ProdukSimpananListPage /></S> },
      { path: 'simpanan/produk',                  element: <S><ProdukSimpananListPage /></S> },
      { path: 'simpanan/produk/new',              element: <S><ProdukSimpananFormPage /></S> },
      { path: 'simpanan/produk/:id/edit',         element: <S><ProdukSimpananFormPage /></S> },
      { path: 'simpanan/rekening',                element: <S><RekeningListPage /></S> },
      { path: 'simpanan/rekening/new',            element: <S><RekeningFormPage /></S> },
      { path: 'simpanan/rekening/:id',            element: <S><RekeningDetailPage /></S> },
      { path: 'simpanan/rekening/:id/edit',       element: <S><RekeningFormPage /></S> },
      { path: 'simpanan/transaksi',               element: <S><TransaksiSimpananListPage /></S> },
      { path: 'simpanan/permohonan',              element: <S><PermohonanListPage /></S> },
      { path: 'simpanan/permohonan/new',          element: <S><PermohonanFormPage /></S> },
      { path: 'simpanan/permohonan/:id',          element: <S><PermohonanDetailPage /></S> },
      { path: 'simpanan/permohonan/:id/edit',     element: <S><PermohonanFormPage /></S> },
      // Pembiayaan
      { path: 'pembiayaan',                       element: <S><ProdukPembiayaanListPage /></S> },
      { path: 'pembiayaan/produk',                element: <S><ProdukPembiayaanListPage /></S> },
      { path: 'pembiayaan/produk/new',            element: <S><ProdukPembiayaanFormPage /></S> },
      { path: 'pembiayaan/produk/:id/edit',       element: <S><ProdukPembiayaanFormPage /></S> },
      { path: 'pembiayaan/akad',                  element: <S><AkadListPage /></S> },
      { path: 'pembiayaan/akad/new',              element: <S><AkadFormPage /></S> },
      { path: 'pembiayaan/akad/:id',              element: <S><AkadDetailPage /></S> },
      { path: 'pembiayaan/akad/:id/edit',         element: <S><AkadFormPage /></S> },
      { path: 'pembiayaan/pembayaran',            element: <S><PembayaranAngsuranListPage /></S> },
      { path: 'pembiayaan/pembayaran/new',        element: <S><PembayaranAngsuranFormPage /></S> },
      { path: 'pembiayaan/pembayaran/:id/edit',   element: <S><PembayaranAngsuranFormPage /></S> },
      { path: 'pembiayaan/shu',                   element: <S><PembagianSHUListPage /></S> },
      { path: 'pembiayaan/shu/:id',               element: <S><PembagianSHUDetailPage /></S> },
      // Kartu
      { path: 'kartu',                            element: <S><KartuListPage /></S> },
      { path: 'kartu/daftar',                     element: <S><KartuListPage /></S> },
      { path: 'kartu/daftar/:id',                 element: <S><KartuDetailPage /></S> },
      { path: 'kartu/terminal',                   element: <S><TerminalListPage /></S> },
      { path: 'kartu/terminal/new',               element: <S><TerminalFormPage /></S> },
      { path: 'kartu/terminal/:id/edit',          element: <S><TerminalFormPage /></S> },
      { path: 'kartu/merchant',                   element: <S><MerchantListPage /></S> },
      { path: 'kartu/merchant/new',               element: <S><MerchantFormPage /></S> },
      { path: 'kartu/merchant/:id/edit',          element: <S><MerchantFormPage /></S> },
      // ZIS
      { path: 'zis',                              element: <S><PenerimaanZISListPage /></S> },
      { path: 'zis/penerimaan',                   element: <S><PenerimaanZISListPage /></S> },
      { path: 'zis/penerimaan/new',               element: <S><PenerimaanZISFormPage /></S> },
      { path: 'zis/penerimaan/:id',               element: <S><PenerimaanZISDetailPage /></S> },
      { path: 'zis/penerimaan/:id/edit',          element: <S><PenerimaanZISFormPage /></S> },
      { path: 'zis/program',                      element: <S><ProgramPenyaluranListPage /></S> },
      { path: 'zis/program/new',                  element: <S><ProgramPenyaluranFormPage /></S> },
      { path: 'zis/program/:id',                  element: <S><ProgramPenyaluranDetailPage /></S> },
      { path: 'zis/program/:id/edit',             element: <S><ProgramPenyaluranFormPage /></S> },
      { path: 'zis/penyaluran',                   element: <S><PenyaluranZISListPage /></S> },
      { path: 'zis/penyaluran/new',               element: <S><PenyaluranZISFormPage /></S> },
      { path: 'zis/penyaluran/:id/edit',          element: <S><PenyaluranZISFormPage /></S> },
      { path: 'zis/wakaf',                        element: <S><AsetWakafListPage /></S> },
      { path: 'zis/wakaf/new',                    element: <S><AsetWakafFormPage /></S> },
      { path: 'zis/wakaf/:id/edit',               element: <S><AsetWakafFormPage /></S> },
      // Kas Teller
      { path: 'kas-teller',                       element: <S><SesiKasTellerListPage /></S> },
      { path: 'kas-teller/sesi',                  element: <S><SesiKasTellerListPage /></S> },
      { path: 'kas-teller/sesi/new',              element: <S><SesiKasTellerFormPage /></S> },
      { path: 'kas-teller/sesi/:id',              element: <S><SesiKasTellerDetailPage /></S> },
      { path: 'kas-teller/sesi/:id/edit',         element: <S><SesiKasTellerFormPage /></S> },
      // Laporan
      { path: 'laporan',                          element: <S><LaporanKoperasiPage /></S> },
      { path: 'laporan/export',                   element: <S><LaporanKoperasiPage /></S> },
      // Pengaturan
      { path: 'pengaturan',                       element: <S><PengaturanKoperasiPage /></S> },
      { path: 'pengaturan/koperasi',              element: <S><PengaturanKoperasiPage /></S> },
    ],
  },
]
