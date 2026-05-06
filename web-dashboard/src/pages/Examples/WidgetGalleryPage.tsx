import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Columns3,
  LayoutGrid,
  Link2,
  Menu,
  MessagesSquare,
  Pencil,
  Sparkles,
  Shield,
  SquareStack,
} from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { ActionMenu } from '@/widgets/ActionMenu/ActionMenu'
import { AvatarGroup } from '@/widgets/Avatar/Avatar'
import { Badge, StatusBadge } from '@/widgets/Badge/Badge'
import { Breadcrumb } from '@/widgets/Breadcrumb/Breadcrumb'
import { ChartWidget } from '@/widgets/ChartWidget/ChartWidget'
import { CheckboxGroup } from '@/widgets/CheckboxGroup/CheckboxGroup'
import { CommandPalette, type CommandItem } from '@/widgets/CommandPalette/CommandPalette'
import { CopyField } from '@/widgets/CopyButton/CopyButton'
import { DataConnectionWidget } from '@/widgets/DataConnectionWidget/DataConnectionWidget'
import { DataTable, type ColumnDef } from '@/widgets/DataTable/DataTable'
import { DatePicker } from '@/widgets/DatePicker/DatePicker'
import { DateRangePicker, type DateRange } from '@/widgets/DateRangePicker/DateRangePicker'
import { Drawer } from '@/widgets/Drawer/Drawer'
import { EmptyState } from '@/widgets/EmptyState/EmptyState'
import { FileUpload, type UploadedFile } from '@/widgets/FileUpload/FileUpload'
import { FlowWidget, type FlowStep } from '@/widgets/FlowWidget/FlowWidget'
import { HierarchyTree, type HierarchyNode } from '@/widgets/HierarchyTree/HierarchyTree'
import { InlineEditField } from '@/widgets/InlineEditField/InlineEditField'
import { LoadingBar } from '@/widgets/LoadingBar/LoadingBar'
import { Modal } from '@/widgets/Modal/Modal'
import { MultiSelect, type MultiSelectOption } from '@/widgets/MultiSelect/MultiSelect'
import { NumberInput } from '@/widgets/NumberInput/NumberInput'
import { Pagination } from '@/widgets/Pagination/Pagination'
import { QuickLinkCard } from '@/widgets/QuickLinkCard/QuickLinkCard'
import { RadioGroup } from '@/widgets/RadioGroup/RadioGroup'
import { RangeInput } from '@/widgets/RangeInput/RangeInput'
import { ReportIndexCard } from '@/widgets/ReportIndexCard/ReportIndexCard'
import { SearchableSelect, type SelectOption } from '@/widgets/SearchableSelect/SearchableSelect'
import { StatusPills } from '@/widgets/StatusPills/StatusPills'
import { StatCard } from '@/widgets/StatCard/StatCard'
import { Switch } from '@/widgets/Switch/Switch'
import { Tabs, type TabItem } from '@/widgets/Tabs/Tabs'
import { TagInput } from '@/widgets/TagInput/TagInput'
import { Timeline } from '@/widgets/Timeline/Timeline'
import { Tooltip } from '@/widgets/Tooltip/Tooltip'
import { Accordion } from '@/widgets/Accordion/Accordion'
import { exampleProjects } from './exampleData'
import styles from './WidgetGalleryPage.module.css'

type SortState = { key: keyof GalleryProject; order: 'asc' | 'desc' }

interface GalleryProject {
  id: string
  code: string
  name: string
  owner: string
  status: 'Draft' | 'Active' | 'Review'
  priority: 'Low' | 'Medium' | 'High'
  updatedAt: string
}

const galleryProjects: GalleryProject[] = exampleProjects.map((project) => ({
  id: project.id,
  code: project.code,
  name: project.name,
  owner: project.owner,
  status: project.status,
  priority: project.priority,
  updatedAt: project.updatedAt,
}))

const tableColumns: ColumnDef<GalleryProject>[] = [
  { key: 'code', header: 'Code', width: 110, sortable: true },
  { key: 'name', header: 'Project', sortable: true },
  { key: 'owner', header: 'Owner', width: 170 },
  { key: 'status', header: 'Status', width: 120 },
  { key: 'priority', header: 'Priority', width: 120 },
  { key: 'updatedAt', header: 'Updated', width: 140, sortable: true },
]

const sampleTabs: TabItem[] = [
  { key: 'overview', label: 'Overview', icon: <BookOpen size={14} /> },
  { key: 'input', label: 'Inputs', icon: <Pencil size={14} /> },
  { key: 'data', label: 'Data', icon: <SquareStack size={14} /> },
]

const commandSeeds: Pick<CommandItem, 'id' | 'label' | 'description' | 'group' | 'shortcut'>[] = [
  { id: 'jump-overview', label: 'Jump to overview', description: 'Move to the top summary section', group: 'Navigation', shortcut: ['G', 'O'] },
  { id: 'jump-inputs', label: 'Jump to inputs', description: 'Open the input controls section', group: 'Navigation', shortcut: ['G', 'I'] },
  { id: 'open-drawer', label: 'Open details drawer', description: 'Inspect the side panel demo', group: 'Panels', shortcut: ['D'] },
  { id: 'open-modal', label: 'Open sample modal', description: 'Show the modal overlay demo', group: 'Panels', shortcut: ['M'] },
]

const selectOptions: SelectOption[] = [
  { value: 'maya', label: 'Maya Santoso', meta: 'Product lead' },
  { value: 'rafi', label: 'Rafi Pradana', meta: 'Operations' },
  { value: 'nadia', label: 'Nadia Putri', meta: 'Data' },
]

const multiOptions: MultiSelectOption[] = [
  { value: 'design', label: 'Design' },
  { value: 'ops', label: 'Ops' },
  { value: 'api', label: 'API' },
  { value: 'ux', label: 'UX' },
]

const treeNodes: HierarchyNode[] = [
  {
    id: 'root',
    label: 'Root',
    children: [
      {
        id: 'team-a',
        label: 'Team A',
        children: [
          { id: 'team-a-1', label: 'Project Alpha' },
          { id: 'team-a-2', label: 'Project Beta' },
        ],
      },
      {
        id: 'team-b',
        label: 'Team B',
        children: [
          { id: 'team-b-1', label: 'Project Gamma' },
        ],
      },
    ],
  },
]

const chartData = [
  { name: 'Mon', value: 12, open: 6, closed: 6 },
  { name: 'Tue', value: 18, open: 9, closed: 9 },
  { name: 'Wed', value: 14, open: 5, closed: 9 },
  { name: 'Thu', value: 24, open: 12, closed: 12 },
  { name: 'Fri', value: 22, open: 10, closed: 12 },
]

const flowSteps: FlowStep[] = [
  { id: 'queued', label: 'Queued', count: 18, href: '/examples', description: 'Waiting for the next operator handoff.' },
  { id: 'review', label: 'Review', count: 7, urgent: true, urgentCount: 2, description: 'Needs an explicit decision.' },
  { id: 'done', label: 'Done', count: 42, description: 'Finished items that no longer need attention.' },
]

function sortProjects(rows: GalleryProject[], sort?: SortState): GalleryProject[] {
  const copy = [...rows]
  if (!sort) return copy
  copy.sort((a, b) => {
    const aVal = String(a[sort.key])
    const bVal = String(b[sort.key])
    const cmp = aVal.localeCompare(bVal)
    return sort.order === 'asc' ? cmp : -cmp
  })
  return copy
}

export default function WidgetGalleryPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [checkboxes, setCheckboxes] = useState(['design'])
  const [radio, setRadio] = useState('standard')
  const [enabled, setEnabled] = useState(true)
  const [quantity, setQuantity] = useState<number | ''>(14)
  const [range, setRange] = useState<[number, number]>([20, 80])
  const [selectedOwner, setSelectedOwner] = useState('maya')
  const [selectedOwnerLabel, setSelectedOwnerLabel] = useState('Maya Santoso')
  const [picked, setPicked] = useState<string[]>(['design', 'ux'])
  const [tags, setTags] = useState(['shared', 'gallery'])
  const [dueDate, setDueDate] = useState('2026-05-04')
  const [period, setPeriod] = useState<DateRange>({ start: '2026-05-01', end: '2026-05-10' })
  const [projectTitle, setProjectTitle] = useState('Widget gallery showcase')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    { file: new File(['demo'], 'widget-gallery.pdf', { type: 'application/pdf' }) },
  ])
  const [tableSort, setTableSort] = useState<SortState | undefined>({ key: 'updatedAt', order: 'desc' })
  const [tablePageSize, setTablePageSize] = useState(2)
  const [tablePage, setTablePage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState('Belum ada pilihan')
  const [flowStepLabel, setFlowStepLabel] = useState('Queued')

  const pageSize = tablePageSize
  const sortedProjects = useMemo(() => sortProjects(galleryProjects, tableSort), [tableSort])
  const pagedProjects = useMemo(
    () => sortedProjects.slice(tablePage * pageSize, tablePage * pageSize + pageSize),
    [sortedProjects, tablePage],
  )
  const activeFlowStep = flowSteps.find((step) => step.label === flowStepLabel) ?? flowSteps[0]

  const commands: CommandItem[] = useMemo(
    () => commandSeeds.map((cmd) => ({
      ...cmd,
      icon: cmd.id.includes('drawer') ? <Columns3 size={14} /> : cmd.id.includes('modal') ? <Menu size={14} /> : <Sparkles size={14} />,
      action: () => {
        if (cmd.id === 'jump-overview') document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })
        if (cmd.id === 'jump-inputs') document.getElementById('inputs')?.scrollIntoView({ behavior: 'smooth' })
        if (cmd.id === 'open-drawer') setDrawerOpen(true)
        if (cmd.id === 'open-modal') setModalOpen(true)
      },
    })),
    [],
  )

  const headerActions = (
    <ActionMenu
      items={[
        { key: 'nav', label: 'Jump to inputs', icon: <LayoutGrid size={14} />, onClick: () => document.getElementById('inputs')?.scrollIntoView({ behavior: 'smooth' }) },
        { key: 'palette', label: 'Open command palette', icon: <Menu size={14} />, onClick: () => setPaletteOpen(true) },
        { key: 'drawer', label: 'Open drawer', icon: <Columns3 size={14} />, onClick: () => setDrawerOpen(true) },
        { key: 'modal', label: 'Open modal', icon: <MessagesSquare size={14} />, onClick: () => setModalOpen(true) },
      ]}
    />
  )

  return (
    <div className={styles.page}>
      <LoadingBar isLoading={loading} />

      <PageHeader
        title="Widget Gallery"
        subtitle="Single-page reference for the dashboard widgets used in this boilerplate."
        breadcrumbs={[
          { label: 'Examples', href: '/examples' },
          { label: 'Widgets' },
        ]}
        actions={headerActions}
      />

      <div className={styles.layout}>
        <aside className={styles.nav} aria-label="Widget sections">
          <a href="#overview">Overview</a>
          <a href="#navigation">Navigation</a>
          <a href="#inputs">Inputs</a>
          <a href="#data">Data</a>
          <a href="#overlays">Overlays</a>
          <a href="#charts">Charts</a>
        </aside>

        <main className={styles.main}>
          <Breadcrumb items={[{ label: 'Examples', href: '/examples' }, { label: 'Widgets' }]} />

          <section id="overview" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Overview</h2>
              <p>Core summary widgets and quick links.</p>
            </div>
            <div className={styles.statGrid}>
              <StatCard title="Requests" value={1284} trend={12.4} trendDirection="up" color="primary" icon={<CheckCircle2 size={16} />} sparkline={[10, 12, 13, 12, 18, 20, 21]} />
              <StatCard title="Resolution rate" value={92} format="percent" trend={4.2} trendDirection="up" color="secondary" icon={<Shield size={16} />} sparkline={[81, 84, 87, 89, 90, 92, 92]} />
              <StatCard title="Active projects" value={42} trend={6.1} trendDirection="up" color="accent" icon={<Sparkles size={16} />} sparkline={[28, 30, 33, 35, 38, 40, 42]} />
            </div>

            <div className={styles.row}>
              <AvatarGroup
                items={[
                  { name: 'Maya Santoso' },
                  { name: 'Rafi Pradana' },
                  { name: 'Nadia Putri' },
                  { name: 'Dimas Wicaksono' },
                ]}
                size="md"
              />
              <div className={styles.badgeRow}>
                <Badge variant="primary" dot>Primary</Badge>
                <Badge variant="success">Ready</Badge>
                <StatusBadge status="Readonly" map={{ Readonly: 'warning' }} />
                <StatusPills readonly managedByHQ />
              </div>
              <CopyField value="examples/widgets" label="Route" />
            </div>

            <div className={styles.linkGrid}>
              <QuickLinkCard href="/examples" icon={<BookOpen size={18} />} iconBg="var(--color-primary-light)" iconColor="var(--color-primary)" label="Examples list" desc="Return to the example pages." />
              <ReportIndexCard to="/examples/widgets" icon={<LayoutGrid size={18} />} iconColor="var(--color-primary)" iconBg="var(--color-primary-light)" title="Widget gallery" description="This page." />
            </div>
          </section>

          <section id="navigation" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Navigation</h2>
              <p>Components used to move around the app and switch local views.</p>
            </div>
            <div className={styles.panelGrid}>
              <div className={styles.panel}>
                <Breadcrumb items={[{ label: 'Examples', href: '/examples' }, { label: 'Widget Gallery' }]} />
                <Tabs items={sampleTabs} activeKey={activeTab} onChange={setActiveTab} />
                <div className={styles.tabBody}>
                  {activeTab === 'overview' && <p>Overview tab content.</p>}
                  {activeTab === 'input' && <p>Inputs tab content.</p>}
                  {activeTab === 'data' && <p>Data tab content.</p>}
                </div>
              </div>
              <div className={styles.panel}>
                <div className={styles.inlineActions}>
                  <Tooltip content="Open the drawer panel" placement="right">
                    <button type="button" className={styles.primaryBtn} onClick={() => setDrawerOpen(true)}>Open drawer</button>
                  </Tooltip>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setPaletteOpen(true)}>Open palette</button>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setModalOpen(true)}>Open modal</button>
                </div>
                <Accordion
                  multiple
                  defaultOpenKeys={['quick']}
                  items={[
                    { key: 'quick', label: 'Quick links', content: <div className={styles.miniLinks}><QuickLinkCard href="/examples" icon={<BookOpen size={16} />} iconBg="var(--color-primary-light)" iconColor="var(--color-primary)" label="Examples" desc="Back to the examples hub." /></div> },
                    { key: 'menu', label: 'Action menu', content: <ActionMenu items={[{ key: 'open', label: 'Open drawer', icon: <Columns3 size={14} />, onClick: () => setDrawerOpen(true) }, { key: 'copy', label: 'Copy route', icon: <Link2 size={14} />, onClick: async () => navigator.clipboard.writeText('/examples/widgets') }]} /> },
                  ]}
                />
              </div>
            </div>
          </section>

          <section id="inputs" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Inputs</h2>
              <p>Shared controls used across forms and filters.</p>
            </div>
            <div className={styles.formGrid}>
              <CheckboxGroup
                label="Checklist"
                selectAll
                options={[
                  { value: 'design', label: 'Design' },
                  { value: 'api', label: 'API' },
                  { value: 'ux', label: 'UX' },
                ]}
                value={checkboxes}
                onChange={setCheckboxes}
              />
              <RadioGroup
                name="delivery"
                label="Delivery mode"
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'fast', label: 'Fast track' },
                  { value: 'review', label: 'Review first' },
                ]}
                value={radio}
                onChange={setRadio}
                variant="card"
              />
              <Switch label="Auto approve" description="Turn this on for the demo state." checked={enabled} onChange={setEnabled} />
              <NumberInput label="Quantity" value={quantity} onChange={setQuantity} min={0} max={100} suffix="items" />
              <RangeInput label="Coverage" value={range} onChange={setRange} min={0} max={100} />
              <SearchableSelect
                value={selectedOwner}
                displayLabel={selectedOwnerLabel}
                fetchOptions={async (search) => selectOptions.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))}
                onSelect={(opt) => {
                  if (!opt) return
                  setSelectedOwner(opt.value)
                  setSelectedOwnerLabel(opt.label)
                }}
              />
              <MultiSelect options={multiOptions} value={picked} onChange={setPicked} label="Multi select" />
              <TagInput value={tags} onChange={setTags} label="Tags" />
              <DatePicker value={dueDate} onChange={setDueDate} />
              <DateRangePicker value={period} onChange={setPeriod} />
              <InlineEditField value={projectTitle} onSave={setProjectTitle} label="Inline edit" />
              <FileUpload
                label="Upload attachment"
                hint="Demo file uploader."
                multiple
                value={uploadedFiles}
                onChange={setUploadedFiles}
                accept="application/pdf,image/png,image/jpeg"
              />
            </div>
          </section>

          <section id="data" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Data</h2>
              <p>Tables, hierarchy views, connection cards, timelines, and empty states.</p>
            </div>
            <div className={styles.dataStack}>
              <DataTable<GalleryProject>
                columns={tableColumns}
                data={pagedProjects}
                rowKey="id"
                pagination={{ page: tablePage, pageSize, total: sortedProjects.length }}
                onPageChange={setTablePage}
                onPageSizeChange={(size) => {
                  setTablePageSize(size)
                  setTablePage(0)
                }}
                sort={tableSort ? { key: tableSort.key, order: tableSort.order } : undefined}
                onSortChange={(next) => {
                  setTableSort(next as SortState | undefined)
                  setTablePage(0)
                }}
                exportFilename="widget-gallery"
                emptyTitle="No projects"
                emptyDescription="Demo table content would show here."
              />
              <Pagination
                page={tablePage + 1}
                pageSize={pageSize}
                total={sortedProjects.length}
                onPageChange={(p) => setTablePage(p - 1)}
                onPageSizeChange={(size) => {
                  setTablePageSize(size)
                  setTablePage(0)
                }}
              />
              <DataConnectionWidget
                title="Connections"
                items={[
                  { icon: <Link2 size={16} />, title: 'Example projects', subtitle: 'Open the list page', path: '/examples' },
                  { icon: <Link2 size={16} />, title: 'Widget gallery', subtitle: 'Stay on this page', path: '/examples/widgets' },
                ]}
              />
              <div className={styles.panelGrid}>
                <div className={styles.panel}>
                  <Timeline
                    events={[
                      { id: '1', title: 'Created', timestamp: '2026-05-01', description: 'The item was added to the queue.', actor: 'Maya' },
                      { id: '2', title: 'Reviewed', timestamp: '2026-05-02', variant: 'success', description: 'A reviewer confirmed the data.', actor: 'Rafi' },
                      { id: '3', title: 'Published', timestamp: '2026-05-03', variant: 'info', description: 'The widget entry is now visible.', actor: 'Nadia' },
                    ]}
                  />
                </div>
                <div className={styles.panel}>
                  <HierarchyTree
                    nodes={treeNodes}
                    onNodeClick={(node) => setSelectedNode(node.label)}
                    emptyMessage="No hierarchy items"
                  />
                  <p className={styles.helperText}>Selected: {selectedNode}</p>
                </div>
              </div>
              <FlowWidget
                title="Flow"
                subtitle="A quick status flow demo."
                icon={<ArrowRight size={16} />}
                accentColor="var(--color-primary)"
                steps={flowSteps}
      onInfoClick={(step) => {
        setFlowStepLabel(step.label)
        setModalOpen(true)
      }}
      />
              <Accordion
                multiple
                defaultOpenKeys={['table']}
                items={[
                  { key: 'table', label: 'Table notes', content: <p>This panel explains that the table above is rendered with the shared DataTable widget.</p> },
                  { key: 'empty', label: 'Empty state', content: <EmptyState title="Nothing selected" description="The gallery keeps its empty state available here for reference." action={<button type="button" className={styles.secondaryBtn}>Create item</button>} /> },
                ]}
              />
            </div>
          </section>

          <section id="overlays" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Overlays</h2>
              <p>Panels and global interaction layers.</p>
            </div>
            <div className={styles.inlineActions}>
              <button type="button" className={styles.primaryBtn} onClick={() => setDrawerOpen(true)}>Open drawer</button>
              <button type="button" className={styles.primaryBtn} onClick={() => setModalOpen(true)}>Open modal</button>
              <button type="button" className={styles.secondaryBtn} onClick={() => setPaletteOpen(true)}>Open command palette</button>
              <button type="button" className={styles.secondaryBtn} onClick={() => setLoading((v) => !v)}>{loading ? 'Stop loading bar' : 'Start loading bar'}</button>
            </div>
          </section>

          <section id="charts" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Charts</h2>
              <p>Reusable chart widget with multiple render modes.</p>
            </div>
            <div className={styles.chartGrid}>
              <ChartWidget
                title="Weekly volume"
                subtitle="Bar chart"
                config={{
                  type: 'bar',
                  data: chartData,
                  series: [{ key: 'value', name: 'Volume', gradient: true }],
                  height: 220,
                }}
              />
              <ChartWidget
                title="Open vs closed"
                subtitle="Composed chart"
                config={{
                  type: 'composed',
                  data: chartData,
                  series: [
                    { key: 'open', name: 'Open', as: 'line', color: '#2563EB' },
                    { key: 'closed', name: 'Closed', as: 'bar', color: '#26B8B0' },
                  ],
                  height: 220,
                }}
              />
            </div>
          </section>
        </main>
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Widget drawer"
        footer={<button type="button" className={styles.primaryBtn} onClick={() => setDrawerOpen(false)}>Close</button>}
      >
        <div className={styles.drawerBody}>
          <p>This drawer shows a secondary panel state.</p>
          <CopyField value="/examples/widgets" label="Current route" />
        </div>
      </Drawer>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Widget modal"
        footer={<button type="button" className={styles.primaryBtn} onClick={() => setModalOpen(false)}>Close</button>}
      >
        <p className={styles.modalText}>
          {flowStepLabel === 'Queued'
            ? 'Modal demo for the gallery.'
            : `Flow step: ${activeFlowStep.label} — ${activeFlowStep.description ?? 'No description available.'}`}
        </p>
      </Modal>

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
    </div>
  )
}
