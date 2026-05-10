// src/pages/koperasi/simpanan/TransaksiSimpananListPage.tsx
import { Link } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { transaksiSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { TransaksiSimpanan, TipeTransaksiSimpanan } from '@/types/koperasi/simpanan.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<TransaksiSimpanan>[] = [
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
  { key: 'tipe', header: 'Tipe', sortable: true },
  {
    key: 'nominal',
    header: 'Nominal',
    render: (_v, row) => fmt(row.nominal),
  },
  {
    key: 'tanggal',
    header: 'Tanggal',
    sortable: true,
    render: (_v, row) => new Date(row.tanggal).toLocaleDateString('id-ID'),
  },
]

const TIPE_OPTIONS: TipeTransaksiSimpanan[] = ['Setoran', 'Penarikan', 'Bagi Hasil']

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'tipe',
    label: 'Tipe Transaksi',
    type: 'select',
    options: TIPE_OPTIONS.map((t) => ({ value: t, label: t })),
  },
  { key: 'tanggal_from', label: 'Dari Tanggal', type: 'date' },
  { key: 'tanggal_to', label: 'Sampai Tanggal', type: 'date' },
]

export function TransaksiSimpananListPage() {
  return (
    <ListPageTemplate<TransaksiSimpanan>
      title="Transaksi Simpanan"
      queryKey={QK.transaksiSimpanan}
      fetcher={transaksiSimpananService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari no rekening atau nasabah..."
      exportFilename="transaksi-simpanan"
      filterDefs={FILTER_DEFS}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      readonly
    />
  )
}
