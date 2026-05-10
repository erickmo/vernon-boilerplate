// src/pages/sekolah/pengaturan/SekolahSettingsPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { getSekolah, updateSekolah } from '@/services/sekolah/pengaturan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { Sekolah } from '@/types/sekolah/pengaturan.types'
import styles from './PengaturanForm.module.css'

type SekolahForm = Pick<Sekolah, 'nama' | 'npsn' | 'alamat' | 'kota' | 'provinsi' | 'telepon' | 'email' | 'website' | 'kepala_sekolah'>

const EMPTY: SekolahForm = {
  nama: '', npsn: '', alamat: '', kota: '', provinsi: '', telepon: '', email: '', website: '', kepala_sekolah: '',
}

function SekolahFormFields({ form, onChange }: { form: SekolahForm; onChange: (k: keyof SekolahForm, v: string) => void }) {
  const field = (key: keyof SekolahForm, label: string, required = false, type = 'text') => (
    <div className={styles.fieldGroup}>
      <label className={styles.label} htmlFor={key}>
        {label}{required && <span className={styles.required}> *</span>}
      </label>
      <input
        id={key}
        className={styles.input}
        type={type}
        value={form[key] ?? ''}
        onChange={(e) => onChange(key, e.target.value)}
        required={required}
      />
    </div>
  )

  return (
    <div className={styles.fields}>
      {field('nama', 'Nama Sekolah', true)}
      {field('npsn', 'NPSN', true)}
      {field('kepala_sekolah', 'Kepala Sekolah', true)}
      {field('telepon', 'Telepon', false, 'tel')}
      {field('email', 'Email', false, 'email')}
      {field('website', 'Website', false, 'url')}
      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label} htmlFor="alamat">Alamat <span className={styles.required}>*</span></label>
        <textarea
          id="alamat"
          className={styles.textarea}
          value={form.alamat}
          onChange={(e) => onChange('alamat', e.target.value)}
          rows={3}
          required
        />
      </div>
      {field('kota', 'Kota/Kabupaten')}
      {field('provinsi', 'Provinsi')}
    </div>
  )
}

export function SekolahSettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<SekolahForm>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: sekolah, isLoading } = useQuery({
    queryKey: ['sekolah-settings'],
    queryFn: getSekolah,
  })

  useEffect(() => {
    if (sekolah) {
      setForm({
        nama: sekolah.nama,
        npsn: sekolah.npsn,
        alamat: sekolah.alamat,
        kota: sekolah.kota ?? '',
        provinsi: sekolah.provinsi ?? '',
        telepon: sekolah.telepon ?? '',
        email: sekolah.email ?? '',
        website: sekolah.website ?? '',
        kepala_sekolah: sekolah.kepala_sekolah,
      })
    }
  }, [sekolah])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      await updateSekolah(form)
      await queryClient.invalidateQueries({ queryKey: ['sekolah-settings'] })
      toast.success('Data sekolah berhasil disimpan')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan data sekolah')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p>Memuat data sekolah...</p>

  return (
    <FormPageTemplate
      title="Profil Sekolah"
      onBack={() => navigate(-1)}
      backLabel="Pengaturan"
      tabs={[{
        id: 'form',
        label: 'Data Sekolah',
        content: (
          <SekolahFormFields
            form={form}
            onChange={(k, v) => setForm((p) => ({ ...p, [k]: v }))}
          />
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      isSubmitting={isSubmitting}
      submitLabel="Simpan"
      serverError={serverError}
    />
  )
}

export default SekolahSettingsPage
