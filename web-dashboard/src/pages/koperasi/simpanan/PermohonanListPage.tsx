// src/pages/koperasi/simpanan/PermohonanListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { permohonanSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { PermohonanSimpanan, TipePermohonan, StatusPermohonan } from '@/types/koperasi/simpanan.types'

const STATUS_COLOR: Record<StatusPermohonan, string> = {
  Draft: 'var(--color-text-tertiary)',
  Diajukan: 'var(--color-warning)',
  Disetujui: 'var(--color-success)',
  Ditolak: 'var(--color-danger)',
}

const COLUMNS: ColumnDef<PermohonanSimpanan>[] = [
  { key: 'tipe', header: 'Tipe Permohonan', sortable: true },
  { key: 'no_rekening', header: 'Rekening' },
  { key: 'nasabah_nama', header: 'Nasabah', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => <span style={{ color: STATUS_COLOR[row.status] }}>{row.status}</span>,
  },
  {
    key: 'tanggal',
    header: 'Tanggal',
    sortable: true,
    render: (_v, row) => new Date(row.tanggal).toLocaleDateString('id-ID'),
  },
]

const TIPE_OPTIONS: TipePermohonan[] = [
  'Buka Rekening', 'Tutup Rekening', 'Blokir Rekening', 'Unblokir Rekening', 'Aktivasi Dormant',
]

const STATUS_OPTIONS: StatusPermohonan[] = ['Draft', 'Diajukan', 'Disetujui', 'Ditolak']

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'tipe',
    label: 'Tipe',
    type: 'select',
    options: TIPE_OPTIONS.map((t) => ({ value: t, label: t })),
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
  },
]

export function PermohonanListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<PermohonanSimpanan>
      title="Permohonan Simpanan"
      addLabel="Buat Permohonan"
      onAdd={() => navigate('new')}
      queryKey={QK.permohonanSimpanan}
      fetcher={permohonanSimpananService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}`)}
      searchPlaceholder="Cari rekening atau nasabah..."
      filterDefs={FILTER_DEFS}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
    />
  )
}
