// src/pages/koperasi/anggota/SimpananPokokListPage.tsx
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { simpananPokokService } from '@/services/koperasi/simpanan-pokok.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { SimpananPokok } from '@/types/koperasi/anggota.types'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

const COLUMNS: ColumnDef<SimpananPokok>[] = [
  { key: 'nasabah_nama', header: 'Nasabah', sortable: true },
  {
    key: 'jumlah',
    header: 'Jumlah',
    sortable: true,
    render: (_value, row) => (
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(row.jumlah)}</span>
    ),
  },
  {
    key: 'tanggal',
    header: 'Tanggal',
    sortable: true,
    render: (_value, row) =>
      new Date(row.tanggal).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
  },
  {
    key: 'status_lunas',
    header: 'Status Lunas',
    sortable: true,
    render: (_value, row) => (
      <span
        style={{
          display: 'inline-block',
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.8125rem',
          fontWeight: 600,
          background:
            row.status_lunas === 'Lunas'
              ? 'var(--color-success-light, #d1fae5)'
              : 'var(--color-warning-light, #fef3c7)',
          color:
            row.status_lunas === 'Lunas'
              ? 'var(--color-success, #065f46)'
              : 'var(--color-warning, #92400e)',
        }}
      >
        {row.status_lunas}
      </span>
    ),
  },
]

export default function SimpananPokokListPage() {
  return (
    <ListPageTemplate<SimpananPokok>
      title="Simpanan Pokok Wajib"
      queryKey="simpanan-pokok"
      fetcher={simpananPokokService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari nama nasabah..."
      exportFilename="simpanan-pokok"
      readonly
      emptyTitle="Belum ada simpanan pokok"
      emptyDescription="Simpanan pokok otomatis dibuat saat nasabah bergabung sebagai anggota koperasi."
      helpTitle="Simpanan Pokok Wajib"
      helpText="Data ini dikelola otomatis oleh sistem. Simpanan pokok dibuat saat nasabah mendaftar sebagai anggota koperasi dan tidak dapat diubah secara manual."
    />
  )
}
