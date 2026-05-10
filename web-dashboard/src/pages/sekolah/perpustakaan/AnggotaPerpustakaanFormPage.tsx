// src/pages/sekolah/perpustakaan/AnggotaPerpustakaanFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { anggotaPerpustakaanService } from '@/services/sekolah/perpustakaan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { AnggotaPerpustakaan } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuFormPage.module.css'

interface FormData {
  siswa_id: string
  siswa_nama: string
  tanggal_daftar: string
  status: 'Aktif' | 'Tidak Aktif'
}

const EMPTY: FormData = { siswa_id: '', siswa_nama: '', tanggal_daftar: '', status: 'Aktif' }

function AnggotaFormFields({ form, onChange }: { form: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="siswa_nama">Nama Siswa <span className={styles.required}>*</span></label>
        {/* In production: replace with a searchable select component linked to siswaService.list */}
        <input
          id="siswa_nama"
          className={styles.input}
          value={form.siswa_nama}
          onChange={(e) => onChange('siswa_nama', e.target.value)}
          required
          placeholder="Cari nama siswa..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tanggal_daftar">Tanggal Daftar <span className={styles.required}>*</span></label>
        <input
          id="tanggal_daftar"
          className={styles.input}
          type="date"
          value={form.tanggal_daftar}
          onChange={(e) => onChange('tanggal_daftar', e.target.value)}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="status">Status</label>
        <select id="status" className={styles.select} value={form.status} onChange={(e) => onChange('status', e.target.value)}>
          <option value="Aktif">Aktif</option>
          <option value="Tidak Aktif">Tidak Aktif</option>
        </select>
      </div>
    </div>
  )
}

export function AnggotaPerpustakaanFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: anggota } = useQuery({
    queryKey: ['anggota-perpustakaan', id],
    queryFn: () => anggotaPerpustakaanService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (anggota) {
      setForm({
        siswa_id: anggota.siswa_id,
        siswa_nama: anggota.siswa_nama,
        tanggal_daftar: anggota.tanggal_daftar,
        status: anggota.status,
      })
    }
  }, [anggota])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await anggotaPerpustakaanService.update(id!, form as Partial<AnggotaPerpustakaan>)
        await queryClient.invalidateQueries({ queryKey: ['anggota-perpustakaan'] })
        toast.success('Data anggota berhasil diperbarui')
      } else {
        await anggotaPerpustakaanService.create(form as Partial<AnggotaPerpustakaan>)
        await queryClient.invalidateQueries({ queryKey: ['anggota-perpustakaan'] })
        toast.success('Anggota berhasil didaftarkan')
      }
      navigate('/sekolah/perpustakaan/anggota')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan data anggota')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Anggota' : 'Daftarkan Anggota'}
      onBack={() => navigate('/sekolah/perpustakaan/anggota')}
      backLabel="Anggota Perpustakaan"
      tabs={[{
        id: 'form',
        label: 'Data Anggota',
        content: <AnggotaFormFields form={form} onChange={(k, v) => setForm((p) => ({ ...p, [k]: v }))} />,
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/perpustakaan/anggota')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Daftarkan'}
      serverError={serverError}
    />
  )
}

export default AnggotaPerpustakaanFormPage
