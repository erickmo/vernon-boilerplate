import { useNavigate } from 'react-router-dom'
import { FileText, LayoutGrid, Plus } from 'lucide-react'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import { exampleProjects, fetchExampleProjects, type ExampleProject } from './exampleData'

const columns: ColumnDef<ExampleProject>[] = [
  { key: 'code', header: 'Code', width: 110, sortable: true, locked: true },
  { key: 'name', header: 'Project', sortable: true },
  { key: 'owner', header: 'Owner', width: 180 },
  { key: 'status', header: 'Status', width: 130 },
  { key: 'priority', header: 'Priority', width: 130 },
  { key: 'updatedAt', header: 'Updated', width: 140 },
]

export default function ExamplesListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<ExampleProject>
      title="Example Projects"
      addLabel="New example"
      onAdd={() => navigate('new')}
      queryKey="example-projects"
      fetcher={fetchExampleProjects}
      columns={columns}
      onRowClick={(row) => navigate(row.id)}
      searchPlaceholder="Search examples..."
      exportFilename="example-projects"
      emptyTitle="No examples"
      emptyDescription="Create an example to preview ListPageTemplate behavior."
      helpTitle="ListPageTemplate example"
      helpText="This page demonstrates the reusable list template with header actions, status pills, search, export, responsive table scrolling, and row navigation."
      readonly={false}
      actions={
        <>
          <button type="button" onClick={() => navigate('visual-list')}>
            <LayoutGrid size={16} />
            Visual list
          </button>
          <button type="button" onClick={() => navigate('widgets')}>
            <LayoutGrid size={16} />
            Widget gallery
          </button>
          <button type="button" onClick={() => navigate(exampleProjects[0].id)}>
            <FileText size={16} />
            Open sample
          </button>
        </>
      }
      filterDefs={[
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'Draft', value: 'Draft' },
            { label: 'Active', value: 'Active' },
            { label: 'Review', value: 'Review' },
          ],
        },
        {
          key: 'priority',
          label: 'Priority',
          type: 'select',
          options: [
            { label: 'Low', value: 'Low' },
            { label: 'Medium', value: 'Medium' },
            { label: 'High', value: 'High' },
          ],
        },
      ]}
      rowActions={[
        {
          key: 'open',
          label: 'Open',
          icon: <Plus size={14} />,
          onClick: (row) => navigate(row.id),
        },
      ]}
    />
  )
}
