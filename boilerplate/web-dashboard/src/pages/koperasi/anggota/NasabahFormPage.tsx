// src/pages/koperasi/anggota/NasabahFormPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { toast } from '@/widgets/Toast/Toast'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { JenisKelamin, NasabahStatus } from '@/types/koperasi/anggota.types'
import styles from './NasabahFormPage.module.css'

interface FormState {
  nama: string
  nik: string
  no_hp: string
  alamat: string
  foto: string
  tanggal_lahir: string
  jenis_kelamin: JenisKelamin
  status: NasabahStatus
}

const EMPTY_FORM: FormState = {
  nama: '',
  nik: '',
  no_hp: '',
  alamat: '',
  foto: '',
  tanggal_lahir: '',
  jenis_kelamin: 'Laki-laki',
  status: 'Aktif',
}

export default function NasabahFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery({
    queryKey: ['nasabah', id],
    queryFn: () => nasabahService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        nama: existing.nama,
        nik: existing.nik,
        no_hp: existing.no_hp,
        alamat: existing.alamat,
        foto: existing.foto ?? '',
        tanggal_lahir: existing.tanggal_lahir,
        jenis_kelamin: existing.jenis_kelamin,
        status: existing.status,
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
        await nasabahService.update(id!, form)
        await queryClient.invalidateQueries({ queryKey: ['nasabah', id] })
        toast.success('Data nasabah berhasil diperbarui.')
        navigate(`/koperasi/anggota/nasabah/${id}`)
      } else {
        const created = await nasabahService.create(form)
        await queryClient.invalidateQueries({ queryKey: ['nasabah'] })
        toast.success('Nasabah baru berhasil ditambahkan.')
        navigate(`/koperasi/anggota/nasabah/${created.id}`)
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
        <label className={styles.label} htmlFor="nama">
          Nama Lengkap <span className={styles.required}>*</span>
        </label>
        <input
          id="nama"
          className={styles.input}
          type="text"
          value={form.nama}
          onChange={(e) => handleChange('nama', e.target.value)}
          required
          placeholder="Masukkan nama lengkap"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="nik">
          NIK <span className={styles.required}>*</span>
        </label>
        <input
          id="nik"
          className={styles.input}
          type="text"
          value={form.nik}
          onChange={(e) => handleChange('nik', e.target.value)}
          required
          maxLength={16}
          placeholder="16 digit NIK"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="no_hp">
          No. HP <span className={styles.required}>*</span>
        </label>
        <input
          id="no_hp"
          className={styles.input}
          type="tel"
          value={form.no_hp}
          onChange={(e) => handleChange('no_hp', e.target.value)}
          required
          placeholder="Contoh: 08123456789"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tanggal_lahir">
          Tanggal Lahir <span className={styles.required}>*</span>
        </label>
        <input
          id="tanggal_lahir"
          className={styles.input}
          type="date"
          value={form.tanggal_lahir}
          onChange={(e) => handleChange('tanggal_lahir', e.target.value)}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="jenis_kelamin">
          Jenis Kelamin <span className={styles.required}>*</span>
        </label>
        <select
          id="jenis_kelamin"
          className={styles.select}
          value={form.jenis_kelamin}
          onChange={(e) => handleChange('jenis_kelamin', e.target.value as JenisKelamin)}
          required
        >
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="status">
          Status <span className={styles.required}>*</span>
        </label>
        <select
          id="status"
          className={styles.select}
          value={form.status}
          onChange={(e) => handleChange('status', e.target.value as NasabahStatus)}
          required
        >
          <option value="Aktif">Aktif</option>
          <option value="Non-Aktif">Non-Aktif</option>
        </select>
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label} htmlFor="alamat">
          Alamat <span className={styles.required}>*</span>
        </label>
        <textarea
          id="alamat"
          className={styles.textarea}
          value={form.alamat}
          onChange={(e) => handleChange('alamat', e.target.value)}
          required
          rows={3}
          placeholder="Alamat lengkap nasabah"
        />
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label} htmlFor="foto">
          URL Foto
        </label>
        <input
          id="foto"
          className={styles.input}
          type="url"
          value={form.foto}
          onChange={(e) => handleChange('foto', e.target.value)}
          placeholder="https://... (opsional)"
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? `Edit Nasabah: ${existing?.nama ?? '...'}` : 'Tambah Nasabah'}
      onBack={() => navigate(isEdit ? `/koperasi/anggota/nasabah/${id}` : '/koperasi/anggota/nasabah')}
      backLabel={isEdit ? 'Detail Nasabah' : 'Daftar Nasabah'}
      tabs={[{ id: 'form', label: 'Data Nasabah', content: formContent }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate(isEdit ? `/koperasi/anggota/nasabah/${id}` : '/koperasi/anggota/nasabah')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Simpan Perubahan' : 'Tambah Nasabah'}
      serverError={serverError}
    />
  )
}
