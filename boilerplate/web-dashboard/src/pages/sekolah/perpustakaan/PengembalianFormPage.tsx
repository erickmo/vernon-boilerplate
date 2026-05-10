// src/pages/sekolah/perpustakaan/PengembalianFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { pengembalianService, peminjamanService } from '@/services/sekolah/perpustakaan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { PengembalianBuku } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuFormPage.module.css'

interface FormData {
  peminjaman_id: string
  tanggal_kembali_aktual: string
}

const EMPTY: FormData = {
  peminjaman_id: '',
  tanggal_kembali_aktual: new Date().toISOString().split('T')[0],
}

export function PengembalianFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: pengembalian } = useQuery({
    queryKey: ['pengembalian-buku', id],
    queryFn: () => pengembalianService.getById(id!),
    enabled: isEdit,
  })

  // Only show active/terlambat peminjaman (not yet returned)
  const { data: peminjamanRes } = useQuery({
    queryKey: ['peminjaman-aktif'],
    queryFn: () => peminjamanService.list({ status: 'Aktif', limit: 500 }),
    enabled: !isEdit,
  })
  const peminjamanOptions = peminjamanRes?.items ?? []

  useEffect(() => {
    if (pengembalian) {
      setForm({
        peminjaman_id: pengembalian.peminjaman_id,
        tanggal_kembali_aktual: pengembalian.tanggal_kembali_aktual,
      })
    }
  }, [pengembalian])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await pengembalianService.update(id!, form as Partial<PengembalianBuku>)
        toast.success('Data pengembalian berhasil diperbarui')
      } else {
        await pengembalianService.create(form as Partial<PengembalianBuku>)
        toast.success('Pengembalian berhasil dicatat')
      }
      await queryClient.invalidateQueries({ queryKey: ['pengembalian-buku'] })
      await queryClient.invalidateQueries({ queryKey: ['peminjaman-buku'] })
      navigate('/sekolah/perpustakaan/pengembalian')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan pengembalian')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Pengembalian' : 'Catat Pengembalian'}
      onBack={() => navigate('/sekolah/perpustakaan/pengembalian')}
      backLabel="Pengembalian Buku"
      tabs={[{
        id: 'form',
        label: 'Data Pengembalian',
        content: (
          <div className={styles.fields}>
            {!isEdit && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Peminjaman <span className={styles.required}>*</span></label>
                <select
                  className={styles.select}
                  value={form.peminjaman_id}
                  onChange={(e) => setForm((p) => ({ ...p, peminjaman_id: e.target.value }))}
                  required
                >
                  <option value="">— Pilih Peminjaman —</option>
                  {peminjamanOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.nomor} — {p.anggota_nama}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tanggal Kembali Aktual <span className={styles.required}>*</span></label>
              <input
                className={styles.input}
                type="date"
                value={form.tanggal_kembali_aktual}
                onChange={(e) => setForm((p) => ({ ...p, tanggal_kembali_aktual: e.target.value }))}
                required
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Denda keterlambatan akan dihitung otomatis oleh server berdasarkan tanggal jatuh tempo peminjaman dan tarif denda dari Pengaturan Perpustakaan.
              </p>
            </div>
          </div>
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/perpustakaan/pengembalian')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Catat Pengembalian'}
      serverError={serverError}
    />
  )
}

export default PengembalianFormPage
