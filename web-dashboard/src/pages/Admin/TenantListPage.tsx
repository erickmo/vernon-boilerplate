import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import { organisasiService, type Organisasi } from '@/services/organisasi.service'
import type { PaginatedResponse } from '@/types/api.types'
import type { ListParams } from '@/services/createEntityService'

type OrganisasiRow = Organisasi & { id: string }

async function fetchOrganisasi(params: ListParams): Promise<PaginatedResponse<OrganisasiRow>> {
  const res = await organisasiService.list(params)
  return {
    ...res,
    items: res.items.map((o) => ({ ...o, id: o.name })),
  }
}

const columns: ColumnDef<OrganisasiRow>[] = [
  { key: 'nama', header: 'Nama', sortable: true },
  { key: 'jenis_organisasi', header: 'Jenis', width: 150 },
  { key: 'email', header: 'Email', width: 220 },
  { key: 'telepon', header: 'Telepon', width: 150 },
  {
    key: 'status',
    header: 'Status',
    width: 100,
    render: (v: string) => (
      <span style={{
        display: 'inline-flex',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-xs)',
        fontWeight: 600,
        background: v === 'Aktif' ? 'var(--color-success-subtle)' : 'var(--color-surface-alt)',
        color: v === 'Aktif' ? 'var(--color-success)' : 'var(--color-text-secondary)',
      }}>
        {v}
      </span>
    ),
  },
]

export default function TenantListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<OrganisasiRow>
      title="Tenants"
      addLabel="Tambah Tenant"
      onAdd={() => navigate('/su/tenants/new')}
      queryKey="su-organisasi"
      fetcher={fetchOrganisasi}
      columns={columns}
      onRowClick={(row) => navigate(`/su/tenants/${encodeURIComponent(row.name)}`)}
      searchPlaceholder="Cari nama atau email..."
      exportFilename="tenants"
      emptyTitle="Belum ada tenant"
      emptyDescription="Mulai dengan menambahkan tenant pertama."
      helpTitle="Daftar Tenant"
      helpText="Kelola semua organisasi yang terdaftar di platform. Klik baris untuk melihat detail."
    />
  )
}
