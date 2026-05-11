// src/pages/koperasi/simpanan/ProdukSimpananListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import type { DeleteConfig } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { produkSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { ProdukSimpanan } from '@/types/koperasi/simpanan.types'

const COLUMNS: ColumnDef<ProdukSimpanan>[] = [
  { key: 'nama', header: 'Nama Produk', sortable: true },
  { key: 'tipe', header: 'Tipe', sortable: true },
  {
    key: 'nisbah_bagi_hasil',
    header: 'Bagi Hasil %',
    render: (_v, row) => `${row.nisbah_bagi_hasil}%`,
  },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => (
      <span style={{ color: row.status === 'Aktif' ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
        {row.status}
      </span>
    ),
  },
]

const DELETE_CONFIG: DeleteConfig<ProdukSimpanan> = {
  onDelete: (row) => produkSimpananService.delete(row.id),
  dialogTitle: 'Hapus Produk Simpanan?',
  dialogBody: (row) => `Produk "${row.nama}" akan dihapus permanen.`,
  successMessage: (row) => `Produk "${row.nama}" berhasil dihapus.`,
}

export function ProdukSimpananListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<ProdukSimpanan>
      title="Produk Simpanan"
      addLabel="Tambah Produk"
      onAdd={() => navigate('new')}
      queryKey={QK.produkSimpanan}
      fetcher={produkSimpananService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}/edit`)}
      searchPlaceholder="Cari produk..."
      exportFilename="produk-simpanan"
      deleteConfig={DELETE_CONFIG}
    />
  )
}
