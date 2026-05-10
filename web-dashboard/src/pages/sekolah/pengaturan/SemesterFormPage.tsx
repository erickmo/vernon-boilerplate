// src/pages/sekolah/pengaturan/SemesterFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { semesterService, tahunAjaranService } from '@/services/sekolah/pengaturan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { SemesterTahunAjaran } from '@/types/sekolah/pengaturan.types'
import styles from './PengaturanForm.module.css'

interface FormData {
  semester: 'Ganjil' | 'Genap'
  tahun_ajaran_id: string
  status_aktif: boolean
}

const EMPTY: FormData = { semester: 'Ganjil', tahun_ajaran_id: '', status_aktif: false }

export function SemesterFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: semester } = useQuery({
    queryKey: ['semester-tahun-ajaran', id],
    queryFn: () => semesterService.getById(id!),
    enabled: isEdit,
  })

  const { data: tahunAjaranRes } = useQuery({
    queryKey: ['tahun-ajaran'],
    queryFn: () => tahunAjaranService.list({ limit: 100 }),
  })
  const tahunAjaranOptions = tahunAjaranRes?.items ?? []

  useEffect(() => {
    if (semester) {
      setForm({
        semester: semester.semester,
        tahun_ajaran_id: semester.tahun_ajaran_id,
        status_aktif: semester.status_aktif,
      })
    }
  }, [semester])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await semesterService.update(id!, form as Partial<SemesterTahunAjaran>)
        toast.success('Semester berhasil diperbarui')
      } else {
        await semesterService.create(form as Partial<SemesterTahunAjaran>)
        toast.success('Semester berhasil ditambahkan')
      }
      await queryClient.invalidateQueries({ queryKey: ['semester-tahun-ajaran'] })
      navigate('/sekolah/pengaturan/semester')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan semester')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Semester' : 'Tambah Semester'}
      onBack={() => navigate('/sekolah/pengaturan/semester')}
      backLabel="Semester"
      tabs={[{
        id: 'form',
        label: 'Data Semester',
        content: (
          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Semester <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={form.semester}
                onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value as 'Ganjil' | 'Genap' }))}
                required
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tahun Ajaran <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={form.tahun_ajaran_id}
                onChange={(e) => setForm((p) => ({ ...p, tahun_ajaran_id: e.target.value }))}
                required
              >
                <option value="">— Pilih Tahun Ajaran —</option>
                {tahunAjaranOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.periode}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Status</label>
              <label className={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={form.status_aktif}
                  onChange={(e) => setForm((p) => ({ ...p, status_aktif: e.target.checked }))}
                />
                <span className={styles.toggleLabel}>{form.status_aktif ? 'Aktif' : 'Tidak Aktif'}</span>
              </label>
            </div>
          </div>
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/pengaturan/semester')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Simpan'}
      serverError={serverError}
    />
  )
}

export default SemesterFormPage
