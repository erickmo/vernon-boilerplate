import { lazy, Suspense } from 'react'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { AuthRoute } from './ProtectedRoute'

function stub(label: string) {
  return function StubPage() {
    return <div style={{ padding: 32, color: '#999' }}>{label} — coming soon</div>
  }
}
function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div />}>{children}</Suspense>
}

// Anggota
const NasabahListPage              = lazy(() => Promise.resolve({ default: stub('NasabahListPage') }))
const NasabahDetailPage            = lazy(() => Promise.resolve({ default: stub('NasabahDetailPage') }))
const NasabahFormPage              = lazy(() => Promise.resolve({ default: stub('NasabahFormPage') }))
const AnggotaKoperasiListPage      = lazy(() => Promise.resolve({ default: stub('AnggotaKoperasiListPage') }))
const AnggotaKoperasiFormPage      = lazy(() => Promise.resolve({ default: stub('AnggotaKoperasiFormPage') }))
const SimpananPokokListPage        = lazy(() => Promise.resolve({ default: stub('SimpananPokokListPage') }))

// Simpanan
const ProdukSimpananListPage       = lazy(() => Promise.resolve({ default: stub('ProdukSimpananListPage') }))
const ProdukSimpananFormPage       = lazy(() => Promise.resolve({ default: stub('ProdukSimpananFormPage') }))
const RekeningListPage             = lazy(() => Promise.resolve({ default: stub('RekeningListPage') }))
const RekeningDetailPage           = lazy(() => Promise.resolve({ default: stub('RekeningDetailPage') }))
const RekeningFormPage             = lazy(() => Promise.resolve({ default: stub('RekeningFormPage') }))
const TransaksiSimpananListPage    = lazy(() => Promise.resolve({ default: stub('TransaksiSimpananListPage') }))
const PermohonanListPage           = lazy(() => Promise.resolve({ default: stub('PermohonanListPage') }))
const PermohonanDetailPage         = lazy(() => Promise.resolve({ default: stub('PermohonanDetailPage') }))

// Pembiayaan
const ProdukPembiayaanListPage     = lazy(() => Promise.resolve({ default: stub('ProdukPembiayaanListPage') }))
const ProdukPembiayaanFormPage     = lazy(() => Promise.resolve({ default: stub('ProdukPembiayaanFormPage') }))
const AkadListPage                 = lazy(() => Promise.resolve({ default: stub('AkadListPage') }))
const AkadDetailPage               = lazy(() => Promise.resolve({ default: stub('AkadDetailPage') }))
const AkadFormPage                 = lazy(() => Promise.resolve({ default: stub('AkadFormPage') }))
const PembayaranAngsuranListPage   = lazy(() => Promise.resolve({ default: stub('PembayaranAngsuranListPage') }))
const PembayaranAngsuranFormPage   = lazy(() => Promise.resolve({ default: stub('PembayaranAngsuranFormPage') }))
const PembagianSHUListPage         = lazy(() => Promise.resolve({ default: stub('PembagianSHUListPage') }))
const PembagianSHUDetailPage       = lazy(() => Promise.resolve({ default: stub('PembagianSHUDetailPage') }))

// Kartu
const KartuListPage                = lazy(() => Promise.resolve({ default: stub('KartuListPage') }))
const KartuDetailPage              = lazy(() => Promise.resolve({ default: stub('KartuDetailPage') }))
const TerminalListPage             = lazy(() => Promise.resolve({ default: stub('TerminalListPage') }))
const TerminalFormPage             = lazy(() => Promise.resolve({ default: stub('TerminalFormPage') }))
const MerchantListPage             = lazy(() => Promise.resolve({ default: stub('MerchantListPage') }))
const MerchantFormPage             = lazy(() => Promise.resolve({ default: stub('MerchantFormPage') }))

// ZIS
const PenerimaanZISListPage        = lazy(() => Promise.resolve({ default: stub('PenerimaanZISListPage') }))
const PenerimaanZISDetailPage      = lazy(() => Promise.resolve({ default: stub('PenerimaanZISDetailPage') }))
const PenerimaanZISFormPage        = lazy(() => Promise.resolve({ default: stub('PenerimaanZISFormPage') }))
const ProgramPenyaluranListPage    = lazy(() => Promise.resolve({ default: stub('ProgramPenyaluranListPage') }))
const ProgramPenyaluranDetailPage  = lazy(() => Promise.resolve({ default: stub('ProgramPenyaluranDetailPage') }))
const ProgramPenyaluranFormPage    = lazy(() => Promise.resolve({ default: stub('ProgramPenyaluranFormPage') }))
const PenyaluranZISListPage        = lazy(() => Promise.resolve({ default: stub('PenyaluranZISListPage') }))
const PenyaluranZISFormPage        = lazy(() => Promise.resolve({ default: stub('PenyaluranZISFormPage') }))
const AsetWakafListPage            = lazy(() => Promise.resolve({ default: stub('AsetWakafListPage') }))
const AsetWakafFormPage            = lazy(() => Promise.resolve({ default: stub('AsetWakafFormPage') }))

// Kas Teller
const SesiKasTellerListPage        = lazy(() => Promise.resolve({ default: stub('SesiKasTellerListPage') }))
const SesiKasTellerDetailPage      = lazy(() => Promise.resolve({ default: stub('SesiKasTellerDetailPage') }))
const SesiKasTellerFormPage        = lazy(() => Promise.resolve({ default: stub('SesiKasTellerFormPage') }))

// Laporan & Pengaturan
const LaporanKoperasiPage          = lazy(() => Promise.resolve({ default: stub('LaporanKoperasiPage') }))
const PengaturanKoperasiPage       = lazy(() => Promise.resolve({ default: stub('PengaturanKoperasiPage') }))

const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'))

export const koperasiRoutes = [
  {
    path: '/koperasi',
    element: <AuthRoute><AppShell context="koperasi" /></AuthRoute>,
    children: [
      { path: 'dashboard',            element: <S><DashboardPage /></S> },
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
      { path: 'simpanan/permohonan/:id',          element: <S><PermohonanDetailPage /></S> },
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
