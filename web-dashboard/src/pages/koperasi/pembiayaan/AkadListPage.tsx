// src/pages/koperasi/pembiayaan/AkadListPage.tsx
import { useNavigate, Link } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { akadPembiayaanService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { AkadPembiayaan, StatusAkad } from '@/types/koperasi/pembiayaan.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const STATUS_COLOR: Record<StatusAkad, string> = {
  Pengajuan: 'var(--color-warning)',
  Aktif: 'var(--color-success)',
  Lunas: 'var(--color-text-tertiary)',
  Macet: 'var(--color-danger)',
  Ditolak: 'var(--color-danger)',
}

const COLUMNS: ColumnDef<AkadPembiayaan>[] = [
  { key: 'no_akad', header: 'No Akad', sortable: true },
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
    key: 'nominal_pokok',
    header: 'Pokok',
    render: (_v, row) => fmt(row.nominal_pokok),
  },
  {
    key: 'sisa_pokok',
    header: 'Sisa',
    render: (_v, row) => fmt(row.sisa_pokok),
  },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => <span style={{ color: STATUS_COLOR[row.status] }}>{row.status}</span>,
  },
]

const STATUS_OPTIONS: StatusAkad[] = ['Pengajuan', 'Aktif', 'Lunas', 'Macet', 'Ditolak']

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
  },
]

export function AkadListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<AkadPembiayaan>
      title="Akad Pembiayaan"
      addLabel="Buat Akad"
      onAdd={() => navigate('new')}
      queryKey={QK.akadPembiayaan}
      fetcher={akadPembiayaanService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}`)}
      searchPlaceholder="Cari no akad atau nasabah..."
      exportFilename="akad-pembiayaan"
      filterDefs={FILTER_DEFS}
    />
  )
}
