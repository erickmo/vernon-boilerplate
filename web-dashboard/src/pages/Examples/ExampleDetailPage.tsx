import { useNavigate, useParams } from 'react-router-dom'
import { FileText, Pencil } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { getExampleProject } from './exampleData'
import styles from './ExamplesPage.module.css'

export default function ExampleDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const project = getExampleProject(id)

  return (
    <DetailPageTemplate
      title={project.name}
      code={project.code}
      icon={<FileText size={24} />}
      onBack={() => navigate('/examples')}
      actions={[
        {
          label: 'Edit',
          icon: <Pencil size={14} />,
          variant: 'primary',
          onClick: () => navigate('/examples/new'),
        },
      ]}
      helpTitle="DetailPageTemplate example"
      helpText="This page demonstrates breadcrumbs, title metadata, action buttons, section navigation, submenu tabs, progress, and responsive two-column layout."
      progress={{
        currentStatus: project.status,
        steps: [
          { id: 'Draft', label: 'Draft', status: 'complete' },
          { id: 'Review', label: 'Review', status: project.status === 'Draft' ? 'pending' : 'complete' },
          { id: 'Active', label: 'Active', status: project.status === 'Active' ? 'complete' : 'pending' },
        ],
      }}
      sections={[
        {
          id: 'overview',
          label: 'Overview',
          icon: <FileText size={14} />,
          tabs: [
            {
              id: 'summary',
              label: 'Summary',
              icon: <FileText size={14} />,
              content: (
                <section className={styles.detailPanel}>
                  <h2>Summary</h2>
                  <dl>
                    <div><dt>Owner</dt><dd>{project.owner}</dd></div>
                    <div><dt>Status</dt><dd>{project.status}</dd></div>
                    <div><dt>Priority</dt><dd>{project.priority}</dd></div>
                    <div><dt>Updated</dt><dd>{project.updatedAt}</dd></div>
                  </dl>
                </section>
              ),
            },
            {
              id: 'activity',
              label: 'Activity',
              content: (
                <section className={styles.detailPanel}>
                  <h2>Activity</h2>
                  <p>Example activity shows how the submenu tab content inherits the right-hand card surface.</p>
                </section>
              ),
            },
          ],
        },
        {
          id: 'notes',
          label: 'Notes',
          icon: <Pencil size={14} />,
          tabs: [
            {
              id: 'checklist',
              label: 'Checklist',
              content: (
                <section className={styles.detailPanel}>
                  <h2>Checklist</h2>
                  <p>This section can hold a different submenu group under the same detail shell.</p>
                </section>
              ),
            },
            {
              id: 'links',
              label: 'Links',
              content: (
                <section className={styles.detailPanel}>
                  <h2>Links</h2>
                  <p>Additional submenu tabs live here when the sidebar menu changes.</p>
                </section>
              ),
            },
          ],
        },
      ]}
    />
  )
}
