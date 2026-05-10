// src/pages/koperasi/kas-teller/SesiKasTellerListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { SesiKasTeller } from '@/types/koperasi/kas-teller.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<SesiKasTeller>[] = [
  { key: 'tanggal', header: 'Tanggal', render: (_v, row) => new Date(row.tanggal).toLocaleDateString('id-ID'), sortable: true },
  { key: 'teller_nama', header: 'Teller', sortable: true },
  {
    key: 'jam_buka',
    header: 'Buka Kas',
    render: (_v, row) => new Date(row.jam_buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  },
  {
    key: 'jam_tutup',
    header: 'Tutup Kas',
    render: (_v, row) =>
      row.jam_tutup
        ? new Date(row.jam_tutup).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '—',
  },
  { key: 'saldo_awal', header: 'Saldo Awal', render: (_v, row) => fmt(row.saldo_awal) },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => (
      <span style={{
        color: row.status === 'aktif' ? 'var(--color-green-600)' : 'var(--color-slate-500)',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}>
        {row.status}
      </span>
    ),
  },
]

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'aktif', label: 'Aktif' },
      { value: 'tutup', label: 'Tutup' },
    ],
  },
]

export function SesiKasTellerListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<SesiKasTeller>
      title="Sesi Kas Teller"
      addLabel="Buka Sesi Baru"
      onAdd={() => navigate('/koperasi/kas-teller/sesi/new')}
      queryKey="koperasi-sesi-kas-teller"
      fetcher={sesiKasTellerService.list}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari teller..."
      onRowClick={(row) => navigate(`/koperasi/kas-teller/sesi/${row.id}`)}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      exportFilename="sesi-kas-teller"
    />
  )
}
