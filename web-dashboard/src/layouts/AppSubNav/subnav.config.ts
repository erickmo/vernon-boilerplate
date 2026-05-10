export interface SubNavConfigItem {
  key: string
  label: string
  path: string
}

type SubNavConfig = {
  sekolah: Record<string, SubNavConfigItem[]>
  koperasi: Record<string, SubNavConfigItem[]>
}

export const SUBNAV_CONFIG: SubNavConfig = {
  sekolah: {
    siswa: [
      { key: 'siswa',       label: 'Daftar Siswa',       path: '/sekolah/siswa' },
      { key: 'pendaftaran', label: 'Pendaftaran Siswa',   path: '/sekolah/siswa/pendaftaran' },
      { key: 'rombel',      label: 'Rombongan Belajar',   path: '/sekolah/siswa/rombel' },
      { key: 'mutasi',      label: 'Mutasi Siswa',        path: '/sekolah/siswa/mutasi' },
      { key: 'kelulusan',   label: 'Kelulusan Siswa',     path: '/sekolah/siswa/kelulusan' },
    ],
    guru: [
      { key: 'guru',      label: 'Daftar Guru',    path: '/sekolah/guru' },
      { key: 'penugasan', label: 'Penugasan Guru', path: '/sekolah/guru/penugasan' },
      { key: 'berkas',    label: 'Berkas Guru',    path: '/sekolah/guru/berkas' },
    ],
    akademik: [
      { key: 'mata-pelajaran', label: 'Mata Pelajaran',   path: '/sekolah/akademik/mata-pelajaran' },
      { key: 'jadwal',         label: 'Jadwal Pelajaran',  path: '/sekolah/akademik/jadwal' },
      { key: 'absensi-siswa',  label: 'Absensi Siswa',    path: '/sekolah/akademik/absensi-siswa' },
      { key: 'absensi-guru',   label: 'Absensi Guru',     path: '/sekolah/akademik/absensi-guru' },
      { key: 'penilaian',      label: 'Penilaian',        path: '/sekolah/akademik/penilaian' },
      { key: 'raport',         label: 'Raport',           path: '/sekolah/akademik/raport' },
      { key: 'laporan-dinas',  label: 'Laporan Dinas',    path: '/sekolah/akademik/laporan-dinas' },
    ],
    perpustakaan: [
      { key: 'buku',         label: 'Katalog Buku',  path: '/sekolah/perpustakaan/buku' },
      { key: 'anggota',      label: 'Anggota',       path: '/sekolah/perpustakaan/anggota' },
      { key: 'peminjaman',   label: 'Peminjaman',    path: '/sekolah/perpustakaan/peminjaman' },
      { key: 'pengembalian', label: 'Pengembalian',  path: '/sekolah/perpustakaan/pengembalian' },
      { key: 'denda',        label: 'Denda',         path: '/sekolah/perpustakaan/denda' },
      { key: 'reservasi',    label: 'Reservasi',     path: '/sekolah/perpustakaan/reservasi' },
    ],
    pengaturan: [
      { key: 'sekolah',      label: 'Sekolah',       path: '/sekolah/pengaturan/sekolah' },
      { key: 'tahun-ajaran', label: 'Tahun Ajaran',  path: '/sekolah/pengaturan/tahun-ajaran' },
      { key: 'semester',     label: 'Semester',      path: '/sekolah/pengaturan/semester' },
      { key: 'modul-aktif',  label: 'Modul Aktif',   path: '/sekolah/pengaturan/modul-aktif' },
    ],
  },
  koperasi: {
    anggota: [
      { key: 'nasabah',          label: 'Nasabah',          path: '/koperasi/anggota/nasabah' },
      { key: 'anggota-koperasi', label: 'Anggota Koperasi', path: '/koperasi/anggota/anggota-koperasi' },
      { key: 'simpanan-pokok',   label: 'Simpanan Pokok',   path: '/koperasi/anggota/simpanan-pokok' },
    ],
    simpanan: [
      { key: 'produk',     label: 'Produk Simpanan',   path: '/koperasi/simpanan/produk' },
      { key: 'rekening',   label: 'Rekening Simpanan', path: '/koperasi/simpanan/rekening' },
      { key: 'transaksi',  label: 'Transaksi',         path: '/koperasi/simpanan/transaksi' },
      { key: 'permohonan', label: 'Permohonan',        path: '/koperasi/simpanan/permohonan' },
    ],
    pembiayaan: [
      { key: 'produk',     label: 'Produk Pembiayaan',   path: '/koperasi/pembiayaan/produk' },
      { key: 'akad',       label: 'Akad Pembiayaan',     path: '/koperasi/pembiayaan/akad' },
      { key: 'pembayaran', label: 'Pembayaran Angsuran', path: '/koperasi/pembiayaan/pembayaran' },
      { key: 'shu',        label: 'Pembagian SHU',       path: '/koperasi/pembiayaan/shu' },
    ],
    kartu: [
      { key: 'kartu',    label: 'Daftar Kartu', path: '/koperasi/kartu/daftar' },
      { key: 'terminal', label: 'Terminal',     path: '/koperasi/kartu/terminal' },
      { key: 'merchant', label: 'Merchant',     path: '/koperasi/kartu/merchant' },
    ],
    zis: [
      { key: 'penerimaan', label: 'Penerimaan ZIS',     path: '/koperasi/zis/penerimaan' },
      { key: 'program',    label: 'Program Penyaluran', path: '/koperasi/zis/program' },
      { key: 'penyaluran', label: 'Penyaluran ZIS',     path: '/koperasi/zis/penyaluran' },
      { key: 'wakaf',      label: 'Aset Wakaf',         path: '/koperasi/zis/wakaf' },
    ],
    'kas-teller': [
      { key: 'sesi', label: 'Sesi Kas Teller', path: '/koperasi/kas-teller/sesi' },
    ],
    laporan: [
      { key: 'export', label: 'Export Laporan', path: '/koperasi/laporan/export' },
    ],
    pengaturan: [
      { key: 'pengaturan-koperasi', label: 'Pengaturan Koperasi', path: '/koperasi/pengaturan/koperasi' },
    ],
  },
}
