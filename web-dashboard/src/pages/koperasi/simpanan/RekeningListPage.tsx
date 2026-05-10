// src/pages/koperasi/simpanan/RekeningListPage.tsx
import { useNavigate, Link } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { rekeningSimapnanService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { RekeningSimapnan } from '@/types/koperasi/simpanan.types'

const COLUMNS: ColumnDef<RekeningSimapnan>[] = [
  { key: 'no_rekening', header: 'No Rekening', sortable: true },
  {
    key: 'nasabah_nama',
    header: 'Nasabah',
    render: (_v, row) => (
      <Link
        to={`/koperasi/anggota/nasabah/${row.nasabah_id}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
      >
        {row.nasabah_nama}
      </Link>
    ),
  },
  { key: 'produk_nama', header: 'Produk', sortable: true },
  {
    key: 'saldo',
    header: 'Saldo',
    render: (_v, row) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.saldo),
  },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => {
      const colors: Record<string, string> = {
        Aktif: 'var(--color-success)',
        Dormant: 'var(--color-warning)',
        Blokir: 'var(--color-danger)',
        Tutup: 'var(--color-text-tertiary)',
      }
      return <span style={{ color: colors[row.status] ?? 'inherit' }}>{row.status}</span>
    },
  },
]

export function RekeningListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<RekeningSimapnan>
      title="Rekening Simpanan"
      queryKey={QK.rekeningSimapnan}
      fetcher={rekeningSimapnanService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}`)}
      searchPlaceholder="Cari no rekening atau nasabah..."
      exportFilename="rekening-simpanan"
    />
  )
}
