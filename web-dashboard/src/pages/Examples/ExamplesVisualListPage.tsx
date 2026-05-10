import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { HierarchyTree, type HierarchyNode } from '@/widgets/HierarchyTree/HierarchyTree'
import { exampleProjects } from './exampleData'
import styles from './ExamplesVisualListPage.module.css'

type ViewMode = 'tree' | 'kanban' | 'card-tree' | 'mindmap'

interface VisualProject {
  id: string
  code: string
  name: string
  owner: string
  team: string
  status: 'Draft' | 'Review' | 'Active'
  priority: 'Low' | 'Medium' | 'High'
  updatedAt: string
  summary: string
}

interface VisualNode extends HierarchyNode {
  kind: 'group' | 'project'
  projectId?: string
  team?: string
  status?: VisualProject['status']
  priority?: VisualProject['priority']
  summary?: string
}

const VIEW_MODES: { value: ViewMode; label: string; description: string }[] = [
  { value: 'tree', label: 'Tree', description: 'Nested teams and projects' },
  { value: 'kanban', label: 'Kanban', description: 'Status-based columns' },
  { value: 'card-tree', label: 'Card Tree', description: 'Stacked cards by team' },
  { value: 'mindmap', label: 'Mindmap', description: 'Radial overview of the same data' },
]

const VISUAL_PROJECTS: VisualProject[] = [
  {
    ...exampleProjects[0],
    team: 'Platform',
    summary: 'Refine the onboarding surface and preserve completion rates.',
  },
  {
    ...exampleProjects[1],
    team: 'Operations',
    summary: 'Reduce audit noise while keeping the traceability trail intact.',
  },
  {
    ...exampleProjects[2],
    team: 'Fulfillment',
    summary: 'Validate inventory sync behavior before wider rollout.',
  },
  {
    id: 'ex-004',
    code: 'EX-004',
    name: 'Billing reconciliation lane',
    owner: 'Ari Wibowo',
    team: 'Finance',
    status: 'Review',
    priority: 'High',
    updatedAt: '2026-05-02',
    summary: 'Track reconciliation exceptions and route them to finance ops.',
  },
  {
    id: 'ex-005',
    code: 'EX-005',
    name: 'Support triage mindflow',
    owner: 'Nadia Putri',
    team: 'Support',
    status: 'Draft',
    priority: 'Medium',
    updatedAt: '2026-04-30',
    summary: 'Cluster common support topics into a navigable information map.',
  },
  {
    id: 'ex-006',
    code: 'EX-006',
    name: 'Launch readiness scorecard',
    owner: 'Maya Santoso',
    team: 'Platform',
    status: 'Active',
    priority: 'High',
    updatedAt: '2026-05-03',
    summary: 'Give the launch team a single place to read readiness signals.',
  },
]

function normalize(text: string) {
  return text.toLowerCase()
}

function buildTreeNodes(items: VisualProject[]): VisualNode[] {
  const grouped = new Map<string, VisualProject[]>()
  for (const item of items) {
    const list = grouped.get(item.team) ?? []
    list.push(item)
    grouped.set(item.team, list)
  }

  return Array.from(grouped.entries()).map(([team, projects]) => ({
    id: `team:${team}`,
    label: team,
    kind: 'group',
    team,
    children: projects.map((project) => ({
      id: project.id,
      label: project.name,
      kind: 'project',
      projectId: project.id,
      team: project.team,
      status: project.status,
      priority: project.priority,
      summary: project.summary,
    })),
  }))
}

function priorityClass(priority: VisualProject['priority']) {
  switch (priority) {
    case 'High': return styles.priorityHigh
    case 'Medium': return styles.priorityMedium
    default: return styles.priorityLow
  }
}

function statusClass(status: VisualProject['status']) {
  switch (status) {
    case 'Active': return styles.statusActive
    case 'Review': return styles.statusReview
    default: return styles.statusDraft
  }
}

function getProjectLabel(project: VisualProject) {
  return `${project.code} · ${project.name}`
}

export default function ExamplesVisualListPage() {
  const [mode, setMode] = useState<ViewMode>('tree')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(VISUAL_PROJECTS[0]?.id ?? '')

  const filteredProjects = useMemo(() => {
    const term = normalize(search.trim())
    if (!term) return VISUAL_PROJECTS
    return VISUAL_PROJECTS.filter((project) =>
      [
        project.code,
        project.name,
        project.owner,
        project.team,
        project.status,
        project.priority,
        project.summary,
      ].some((value) => normalize(value).includes(term)),
    )
  }, [search])

  useEffect(() => {
    if (filteredProjects.length === 0) {
      setSelectedId('')
      return
    }
    if (!filteredProjects.some((project) => project.id === selectedId)) {
      setSelectedId(filteredProjects[0].id)
    }
  }, [filteredProjects, selectedId])

  const selectedProject = filteredProjects.find((project) => project.id === selectedId) ?? filteredProjects[0] ?? null

  const counts = useMemo(() => ({
    total: filteredProjects.length,
    draft: filteredProjects.filter((project) => project.status === 'Draft').length,
    review: filteredProjects.filter((project) => project.status === 'Review').length,
    active: filteredProjects.filter((project) => project.status === 'Active').length,
  }), [filteredProjects])

  const treeNodes = useMemo(() => buildTreeNodes(filteredProjects), [filteredProjects])

  const groupedByStatus = useMemo(() => ({
    Draft: filteredProjects.filter((project) => project.status === 'Draft'),
    Review: filteredProjects.filter((project) => project.status === 'Review'),
    Active: filteredProjects.filter((project) => project.status === 'Active'),
  }), [filteredProjects])

  const groupedByTeam = useMemo(() => {
    const grouped = new Map<string, VisualProject[]>()
    for (const item of filteredProjects) {
      const list = grouped.get(item.team) ?? []
      list.push(item)
      grouped.set(item.team, list)
    }
    return Array.from(grouped.entries())
  }, [filteredProjects])

  const modeInfo = VIEW_MODES.find((item) => item.value === mode) ?? VIEW_MODES[0]

  const onPickProject = (projectId?: string) => {
    if (!projectId) return
    setSelectedId(projectId)
  }

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <PageHeader
        title="List Page Template"
        subtitle="One dataset, four visual modes: Tree, Kanban, Card Tree, and Mindmap."
        breadcrumbs={[
          { label: 'Examples', href: '/examples' },
          { label: 'List views' },
        ]}
        actions={
          <Link className={styles.backLink} to="/examples">
            <ChevronRight size={14} className={styles.backLinkIcon} />
            Back to list demo
          </Link>
        }
      />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Visual showcase</span>
          <h2>Switch the same list between structural views</h2>
          <p>
            Search and selection stay shared. Only the renderer changes so the page
            can show hierarchy, workflow, card stacks, or a radial overview without
            losing context.
          </p>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Visible items</span>
            <strong>{counts.total.toLocaleString('id-ID')}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active</span>
            <strong>{counts.active.toLocaleString('id-ID')}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Review</span>
            <strong>{counts.review.toLocaleString('id-ID')}</strong>
          </div>
        </div>
      </section>

      <section className={styles.toolbar}>
        <div className={styles.modeSwitch} role="tablist" aria-label="List view mode">
          {VIEW_MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={mode === item.value}
              aria-label={item.label}
              className={`${styles.modeBtn} ${mode === item.value ? styles.modeBtnActive : ''}`}
              onClick={() => setMode(item.value)}
            >
              <span>{item.label}</span>
              <small>{item.description}</small>
            </button>
          ))}
        </div>

        <label className={styles.searchBox}>
          <Search size={16} />
          <input
            type="search"
            placeholder="Search code, owner, status, team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </section>

      <section className={styles.surface}>
        <div className={styles.surfaceHeader}>
          <div>
            <span className={styles.surfaceLabel}>Mode</span>
            <h3>{modeInfo.label}</h3>
          </div>
          <p>{modeInfo.description}</p>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.viewer}>
            {mode === 'tree' && (
              <HierarchyTree
                nodes={treeNodes}
                onNodeClick={(node) => onPickProject(node.projectId)}
                renderNode={(node) => (
                  node.kind === 'group' ? (
                    <div className={styles.treeGroupCard}>
                      <span className={styles.groupTitle}>{node.label}</span>
                      <span className={styles.groupCount}>{node.children?.length ?? 0} items</span>
                    </div>
                  ) : (
                    <div className={styles.treeProjectCard}>
                      <div className={styles.projectLine}>
                        <strong>{node.label}</strong>
                        <span className={`${styles.statusPill} ${statusClass(node.status ?? 'Draft')}`}>
                          {node.status}
                        </span>
                      </div>
                      <p>{node.summary}</p>
                    </div>
                  )
                )}
                emptyMessage="No matching projects"
                maxHeight="none"
              />
            )}

            {mode === 'kanban' && (
              <div className={styles.kanbanBoard}>
                {(['Draft', 'Review', 'Active'] as const).map((status) => (
                  <div key={status} className={styles.kanbanColumn}>
                    <div className={styles.columnHeader}>
                      <h4>{status}</h4>
                      <span>{groupedByStatus[status].length}</span>
                    </div>
                    <div className={styles.cardStack}>
                      {groupedByStatus[status].map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          className={`${styles.kanbanCard} ${selectedId === project.id ? styles.cardSelected : ''}`}
                          onClick={() => setSelectedId(project.id)}
                        >
                          <div className={styles.cardTopRow}>
                            <strong>{project.code}</strong>
                            <span className={`${styles.statusPill} ${statusClass(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          <p className={styles.cardTitle}>{project.name}</p>
                          <p className={styles.cardMeta}>{project.owner} · {project.team}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mode === 'card-tree' && (
              <div className={styles.cardTree}>
                {groupedByTeam.map(([team, projects]) => (
                  <div key={team} className={styles.cardTreeGroup}>
                    <div className={styles.cardTreeGroupHeader}>
                      <span className={styles.groupTitle}>{team}</span>
                      <span className={styles.groupCount}>{projects.length} cards</span>
                    </div>
                    <div className={styles.cardTreeBranch}>
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          className={`${styles.treeCard} ${selectedId === project.id ? styles.cardSelected : ''}`}
                          onClick={() => setSelectedId(project.id)}
                        >
                          <div className={styles.cardTopRow}>
                            <strong>{project.code}</strong>
                            <span className={`${styles.priorityPill} ${priorityClass(project.priority)}`}>
                              {project.priority}
                            </span>
                          </div>
                          <p className={styles.cardTitle}>{project.name}</p>
                          <p className={styles.cardMeta}>{project.owner}</p>
                          <p className={styles.cardSummary}>{project.summary}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mode === 'mindmap' && (
              <div className={styles.mindmap}>
                <div className={styles.mindmapCenter}>
                  <span>Projects</span>
                  <strong>{counts.total}</strong>
                </div>
                <div className={styles.mindmapBranches}>
                  {groupedByTeam.map(([team, projects], index) => (
                    <div key={team} className={`${styles.branch} ${styles[`branch${index % 4}` as const]}`}>
                      <div className={styles.branchHeader}>
                        <span>{team}</span>
                        <strong>{projects.length}</strong>
                      </div>
                      <div className={styles.branchCards}>
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            type="button"
                            className={`${styles.mindCard} ${selectedId === project.id ? styles.cardSelected : ''}`}
                            onClick={() => setSelectedId(project.id)}
                          >
                            <strong>{project.code}</strong>
                            <span>{project.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className={styles.detailPanel} aria-label="Selected project">
            {selectedProject ? (
              <>
                <span className={styles.detailLabel}>Selected item</span>
                <h4>{getProjectLabel(selectedProject)}</h4>
                <p className={styles.detailSummary}>{selectedProject.summary}</p>

                <dl className={styles.detailGrid}>
                  <div>
                    <dt>Owner</dt>
                    <dd>{selectedProject.owner}</dd>
                  </div>
                  <div>
                    <dt>Team</dt>
                    <dd>{selectedProject.team}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{selectedProject.status}</dd>
                  </div>
                  <div>
                    <dt>Priority</dt>
                    <dd>{selectedProject.priority}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{selectedProject.updatedAt}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <span className={styles.detailLabel}>Selected item</span>
                <h4>No matching results</h4>
                <p className={styles.detailSummary}>Clear the search field to bring items back.</p>
              </>
            )}

            <div className={styles.detailLinks}>
              <Link to="/examples" className={styles.detailLink}>
                Return to table demo
              </Link>
              <Link to="/examples/widgets" className={styles.detailLink}>
                Open widget gallery
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
