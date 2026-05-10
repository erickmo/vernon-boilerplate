// src/pages/koperasi/pembiayaan/PembayaranAngsuranListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { pembayaranAngsuranService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { PembayaranAngsuran } from '@/types/koperasi/pembiayaan.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<PembayaranAngsuran>[] = [
  { key: 'no_akad', header: 'No Akad', sortable: true },
  { key: 'nasabah_nama', header: 'Nasabah', sortable: true },
  { key: 'no_angsuran', header: 'Angsuran ke-', sortable: true },
  {
    key: 'nominal',
    header: 'Nominal',
    render: (_v, row) => fmt(row.nominal),
  },
  {
    key: 'tanggal_bayar',
    header: 'Tanggal Bayar',
    sortable: true,
    render: (_v, row) => new Date(row.tanggal_bayar).toLocaleDateString('id-ID'),
  },
]

export function PembayaranAngsuranListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<PembayaranAngsuran>
      title="Pembayaran Angsuran"
      addLabel="Catat Pembayaran"
      onAdd={() => navigate('new')}
      queryKey={QK.pembayaranAngsuran}
      fetcher={pembayaranAngsuranService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari no akad atau nasabah..."
      exportFilename="pembayaran-angsuran"
      defaultSort={{ key: 'tanggal_bayar', order: 'desc' }}
    />
  )
}
