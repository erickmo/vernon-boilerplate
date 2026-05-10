// src/pages/koperasi/anggota/AnggotaKoperasiListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { anggotaKoperasiService } from '@/services/koperasi/anggota-koperasi.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { AnggotaKoperasi } from '@/types/koperasi/anggota.types'

const COLUMNS: ColumnDef<AnggotaKoperasi>[] = [
  { key: 'no_anggota', header: 'No Anggota', sortable: true },
  {
    key: 'nasabah_nama',
    header: 'Nama Nasabah',
    sortable: true,
    render: (_value, row) => (
      <a
        href={`/koperasi/anggota/nasabah/${row.nasabah}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          color: 'var(--color-primary, #2563eb)',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        {row.nasabah_nama}
      </a>
    ),
  },
  {
    key: 'tanggal_bergabung',
    header: 'Tanggal Bergabung',
    sortable: true,
    render: (_value, row) =>
      new Date(row.tanggal_bergabung).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
  },
  { key: 'status', header: 'Status', sortable: true },
]

const DELETE_CONFIG = {
  onDelete: (row: AnggotaKoperasi) => anggotaKoperasiService.delete(row.id),
  dialogTitle: 'Hapus Anggota Koperasi?',
  dialogBody: (row: AnggotaKoperasi) =>
    `Data anggota koperasi "${row.nasabah_nama}" (No: ${row.no_anggota}) akan dihapus.`,
  successMessage: (row: AnggotaKoperasi) => `Anggota ${row.nasabah_nama} berhasil dihapus.`,
  errorMessage: 'Gagal menghapus anggota koperasi.',
}

export default function AnggotaKoperasiListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<AnggotaKoperasi>
      title="Anggota Koperasi"
      queryKey="anggota-koperasi"
      fetcher={anggotaKoperasiService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari nama atau no anggota..."
      addLabel="Tambah Anggota"
      onAdd={() => navigate('/koperasi/anggota/anggota-koperasi/new')}
      onRowClick={(row) => navigate(`/koperasi/anggota/anggota-koperasi/${row.id}/edit`)}
      deleteConfig={DELETE_CONFIG}
      exportFilename="anggota-koperasi"
      emptyTitle="Belum ada anggota koperasi"
      emptyDescription="Tambah anggota dengan menghubungkan nasabah ke koperasi."
    />
  )
}
