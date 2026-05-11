import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { guruService } from '@/services/sekolah/guru.service'
import { useForm } from '@/hooks/useForm'
import { toast } from '@/widgets/Toast/Toast'
import type { GuruFormValues } from '@/types/sekolah/guru.types'
import styles from './GuruFormPage.module.css'

const STATUS_OPTIONS = ['Aktif', 'Cuti', 'Nonaktif'] as const

const INITIAL_VALUES: GuruFormValues = {
  nip: '',
  nama: '',
  mata_pelajaran: '',
  status: 'Aktif',
  alamat: '',
  foto: '',
}

function validate(values: GuruFormValues): Partial<Record<keyof GuruFormValues, string>> {
  const errors: Partial<Record<keyof GuruFormValues, string>> = {}
  if (!values.nip.trim()) errors.nip = 'NIP wajib diisi.'
  if (!values.nama.trim()) errors.nama = 'Nama wajib diisi.'
  if (!values.mata_pelajaran.trim()) errors.mata_pelajaran = 'Mata pelajaran wajib diisi.'
  if (!values.status) errors.status = 'Status wajib dipilih.'
  return errors
}

export default function GuruFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string>()

  const { data: existing } = useQuery({
    queryKey: ['guru', id],
    queryFn: () => guruService.getById(id!),
    enabled: isEdit,
  })

  const form = useForm<GuruFormValues>({
    initialValues: existing
      ? {
          nip: existing.nip,
          nama: existing.nama,
          mata_pelajaran: existing.mata_pelajaran,
          status: existing.status,
          alamat: existing.alamat ?? '',
          foto: existing.foto ?? '',
        }
      : INITIAL_VALUES,
    validate,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit && id) {
        await guruService.update(id, values)
        await queryClient.invalidateQueries({ queryKey: ['guru', id] })
        toast.success('Data guru berhasil diperbarui.')
        navigate(`/sekolah/guru/${id}`)
      } else {
        const created = await guruService.create(values)
        await queryClient.invalidateQueries({ queryKey: ['sekolah-guru'] })
        toast.success('Guru baru berhasil ditambahkan.')
        navigate(`/sekolah/guru/${created.id}`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  })

  const formContent = (
    <div className={styles.formGrid}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="nip">NIP <span className={styles.required}>*</span></label>
        <input id="nip" className={styles.input} type="text" {...form.field('nip')} />
        {form.touched.nip && form.errors.nip && <span className={styles.errorMsg}>{form.errors.nip}</span>}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="nama">Nama <span className={styles.required}>*</span></label>
        <input id="nama" className={styles.input} type="text" {...form.field('nama')} />
        {form.touched.nama && form.errors.nama && <span className={styles.errorMsg}>{form.errors.nama}</span>}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="mata_pelajaran">Mata Pelajaran <span className={styles.required}>*</span></label>
        <input id="mata_pelajaran" className={styles.input} type="text" {...form.field('mata_pelajaran')} />
        {form.touched.mata_pelajaran && form.errors.mata_pelajaran && (
          <span className={styles.errorMsg}>{form.errors.mata_pelajaran}</span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="status">Status <span className={styles.required}>*</span></label>
        <select id="status" className={styles.input} {...form.field('status')}>
          <option value="">Pilih status...</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {form.touched.status && form.errors.status && <span className={styles.errorMsg}>{form.errors.status}</span>}
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label} htmlFor="alamat">Alamat</label>
        <textarea id="alamat" className={styles.textarea} rows={3} {...form.field('alamat')} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="foto">URL Foto</label>
        <input id="foto" className={styles.input} type="url" placeholder="https://..." {...form.field('foto')} />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Guru' : 'Tambah Guru'}
      onBack={() => navigate(-1)}
      onCancel={() => navigate(-1)}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      serverError={serverError}
      tabs={[{ id: 'form', label: 'Data Guru', content: formContent }]}
    />
  )
}
