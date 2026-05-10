// src/pages/sekolah/akademik/MataPelajaranFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { mataPelajaranService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type { MataPelajaran } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

interface FormState {
  nama: string
  kode: string
  kurikulum: string
}

const EMPTY_FORM: FormState = { nama: '', kode: '', kurikulum: '' }

export default function MataPelajaranFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery<MataPelajaran>({
    queryKey: ['mata-pelajaran', id],
    queryFn: () => mataPelajaranService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({ nama: existing.nama, kode: existing.kode, kurikulum: existing.kurikulum })
    }
  }, [existing])

  const mutation = useMutation({
    mutationFn: (data: Partial<MataPelajaran>) =>
      isEdit
        ? mataPelajaranService.update(id!, data)
        : mataPelajaranService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mata-pelajaran'] })
      toast.success(isEdit ? 'Mata pelajaran diperbarui' : 'Mata pelajaran ditambahkan')
      navigate('/sekolah/akademik/mata-pelajaran')
    },
    onError: (err) => {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate(form)
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const formContent = (
    <div className={styles.fields}>
      <div className={styles.field}>
        <label className={styles.label}>Nama Mata Pelajaran <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="text"
          value={form.nama}
          onChange={(e) => handleChange('nama', e.target.value)}
          placeholder="e.g. Matematika"
          required
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Kode <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="text"
          value={form.kode}
          onChange={(e) => handleChange('kode', e.target.value)}
          placeholder="e.g. MTK"
          required
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Kurikulum</label>
        <input
          className={styles.input}
          type="text"
          value={form.kurikulum}
          onChange={(e) => handleChange('kurikulum', e.target.value)}
          placeholder="e.g. Merdeka"
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
      onBack={() => navigate('/sekolah/akademik/mata-pelajaran')}
      onCancel={() => navigate('/sekolah/akademik/mata-pelajaran')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[{ id: 'form', label: 'Data Mata Pelajaran', content: formContent }]}
    />
  )
}
