import { useNavigate } from 'react-router-dom'
import { FileText, Save } from 'lucide-react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import styles from './ExamplesPage.module.css'

export default function ExampleFormPage() {
  const navigate = useNavigate()

  return (
    <FormPageTemplate
      title="New Example Project"
      code="FORM-EXAMPLE"
      icon={<FileText size={24} />}
      onBack={() => navigate('/examples')}
      onCancel={() => navigate('/examples')}
      onSubmit={(event) => {
        event.preventDefault()
        navigate('/examples/ex-001')
      }}
      submitLabel="Save example"
      helpTitle="FormPageTemplate example"
      helpText="This form demonstrates responsive field grids, tabbed sections, submit actions, and the shared header treatment."
      extraActions={[
        {
          label: 'Save draft',
          icon: <Save size={14} />,
          onClick: () => navigate('/examples'),
        },
      ]}
      tabs={[
        {
          id: 'basic',
          label: 'Basic info',
          content: (
            <div className={styles.formGrid}>
              <label>
                <span>Project name</span>
                <input placeholder="Customer onboarding refresh" />
              </label>
              <label>
                <span>Owner</span>
                <input placeholder="Maya Santoso" />
              </label>
              <label>
                <span>Status</span>
                <select defaultValue="Draft">
                  <option>Draft</option>
                  <option>Review</option>
                  <option>Active</option>
                </select>
              </label>
              <label>
                <span>Priority</span>
                <select defaultValue="Medium">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
            </div>
          ),
        },
        {
          id: 'notes',
          label: 'Notes',
          content: (
            <label className={styles.notesField}>
              <span>Implementation notes</span>
              <textarea placeholder="Add context for the team..." rows={6} />
            </label>
          ),
        },
      ]}
    />
  )
}
