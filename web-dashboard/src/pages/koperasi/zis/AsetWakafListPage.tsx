// src/pages/koperasi/zis/AsetWakafListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { asetWakafService } from '@/services/koperasi/zis.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { AsetWakaf } from '@/types/koperasi/zis.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<AsetWakaf>[] = [
  { key: 'nama_aset', header: 'Nama Aset', sortable: true },
  { key: 'jenis_aset', header: 'Jenis Aset', sortable: true },
  { key: 'nilai', header: 'Nilai', render: (_v, row) => fmt(row.nilai), sortable: true },
  { key: 'wakif', header: 'Wakif', sortable: true },
  { key: 'tanggal_wakaf', header: 'Tanggal Wakaf', render: (_v, row) => new Date(row.tanggal_wakaf).toLocaleDateString('id-ID'), sortable: true },
]

export function AsetWakafListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<AsetWakaf>
      title="Aset Wakaf"
      addLabel="Tambah Aset Wakaf"
      onAdd={() => navigate('/koperasi/zis/wakaf/new')}
      queryKey="koperasi-aset-wakaf"
      fetcher={asetWakafService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari nama aset atau wakif..."
      onRowClick={(row) => navigate(`/koperasi/zis/wakaf/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => asetWakafService.delete(row.id),
        dialogTitle: 'Hapus Aset Wakaf?',
        dialogBody: (row) => `Aset wakaf "${row.nama_aset}" akan dihapus permanen.`,
        successMessage: (row) => `Aset wakaf "${row.nama_aset}" berhasil dihapus.`,
      }}
      defaultSort={{ key: 'tanggal_wakaf', order: 'desc' }}
      exportFilename="aset-wakaf"
    />
  )
}
