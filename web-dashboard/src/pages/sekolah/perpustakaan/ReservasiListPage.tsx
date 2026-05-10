// src/pages/sekolah/perpustakaan/ReservasiListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { reservasiService } from '@/services/sekolah/perpustakaan.service'
import type { ReservasiBuku } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const STATUS_COLOR: Record<string, string> = {
  Menunggu: 'var(--color-warning)',
  Aktif: 'var(--color-info)',
  Selesai: 'var(--color-success)',
  Dibatalkan: 'var(--color-text-secondary)',
}

const COLUMNS: ColumnDef<ReservasiBuku>[] = [
  { key: 'judul_buku', label: 'Buku', sortable: true },
  { key: 'anggota_nama', label: 'Anggota', sortable: true },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span style={{ color: STATUS_COLOR[row.status] ?? 'inherit', fontWeight: 600 }}>{row.status}</span>
    ),
  },
  { key: 'tanggal_reservasi', label: 'Tanggal Reservasi', sortable: true },
]

export function ReservasiListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<ReservasiBuku>
      title="Reservasi Buku"
      queryKey="reservasi-buku"
      fetcher={reservasiService.list}
      columns={COLUMNS}
      addLabel="Buat Reservasi"
      onAdd={() => navigate('/sekolah/perpustakaan/reservasi/new')}
      onRowClick={(row) => navigate(`/sekolah/perpustakaan/reservasi/${row.id}/edit`)}
      searchPlaceholder="Cari buku atau anggota..."
      exportFilename="reservasi-buku"
      deleteConfig={{
        onDelete: (row) => reservasiService.delete(row.id),
        dialogTitle: 'Batalkan Reservasi?',
        dialogBody: (row) => `Reservasi buku "${row.judul_buku}" oleh ${row.anggota_nama} akan dihapus.`,
        successMessage: (row) => `Reservasi "${row.judul_buku}" berhasil dibatalkan.`,
      }}
    />
  )
}

export default ReservasiListPage
