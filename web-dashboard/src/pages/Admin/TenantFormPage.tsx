import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { organisasiService, type CreateOrganisasiPayload } from '@/services/organisasi.service'
import styles from './TenantFormPage.module.css'

const JENIS_OPTIONS = ['Yayasan', 'PT', 'Koperasi', 'Lainnya']

export default function TenantFormPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<CreateOrganisasiPayload>({
    nama: '',
    jenis_organisasi: 'Yayasan',
    email: '',
    telepon: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  function set(field: keyof CreateOrganisasiPayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama.trim()) { setServerError('Nama wajib diisi'); return }
    setSubmitting(true)
    setServerError('')
    try {
      const org = await organisasiService.create(form)
      navigate(`/su/tenants/${encodeURIComponent(org.name)}`)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal membuat tenant')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title="Tambah Tenant"
      icon={<Building2 size={24} />}
      onBack={() => navigate('/su/tenants')}
      onCancel={() => navigate('/su/tenants')}
      onSubmit={(e) => { void handleSubmit(e) }}
      submitLabel="Buat Tenant"
      isSubmitting={submitting}
      serverError={serverError || undefined}
      tabs={[
        {
          id: 'info',
          label: 'Info',
          content: (
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Nama <span className={styles.req}>*</span></label>
                <input
                  className={styles.input}
                  value={form.nama}
                  onChange={(e) => set('nama', e.target.value)}
                  placeholder="Yayasan Pendidikan Maju"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Jenis Organisasi</label>
                <select className={styles.select} value={form.jenis_organisasi} onChange={(e) => set('jenis_organisasi', e.target.value)}>
                  {JENIS_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="admin@org.id"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Telepon</label>
                <input
                  className={styles.input}
                  value={form.telepon ?? ''}
                  onChange={(e) => set('telepon', e.target.value)}
                  placeholder="021-1234567"
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  )
}
