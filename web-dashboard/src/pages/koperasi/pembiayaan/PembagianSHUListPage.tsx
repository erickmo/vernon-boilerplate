// src/pages/koperasi/pembiayaan/PembagianSHUListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { pembagianSHUService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { PembagianSHU, StatusPembagianSHU } from '@/types/koperasi/pembiayaan.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const STATUS_COLOR: Record<StatusPembagianSHU, string> = {
  Draft: 'var(--color-text-tertiary)',
  Diproses: 'var(--color-warning)',
  Selesai: 'var(--color-success)',
}

const COLUMNS: ColumnDef<PembagianSHU>[] = [
  { key: 'periode', header: 'Periode', sortable: true },
  {
    key: 'total_shu',
    header: 'Total SHU',
    render: (_v, row) => fmt(row.total_shu),
  },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => <span style={{ color: STATUS_COLOR[row.status] }}>{row.status}</span>,
  },
  {
    key: 'jumlah_anggota',
    header: 'Jumlah Anggota',
    render: (_v, row) => row.jumlah_anggota.toLocaleString('id-ID'),
  },
  {
    key: 'tanggal',
    header: 'Tanggal',
    sortable: true,
    render: (_v, row) => new Date(row.tanggal).toLocaleDateString('id-ID'),
  },
]

export function PembagianSHUListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<PembagianSHU>
      title="Pembagian SHU"
      queryKey={QK.pembagianSHU}
      fetcher={pembagianSHUService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}`)}
      searchPlaceholder="Cari periode SHU..."
      exportFilename="pembagian-shu"
      defaultSort={{ key: 'periode', order: 'desc' }}
    />
  )
}
