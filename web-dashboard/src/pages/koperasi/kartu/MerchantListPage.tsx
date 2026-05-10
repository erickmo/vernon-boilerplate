// src/pages/koperasi/kartu/MerchantListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { merchantService } from '@/services/koperasi/kartu.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { Merchant } from '@/types/koperasi/kartu.types'

const COLUMNS: ColumnDef<Merchant>[] = [
  { key: 'nama', header: 'Nama Merchant', sortable: true },
  { key: 'rekening_settlement_nomor', header: 'Rekening Settlement', render: (_v, row) => row.rekening_settlement_nomor ?? '—' },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => (
      <span style={{ color: row.status === 'aktif' ? 'var(--color-green-600)' : 'var(--color-slate-400)', textTransform: 'capitalize' }}>
        {row.status}
      </span>
    ),
  },
]

export function MerchantListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Merchant>
      title="Merchant"
      addLabel="Tambah Merchant"
      onAdd={() => navigate('/koperasi/kartu/merchant/new')}
      queryKey="koperasi-merchant"
      fetcher={merchantService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari merchant..."
      onRowClick={(row) => navigate(`/koperasi/kartu/merchant/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => merchantService.delete(row.id),
        dialogTitle: 'Hapus Merchant?',
        dialogBody: (row) => `Merchant "${row.nama}" akan dihapus permanen.`,
        successMessage: (row) => `Merchant "${row.nama}" berhasil dihapus.`,
      }}
      exportFilename="merchant-koperasi"
    />
  )
}
