// src/pages/sekolah/perpustakaan/PeminjamanFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { peminjamanService, anggotaPerpustakaanService, eksemplarService } from '@/services/sekolah/perpustakaan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { PeminjamanBuku } from '@/types/sekolah/perpustakaan.types'
import styles from './PeminjamanFormPage.module.css'

interface PeminjamanFormData {
  anggota_id: string
  anggota_nama: string
  tanggal_pinjam: string
  jatuh_tempo: string
  eksemplar_ids: string[]
}

const EMPTY: PeminjamanFormData = {
  anggota_id: '',
  anggota_nama: '',
  tanggal_pinjam: new Date().toISOString().split('T')[0],
  jatuh_tempo: '',
  eksemplar_ids: [],
}

function PeminjamanFormFields({
  form,
  onChange,
  onAddEksemplar,
  onRemoveEksemplar,
  anggotaOptions,
  eksemplarOptions,
}: {
  form: PeminjamanFormData
  onChange: (k: keyof PeminjamanFormData, v: string) => void
  onAddEksemplar: (id: string) => void
  onRemoveEksemplar: (id: string) => void
  anggotaOptions: { id: string; siswa_nama: string }[]
  eksemplarOptions: { id: string; kode_eksemplar: string; judul_buku?: string }[]
}) {
  return (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Anggota <span className={styles.required}>*</span></label>
        <select
          className={styles.select}
          value={form.anggota_id}
          onChange={(e) => {
            const opt = anggotaOptions.find((a) => a.id === e.target.value)
            onChange('anggota_id', e.target.value)
            if (opt) onChange('anggota_nama', opt.siswa_nama)
          }}
          required
        >
          <option value="">— Pilih Anggota —</option>
          {anggotaOptions.map((a) => (
            <option key={a.id} value={a.id}>{a.siswa_nama}</option>
          ))}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tanggal Pinjam <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="date"
          value={form.tanggal_pinjam}
          onChange={(e) => onChange('tanggal_pinjam', e.target.value)}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Jatuh Tempo <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="date"
          value={form.jatuh_tempo}
          onChange={(e) => onChange('jatuh_tempo', e.target.value)}
          required
        />
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label}>Eksemplar Buku</label>
        <div className={styles.eksemplarPicker}>
          <select
            className={styles.select}
            onChange={(e) => { if (e.target.value) { onAddEksemplar(e.target.value); e.target.value = '' } }}
          >
            <option value="">+ Tambah eksemplar...</option>
            {eksemplarOptions
              .filter((e) => !form.eksemplar_ids.includes(e.id))
              .map((e) => (
                <option key={e.id} value={e.id}>{e.kode_eksemplar}</option>
              ))
            }
          </select>
          {form.eksemplar_ids.length > 0 && (
            <div className={styles.eksemplarList}>
              {form.eksemplar_ids.map((eksId) => {
                const eks = eksemplarOptions.find((e) => e.id === eksId)
                return (
                  <div key={eksId} className={styles.eksemplarItem}>
                    <span>{eks?.kode_eksemplar ?? eksId}</span>
                    <button type="button" onClick={() => onRemoveEksemplar(eksId)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PeminjamanFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<PeminjamanFormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: peminjaman } = useQuery({
    queryKey: ['peminjaman-buku', id],
    queryFn: () => peminjamanService.getById(id!),
    enabled: isEdit,
  })

  const { data: anggotaRes } = useQuery({
    queryKey: ['anggota-perpustakaan'],
    queryFn: () => anggotaPerpustakaanService.list({ limit: 500 }),
  })

  const { data: eksemplarRes } = useQuery({
    queryKey: ['eksemplar-tersedia'],
    queryFn: () => eksemplarService.list({ status: 'Tersedia', limit: 500 }),
  })

  const anggotaOptions = anggotaRes?.items ?? []
  const eksemplarOptions = eksemplarRes?.items ?? []

  useEffect(() => {
    if (peminjaman) {
      setForm({
        anggota_id: peminjaman.anggota_id,
        anggota_nama: peminjaman.anggota_nama,
        tanggal_pinjam: peminjaman.tanggal_pinjam,
        jatuh_tempo: peminjaman.jatuh_tempo,
        eksemplar_ids: peminjaman.items.map((i) => i.eksemplar_id),
      })
    }
  }, [peminjaman])

  function handleChange(k: keyof PeminjamanFormData, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function handleAddEksemplar(eksId: string) {
    setForm((p) => ({ ...p, eksemplar_ids: [...p.eksemplar_ids, eksId] }))
  }

  function handleRemoveEksemplar(eksId: string) {
    setForm((p) => ({ ...p, eksemplar_ids: p.eksemplar_ids.filter((e) => e !== eksId) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await peminjamanService.update(id!, form as Partial<PeminjamanBuku>)
        await queryClient.invalidateQueries({ queryKey: ['peminjaman-buku'] })
        toast.success('Data peminjaman berhasil diperbarui')
        navigate(`/sekolah/perpustakaan/peminjaman/${id}`)
      } else {
        const created = await peminjamanService.create(form as Partial<PeminjamanBuku>)
        await queryClient.invalidateQueries({ queryKey: ['peminjaman-buku'] })
        toast.success('Peminjaman berhasil dibuat')
        navigate(`/sekolah/perpustakaan/peminjaman/${(created as PeminjamanBuku).id}`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan peminjaman')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Peminjaman' : 'Buat Peminjaman'}
      onBack={() => navigate(isEdit ? `/sekolah/perpustakaan/peminjaman/${id}` : '/sekolah/perpustakaan/peminjaman')}
      backLabel="Peminjaman Buku"
      tabs={[{
        id: 'form',
        label: 'Data Peminjaman',
        content: (
          <PeminjamanFormFields
            form={form}
            onChange={handleChange}
            onAddEksemplar={handleAddEksemplar}
            onRemoveEksemplar={handleRemoveEksemplar}
            anggotaOptions={anggotaOptions}
            eksemplarOptions={eksemplarOptions}
          />
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/perpustakaan/peminjaman')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Buat Peminjaman'}
      serverError={serverError}
    />
  )
}

export default PeminjamanFormPage
