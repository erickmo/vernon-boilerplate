// src/pages/sekolah/perpustakaan/ReservasiFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { reservasiService, bukuService, anggotaPerpustakaanService } from '@/services/sekolah/perpustakaan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { ReservasiBuku } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuFormPage.module.css'

interface FormData { buku_id: string; anggota_id: string }
const EMPTY: FormData = { buku_id: '', anggota_id: '' }

export function ReservasiFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: reservasi } = useQuery({
    queryKey: ['reservasi-buku', id],
    queryFn: () => reservasiService.getById(id!),
    enabled: isEdit,
  })

  const { data: bukuRes } = useQuery({
    queryKey: ['perpustakaan-buku'],
    queryFn: () => bukuService.list({ limit: 500 }),
  })

  const { data: anggotaRes } = useQuery({
    queryKey: ['anggota-perpustakaan'],
    queryFn: () => anggotaPerpustakaanService.list({ limit: 500 }),
  })

  const bukuOptions = bukuRes?.items ?? []
  const anggotaOptions = anggotaRes?.items ?? []

  useEffect(() => {
    if (reservasi) setForm({ buku_id: reservasi.buku_id, anggota_id: reservasi.anggota_id })
  }, [reservasi])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await reservasiService.update(id!, form as Partial<ReservasiBuku>)
        toast.success('Reservasi berhasil diperbarui')
      } else {
        await reservasiService.create(form as Partial<ReservasiBuku>)
        toast.success('Reservasi berhasil dibuat')
      }
      await queryClient.invalidateQueries({ queryKey: ['reservasi-buku'] })
      navigate('/sekolah/perpustakaan/reservasi')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan reservasi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Reservasi' : 'Buat Reservasi'}
      onBack={() => navigate('/sekolah/perpustakaan/reservasi')}
      backLabel="Reservasi Buku"
      tabs={[{
        id: 'form',
        label: 'Data Reservasi',
        content: (
          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Buku <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={form.buku_id}
                onChange={(e) => setForm((p) => ({ ...p, buku_id: e.target.value }))}
                required
              >
                <option value="">— Pilih Buku —</option>
                {bukuOptions.map((b) => (
                  <option key={b.id} value={b.id}>{b.judul}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Anggota <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={form.anggota_id}
                onChange={(e) => setForm((p) => ({ ...p, anggota_id: e.target.value }))}
                required
              >
                <option value="">— Pilih Anggota —</option>
                {anggotaOptions.map((a) => (
                  <option key={a.id} value={a.id}>{a.siswa_nama}</option>
                ))}
              </select>
            </div>
          </div>
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/perpustakaan/reservasi')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Buat Reservasi'}
      serverError={serverError}
    />
  )
}

export default ReservasiFormPage
