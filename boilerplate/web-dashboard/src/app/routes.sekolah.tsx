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

// Siswa
const SiswaListPage              = lazy(() => import('@/pages/sekolah/siswa/SiswaListPage'))
const SiswaDetailPage            = lazy(() => import('@/pages/sekolah/siswa/SiswaDetailPage'))
const SiswaFormPage              = lazy(() => import('@/pages/sekolah/siswa/SiswaFormPage'))
const PendaftaranSiswaListPage   = lazy(() => import('@/pages/sekolah/siswa/PendaftaranSiswaListPage'))
const PendaftaranSiswaFormPage   = lazy(() => Promise.resolve({ default: stub('PendaftaranSiswaFormPage') }))
const RombelListPage             = lazy(() => import('@/pages/sekolah/siswa/RombelListPage'))
const RombelFormPage             = lazy(() => Promise.resolve({ default: stub('RombelFormPage') }))
const MutasiSiswaListPage        = lazy(() => Promise.resolve({ default: stub('MutasiSiswaListPage') }))
const MutasiSiswaFormPage        = lazy(() => Promise.resolve({ default: stub('MutasiSiswaFormPage') }))
const KelulusanSiswaListPage     = lazy(() => Promise.resolve({ default: stub('KelulusanSiswaListPage') }))
const KelulusanSiswaFormPage     = lazy(() => Promise.resolve({ default: stub('KelulusanSiswaFormPage') }))

// Guru
const GuruListPage               = lazy(() => import('@/pages/sekolah/guru/GuruListPage'))
const GuruDetailPage             = lazy(() => import('@/pages/sekolah/guru/GuruDetailPage'))
const GuruFormPage               = lazy(() => import('@/pages/sekolah/guru/GuruFormPage'))
const PenugasanGuruListPage      = lazy(() => Promise.resolve({ default: stub('PenugasanGuruListPage') }))
const PenugasanGuruFormPage      = lazy(() => Promise.resolve({ default: stub('PenugasanGuruFormPage') }))
const BerkasGuruListPage         = lazy(() => Promise.resolve({ default: stub('BerkasGuruListPage') }))
const BerkasGuruFormPage         = lazy(() => Promise.resolve({ default: stub('BerkasGuruFormPage') }))

// Akademik
const MataPelajaranListPage      = lazy(() => Promise.resolve({ default: stub('MataPelajaranListPage') }))
const MataPelajaranFormPage      = lazy(() => Promise.resolve({ default: stub('MataPelajaranFormPage') }))
const JadwalListPage             = lazy(() => Promise.resolve({ default: stub('JadwalListPage') }))
const JadwalDetailPage           = lazy(() => Promise.resolve({ default: stub('JadwalDetailPage') }))
const JadwalFormPage             = lazy(() => Promise.resolve({ default: stub('JadwalFormPage') }))
const AbsensiSiswaListPage       = lazy(() => Promise.resolve({ default: stub('AbsensiSiswaListPage') }))
const AbsensiSiswaFormPage       = lazy(() => Promise.resolve({ default: stub('AbsensiSiswaFormPage') }))
const AbsensiGuruListPage        = lazy(() => Promise.resolve({ default: stub('AbsensiGuruListPage') }))
const AbsensiGuruFormPage        = lazy(() => Promise.resolve({ default: stub('AbsensiGuruFormPage') }))
const PenilaianListPage          = lazy(() => Promise.resolve({ default: stub('PenilaianListPage') }))
const PenilaianFormPage          = lazy(() => Promise.resolve({ default: stub('PenilaianFormPage') }))
const RaportListPage             = lazy(() => Promise.resolve({ default: stub('RaportListPage') }))
const RaportDetailPage           = lazy(() => Promise.resolve({ default: stub('RaportDetailPage') }))
const LaporanDinasPage           = lazy(() => Promise.resolve({ default: stub('LaporanDinasPage') }))

// Perpustakaan
const BukuListPage                  = lazy(() => Promise.resolve({ default: stub('BukuListPage') }))
const BukuDetailPage                = lazy(() => Promise.resolve({ default: stub('BukuDetailPage') }))
const BukuFormPage                  = lazy(() => Promise.resolve({ default: stub('BukuFormPage') }))
const AnggotaPerpustakaanListPage   = lazy(() => Promise.resolve({ default: stub('AnggotaPerpustakaanListPage') }))
const AnggotaPerpustakaanFormPage   = lazy(() => Promise.resolve({ default: stub('AnggotaPerpustakaanFormPage') }))
const PeminjamanListPage            = lazy(() => Promise.resolve({ default: stub('PeminjamanListPage') }))
const PeminjamanDetailPage          = lazy(() => Promise.resolve({ default: stub('PeminjamanDetailPage') }))
const PeminjamanFormPage            = lazy(() => Promise.resolve({ default: stub('PeminjamanFormPage') }))
const PengembalianListPage          = lazy(() => Promise.resolve({ default: stub('PengembalianListPage') }))
const PengembalianFormPage          = lazy(() => Promise.resolve({ default: stub('PengembalianFormPage') }))
const DendaListPage                 = lazy(() => Promise.resolve({ default: stub('DendaListPage') }))
const ReservasiListPage             = lazy(() => Promise.resolve({ default: stub('ReservasiListPage') }))
const ReservasiFormPage             = lazy(() => Promise.resolve({ default: stub('ReservasiFormPage') }))

// Pengaturan
const SekolahSettingsPage   = lazy(() => Promise.resolve({ default: stub('SekolahSettingsPage') }))
const TahunAjaranListPage   = lazy(() => Promise.resolve({ default: stub('TahunAjaranListPage') }))
const TahunAjaranFormPage   = lazy(() => Promise.resolve({ default: stub('TahunAjaranFormPage') }))
const SemesterListPage      = lazy(() => Promise.resolve({ default: stub('SemesterListPage') }))
const SemesterFormPage      = lazy(() => Promise.resolve({ default: stub('SemesterFormPage') }))
const ModulAktifPage        = lazy(() => Promise.resolve({ default: stub('ModulAktifPage') }))

const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'))

export const sekolahRoutes = [
  {
    path: '/sekolah',
    element: <AuthRoute><AppShell context="sekolah" /></AuthRoute>,
    children: [
      { path: 'dashboard',          element: <S><DashboardPage /></S> },
      // Siswa
      { path: 'siswa',              element: <S><SiswaListPage /></S> },
      { path: 'siswa/new',          element: <S><SiswaFormPage /></S> },
      { path: 'siswa/:id',          element: <S><SiswaDetailPage /></S> },
      { path: 'siswa/:id/edit',     element: <S><SiswaFormPage /></S> },
      { path: 'siswa/pendaftaran',          element: <S><PendaftaranSiswaListPage /></S> },
      { path: 'siswa/pendaftaran/new',      element: <S><PendaftaranSiswaFormPage /></S> },
      { path: 'siswa/pendaftaran/:id/edit', element: <S><PendaftaranSiswaFormPage /></S> },
      { path: 'siswa/rombel',          element: <S><RombelListPage /></S> },
      { path: 'siswa/rombel/new',      element: <S><RombelFormPage /></S> },
      { path: 'siswa/rombel/:id/edit', element: <S><RombelFormPage /></S> },
      { path: 'siswa/mutasi',          element: <S><MutasiSiswaListPage /></S> },
      { path: 'siswa/mutasi/new',      element: <S><MutasiSiswaFormPage /></S> },
      { path: 'siswa/mutasi/:id/edit', element: <S><MutasiSiswaFormPage /></S> },
      { path: 'siswa/kelulusan',          element: <S><KelulusanSiswaListPage /></S> },
      { path: 'siswa/kelulusan/new',      element: <S><KelulusanSiswaFormPage /></S> },
      { path: 'siswa/kelulusan/:id/edit', element: <S><KelulusanSiswaFormPage /></S> },
      // Guru
      { path: 'guru',              element: <S><GuruListPage /></S> },
      { path: 'guru/new',          element: <S><GuruFormPage /></S> },
      { path: 'guru/:id',          element: <S><GuruDetailPage /></S> },
      { path: 'guru/:id/edit',     element: <S><GuruFormPage /></S> },
      { path: 'guru/penugasan',          element: <S><PenugasanGuruListPage /></S> },
      { path: 'guru/penugasan/new',      element: <S><PenugasanGuruFormPage /></S> },
      { path: 'guru/penugasan/:id/edit', element: <S><PenugasanGuruFormPage /></S> },
      { path: 'guru/berkas',          element: <S><BerkasGuruListPage /></S> },
      { path: 'guru/berkas/new',      element: <S><BerkasGuruFormPage /></S> },
      { path: 'guru/berkas/:id/edit', element: <S><BerkasGuruFormPage /></S> },
      // Akademik
      { path: 'akademik',                         element: <S><MataPelajaranListPage /></S> },
      { path: 'akademik/mata-pelajaran',          element: <S><MataPelajaranListPage /></S> },
      { path: 'akademik/mata-pelajaran/new',      element: <S><MataPelajaranFormPage /></S> },
      { path: 'akademik/mata-pelajaran/:id/edit', element: <S><MataPelajaranFormPage /></S> },
      { path: 'akademik/jadwal',          element: <S><JadwalListPage /></S> },
      { path: 'akademik/jadwal/new',      element: <S><JadwalFormPage /></S> },
      { path: 'akademik/jadwal/:id',      element: <S><JadwalDetailPage /></S> },
      { path: 'akademik/jadwal/:id/edit', element: <S><JadwalFormPage /></S> },
      { path: 'akademik/absensi-siswa',          element: <S><AbsensiSiswaListPage /></S> },
      { path: 'akademik/absensi-siswa/new',      element: <S><AbsensiSiswaFormPage /></S> },
      { path: 'akademik/absensi-siswa/:id/edit', element: <S><AbsensiSiswaFormPage /></S> },
      { path: 'akademik/absensi-guru',          element: <S><AbsensiGuruListPage /></S> },
      { path: 'akademik/absensi-guru/new',      element: <S><AbsensiGuruFormPage /></S> },
      { path: 'akademik/absensi-guru/:id/edit', element: <S><AbsensiGuruFormPage /></S> },
      { path: 'akademik/penilaian',          element: <S><PenilaianListPage /></S> },
      { path: 'akademik/penilaian/new',      element: <S><PenilaianFormPage /></S> },
      { path: 'akademik/penilaian/:id/edit', element: <S><PenilaianFormPage /></S> },
      { path: 'akademik/raport',     element: <S><RaportListPage /></S> },
      { path: 'akademik/raport/:id', element: <S><RaportDetailPage /></S> },
      { path: 'akademik/laporan-dinas', element: <S><LaporanDinasPage /></S> },
      // Perpustakaan
      { path: 'perpustakaan',               element: <S><BukuListPage /></S> },
      { path: 'perpustakaan/buku',          element: <S><BukuListPage /></S> },
      { path: 'perpustakaan/buku/new',      element: <S><BukuFormPage /></S> },
      { path: 'perpustakaan/buku/:id',      element: <S><BukuDetailPage /></S> },
      { path: 'perpustakaan/buku/:id/edit', element: <S><BukuFormPage /></S> },
      { path: 'perpustakaan/anggota',          element: <S><AnggotaPerpustakaanListPage /></S> },
      { path: 'perpustakaan/anggota/new',      element: <S><AnggotaPerpustakaanFormPage /></S> },
      { path: 'perpustakaan/anggota/:id/edit', element: <S><AnggotaPerpustakaanFormPage /></S> },
      { path: 'perpustakaan/peminjaman',          element: <S><PeminjamanListPage /></S> },
      { path: 'perpustakaan/peminjaman/new',      element: <S><PeminjamanFormPage /></S> },
      { path: 'perpustakaan/peminjaman/:id',      element: <S><PeminjamanDetailPage /></S> },
      { path: 'perpustakaan/peminjaman/:id/edit', element: <S><PeminjamanFormPage /></S> },
      { path: 'perpustakaan/pengembalian',          element: <S><PengembalianListPage /></S> },
      { path: 'perpustakaan/pengembalian/new',      element: <S><PengembalianFormPage /></S> },
      { path: 'perpustakaan/pengembalian/:id/edit', element: <S><PengembalianFormPage /></S> },
      { path: 'perpustakaan/denda', element: <S><DendaListPage /></S> },
      { path: 'perpustakaan/reservasi',          element: <S><ReservasiListPage /></S> },
      { path: 'perpustakaan/reservasi/new',      element: <S><ReservasiFormPage /></S> },
      { path: 'perpustakaan/reservasi/:id/edit', element: <S><ReservasiFormPage /></S> },
      // Pengaturan
      { path: 'pengaturan',                       element: <S><SekolahSettingsPage /></S> },
      { path: 'pengaturan/sekolah',               element: <S><SekolahSettingsPage /></S> },
      { path: 'pengaturan/tahun-ajaran',          element: <S><TahunAjaranListPage /></S> },
      { path: 'pengaturan/tahun-ajaran/new',      element: <S><TahunAjaranFormPage /></S> },
      { path: 'pengaturan/tahun-ajaran/:id/edit', element: <S><TahunAjaranFormPage /></S> },
      { path: 'pengaturan/semester',              element: <S><SemesterListPage /></S> },
      { path: 'pengaturan/semester/new',          element: <S><SemesterFormPage /></S> },
      { path: 'pengaturan/semester/:id/edit',     element: <S><SemesterFormPage /></S> },
      { path: 'pengaturan/modul-aktif',           element: <S><ModulAktifPage /></S> },
    ],
  },
]
