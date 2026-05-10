// src/pages/sekolah/pengaturan/TahunAjaranFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { tahunAjaranService } from '@/services/sekolah/pengaturan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { TahunAjaran } from '@/types/sekolah/pengaturan.types'
import styles from './PengaturanForm.module.css'

interface FormData { periode: string; status_aktif: boolean }
const EMPTY: FormData = { periode: '', status_aktif: false }

export function TahunAjaranFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: tahunAjaran } = useQuery({
    queryKey: ['tahun-ajaran', id],
    queryFn: () => tahunAjaranService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (tahunAjaran) setForm({ periode: tahunAjaran.periode, status_aktif: tahunAjaran.status_aktif })
  }, [tahunAjaran])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await tahunAjaranService.update(id!, form as Partial<TahunAjaran>)
        toast.success(`Tahun ajaran "${form.periode}" berhasil diperbarui`)
      } else {
        await tahunAjaranService.create(form as Partial<TahunAjaran>)
        toast.success(`Tahun ajaran "${form.periode}" berhasil ditambahkan`)
      }
      await queryClient.invalidateQueries({ queryKey: ['tahun-ajaran'] })
      navigate('/sekolah/pengaturan/tahun-ajaran')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan tahun ajaran')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
      onBack={() => navigate('/sekolah/pengaturan/tahun-ajaran')}
      backLabel="Tahun Ajaran"
      tabs={[{
        id: 'form',
        label: 'Data Tahun Ajaran',
        content: (
          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="periode">Periode <span className={styles.required}>*</span></label>
              <input
                id="periode"
                className={styles.input}
                value={form.periode}
                onChange={(e) => setForm((p) => ({ ...p, periode: e.target.value }))}
                required
                placeholder="Contoh: 2024/2025"
              />
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
      onCancel={() => navigate('/sekolah/pengaturan/tahun-ajaran')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Simpan'}
      serverError={serverError}
    />
  )
}

export default TahunAjaranFormPage
