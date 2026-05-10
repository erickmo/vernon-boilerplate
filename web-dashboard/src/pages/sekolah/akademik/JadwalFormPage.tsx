// src/pages/sekolah/akademik/JadwalFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { jadwalService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type { JadwalPelajaran } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

interface FormState {
  rombel: string
  rombel_nama: string
  tahun_ajaran: string
  semester: string
}

const EMPTY_FORM: FormState = {
  rombel: '',
  rombel_nama: '',
  tahun_ajaran: '',
  semester: '',
}

const SEMESTER_OPTIONS = ['Ganjil', 'Genap']

export default function JadwalFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery<JadwalPelajaran>({
    queryKey: ['jadwal-pelajaran', id],
    queryFn: () => jadwalService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        rombel: existing.rombel,
        rombel_nama: existing.rombel_nama,
        tahun_ajaran: existing.tahun_ajaran,
        semester: existing.semester,
      })
    }
  }, [existing])

  const mutation = useMutation({
    mutationFn: (data: Partial<JadwalPelajaran>) =>
      isEdit ? jadwalService.update(id!, data) : jadwalService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jadwal-pelajaran'] })
      toast.success(isEdit ? 'Jadwal diperbarui' : 'Jadwal ditambahkan')
      navigate('/sekolah/akademik/jadwal')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan'),
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
        <label className={styles.label}>Rombongan Belajar <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="text"
          value={form.rombel}
          onChange={(e) => handleChange('rombel', e.target.value)}
          placeholder="ID Rombel"
          required
        />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Tahun Ajaran <span className={styles.required}>*</span></label>
          <input
            className={styles.input}
            type="text"
            value={form.tahun_ajaran}
            onChange={(e) => handleChange('tahun_ajaran', e.target.value)}
            placeholder="e.g. 2024/2025"
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Semester <span className={styles.required}>*</span></label>
          <select
            className={styles.select}
            value={form.semester}
            onChange={(e) => handleChange('semester', e.target.value)}
            required
          >
            <option value="">Pilih Semester</option>
            {SEMESTER_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
      onBack={() => navigate('/sekolah/akademik/jadwal')}
      onCancel={() => navigate('/sekolah/akademik/jadwal')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[{ id: 'form', label: 'Info Jadwal', content: formContent }]}
    />
  )
}
