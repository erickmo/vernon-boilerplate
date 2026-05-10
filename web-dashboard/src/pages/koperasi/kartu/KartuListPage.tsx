// src/pages/koperasi/kartu/KartuListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { kartuService } from '@/services/koperasi/kartu.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { Kartu } from '@/types/koperasi/kartu.types'

const COLUMNS: ColumnDef<Kartu>[] = [
  { key: 'uid_nfc', header: 'UID NFC', sortable: true },
  {
    key: 'nasabah_nama',
    header: 'Nasabah',
    render: (_v, row) => row.nasabah_nama,
    sortable: true,
  },
  {
    key: 'tipe',
    header: 'Tipe',
    render: (_v, row) => (
      <span style={{
        textTransform: 'capitalize',
        fontWeight: 600,
        color: row.tipe === 'emoney' ? 'var(--color-indigo-600)' : 'var(--color-slate-700)',
      }}>
        {row.tipe === 'emoney' ? 'E-Money' : 'Debit'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => {
      const colorMap: Record<string, string> = {
        aktif: 'var(--color-green-600)',
        blokir: 'var(--color-red-600)',
        expired: 'var(--color-orange-500)',
        nonaktif: 'var(--color-slate-400)',
      }
      return (
        <span style={{ color: colorMap[row.status] ?? 'inherit', textTransform: 'capitalize' }}>
          {row.status}
        </span>
      )
    },
  },
  {
    key: 'expired',
    header: 'Expired',
    render: (_v, row) => new Date(row.expired).toLocaleDateString('id-ID'),
    sortable: true,
  },
]

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'tipe',
    label: 'Tipe',
    type: 'select',
    options: [
      { value: 'debit', label: 'Debit' },
      { value: 'emoney', label: 'E-Money' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'aktif', label: 'Aktif' },
      { value: 'blokir', label: 'Diblokir' },
      { value: 'expired', label: 'Expired' },
      { value: 'nonaktif', label: 'Nonaktif' },
    ],
  },
]

export function KartuListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Kartu>
      title="Daftar Kartu"
      queryKey="koperasi-kartu"
      fetcher={kartuService.list}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari UID NFC atau nasabah..."
      onRowClick={(_row) => navigate(`/koperasi/kartu/daftar/${_row.id}`)}
      exportFilename="kartu-koperasi"
      defaultSort={{ key: 'creation', order: 'desc' }}
    />
  )
}
