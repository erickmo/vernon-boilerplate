// src/pages/koperasi/kas-teller/SesiKasTellerListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { SesiKasTeller, SesiKasStatus } from '@/types/koperasi/kas-teller.types'
import type { ListParams } from '@/services/createEntityService'
import type { PaginatedResponse } from '@/types/api.types'

// Row adapter: ListPageTemplate requires { id: string }; backend uses `name`.
type SesiKasTellerRow = SesiKasTeller & { id: string }

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const STATUS_COLOR: Record<SesiKasStatus, string> = {
  'Draft': 'var(--color-slate-500)',
  'Aktif': 'var(--color-green-600)',
  'Pending Approval': 'var(--color-amber-600)',
  'Selesai': 'var(--color-slate-400)',
}

const COLUMNS: ColumnDef<SesiKasTellerRow>[] = [
  {
    key: 'tanggal',
    header: 'Tanggal',
    render: (_v, row) => new Date(row.tanggal).toLocaleDateString('id-ID'),
    sortable: true,
  },
  { key: 'teller', header: 'Teller', sortable: true },
  { key: 'shift', header: 'Shift', sortable: true },
  {
    key: 'waktu_buka',
    header: 'Waktu Buka',
    render: (_v, row) =>
      row.waktu_buka
        ? new Date(row.waktu_buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '—',
  },
  {
    key: 'waktu_tutup',
    header: 'Waktu Tutup',
    render: (_v, row) =>
      row.waktu_tutup
        ? new Date(row.waktu_tutup).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '—',
  },
  { key: 'modal_kas', header: 'Modal Kas', render: (_v, row) => fmt(row.modal_kas) },
  { key: 'total_setoran', header: 'Setoran', render: (_v, row) => fmt(row.total_setoran ?? 0) },
  { key: 'total_penarikan', header: 'Penarikan', render: (_v, row) => fmt(row.total_penarikan ?? 0) },
  { key: 'selisih', header: 'Selisih', render: (_v, row) => fmt(row.selisih ?? 0) },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => (
      <span style={{ color: STATUS_COLOR[row.status], fontWeight: 600 }}>{row.status}</span>
    ),
  },
]

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'Draft', label: 'Draft' },
      { value: 'Aktif', label: 'Aktif' },
      { value: 'Pending Approval', label: 'Pending Approval' },
      { value: 'Selesai', label: 'Selesai' },
    ],
  },
]

async function fetchRows(params: ListParams): Promise<PaginatedResponse<SesiKasTellerRow>> {
  const res = await sesiKasTellerService.list(params)
  return {
    ...res,
    items: res.items.map((s) => ({ ...s, id: s.name })),
  }
}

export function SesiKasTellerListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<SesiKasTellerRow>
      title="Sesi Kas Teller"
      addLabel="Buka Sesi Baru"
      onAdd={() => navigate('/koperasi/teller')}
      queryKey="koperasi-sesi-kas-teller"
      fetcher={fetchRows}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari teller..."
      onRowClick={(row) => navigate(`/koperasi/kas-teller/sesi/${row.name}`)}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      exportFilename="sesi-kas-teller"
    />
  )
}
