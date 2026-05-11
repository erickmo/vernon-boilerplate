// src/pages/sekolah/perpustakaan/DendaListPage.tsx

import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { dendaService } from '@/services/sekolah/perpustakaan.service'
import type { DendaPerpustakaan } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const COLUMNS: ColumnDef<DendaPerpustakaan>[] = [
  { key: 'anggota_nama', header: 'Anggota', sortable: true },
  { key: 'nomor_peminjaman', header: 'Ref Peminjaman' },
  {
    key: 'jumlah_denda',
    header: 'Jumlah Denda',
    render: (row) => `Rp ${row.jumlah_denda.toLocaleString('id-ID')}`,
  },
  {
    key: 'status_lunas',
    header: 'Status',
    render: (row) => (
      <span style={{ color: row.status_lunas ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
        {row.status_lunas ? 'Lunas' : 'Belum Lunas'}
      </span>
    ),
  },
  { key: 'tanggal_lunas', header: 'Tanggal Lunas', render: (row) => row.tanggal_lunas ?? '—' },
]

export default function DendaListPage() {
  return (
    <ListPageTemplate<DendaPerpustakaan>
      title="Denda Perpustakaan"
      queryKey="denda-perpustakaan"
      fetcher={dendaService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari anggota atau peminjaman..."
      exportFilename="denda-perpustakaan"
      readonly
      helpTitle="Denda Perpustakaan"
      helpText="Denda dibuat otomatis saat pengembalian terlambat. Tandai lunas melalui menu aksi di baris yang bersangkutan."
    />
  )
}

export default DendaListPage
