// src/pages/koperasi/kartu/TerminalListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { terminalService } from '@/services/koperasi/kartu.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { Terminal } from '@/types/koperasi/kartu.types'

const COLUMNS: ColumnDef<Terminal>[] = [
  { key: 'terminal_id', header: 'Terminal ID', sortable: true },
  { key: 'merchant_nama', header: 'Merchant', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => (
      <span style={{ color: row.status === 'aktif' ? 'var(--color-green-600)' : 'var(--color-slate-400)', textTransform: 'capitalize' }}>
        {row.status}
      </span>
    ),
  },
  {
    key: 'api_key',
    header: 'API Key',
    render: (_v, row) => {
      const key = row.api_key ?? ''
      return (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {key.length > 8 ? `${key.slice(0, 4)}••••${key.slice(-4)}` : '••••••••'}
        </span>
      )
    },
  },
]

export function TerminalListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Terminal>
      title="Terminal"
      addLabel="Tambah Terminal"
      onAdd={() => navigate('/koperasi/kartu/terminal/new')}
      queryKey="koperasi-terminal"
      fetcher={terminalService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari terminal atau merchant..."
      onRowClick={(row) => navigate(`/koperasi/kartu/terminal/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => terminalService.delete(row.id),
        dialogTitle: 'Hapus Terminal?',
        dialogBody: (row) => `Terminal "${row.terminal_id}" akan dihapus permanen.`,
        successMessage: (row) => `Terminal "${row.terminal_id}" berhasil dihapus.`,
      }}
      exportFilename="terminal-koperasi"
    />
  )
}
