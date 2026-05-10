// src/pages/koperasi/anggota/AnggotaKoperasiFormPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { toast } from '@/widgets/Toast/Toast'
import { anggotaKoperasiService } from '@/services/koperasi/anggota-koperasi.service'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import styles from './NasabahFormPage.module.css'

interface FormState {
  nasabah: string
  no_anggota: string
  tanggal_bergabung: string
}

const EMPTY_FORM: FormState = {
  nasabah: '',
  no_anggota: '',
  tanggal_bergabung: new Date().toISOString().slice(0, 10),
}

export default function AnggotaKoperasiFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery({
    queryKey: ['anggota-koperasi', id],
    queryFn: () => anggotaKoperasiService.getById(id!),
    enabled: isEdit,
  })

  const { data: nasabahList } = useQuery({
    queryKey: ['nasabah', { limit: 200 }],
    queryFn: () => nasabahService.list({ limit: 200, sort: 'nama', order: 'asc' }),
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        nasabah: existing.nasabah,
        no_anggota: existing.no_anggota,
        tanggal_bergabung: existing.tanggal_bergabung,
      })
    }
  }, [existing])

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    setIsSubmitting(true)
    try {
      if (isEdit) {
        await anggotaKoperasiService.update(id!, form)
        await queryClient.invalidateQueries({ queryKey: ['anggota-koperasi'] })
        toast.success('Data anggota berhasil diperbarui.')
        navigate('/koperasi/anggota/anggota-koperasi')
      } else {
        await anggotaKoperasiService.create(form)
        await queryClient.invalidateQueries({ queryKey: ['anggota-koperasi'] })
        toast.success('Anggota koperasi baru berhasil ditambahkan.')
        navigate('/koperasi/anggota/anggota-koperasi')
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formContent = (
    <div className={styles.formGrid}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="nasabah">
          Nasabah <span className={styles.required}>*</span>
        </label>
        <select
          id="nasabah"
          className={styles.select}
          value={form.nasabah}
          onChange={(e) => handleChange('nasabah', e.target.value)}
          required
          disabled={isEdit}
        >
          <option value="">-- Pilih Nasabah --</option>
          {nasabahList?.items.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nama} — {n.nik}
            </option>
          ))}
        </select>
        {isEdit && (
          <p className={styles.hint}>Nasabah tidak dapat diubah setelah anggota terdaftar.</p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="no_anggota">
          No. Anggota <span className={styles.required}>*</span>
        </label>
        <input
          id="no_anggota"
          className={styles.input}
          type="text"
          value={form.no_anggota}
          onChange={(e) => handleChange('no_anggota', e.target.value)}
          required
          placeholder="Contoh: KOP-2024-001"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tanggal_bergabung">
          Tanggal Bergabung <span className={styles.required}>*</span>
        </label>
        <input
          id="tanggal_bergabung"
          className={styles.input}
          type="date"
          value={form.tanggal_bergabung}
          onChange={(e) => handleChange('tanggal_bergabung', e.target.value)}
          required
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={
        isEdit
          ? `Edit Anggota: ${existing?.nasabah_nama ?? '...'}`
          : 'Tambah Anggota Koperasi'
      }
      onBack={() => navigate('/koperasi/anggota/anggota-koperasi')}
      backLabel="Anggota Koperasi"
      tabs={[{ id: 'form', label: 'Data Anggota', content: formContent }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/anggota/anggota-koperasi')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Simpan Perubahan' : 'Tambah Anggota'}
      serverError={serverError}
    />
  )
}
