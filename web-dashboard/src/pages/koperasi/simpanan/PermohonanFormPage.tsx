// src/pages/koperasi/simpanan/PermohonanFormPage.tsx
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { permohonanSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { PermohonanSimpanan, TipePermohonan } from '@/types/koperasi/simpanan.types'
import styles from './PermohonanFormPage.module.css'

const TIPE_OPTIONS: TipePermohonan[] = [
  'Buka Rekening', 'Tutup Rekening', 'Blokir Rekening', 'Unblokir Rekening', 'Aktivasi Dormant',
]

export function PermohonanFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState<Partial<PermohonanSimpanan>>({
    tipe: 'Buka Rekening',
    rekening_id: null,
    no_rekening: null,
    nasabah_id: '',
    alasan: '',
    status: 'Draft',
  })

  const isBukaRekening = form.tipe === 'Buka Rekening'

  const mutation = useMutation({
    mutationFn: (data: Partial<PermohonanSimpanan>) =>
      permohonanSimpananService.create(data),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: [QK.permohonanSimpanan] })
      toast.success('Permohonan berhasil dibuat.')
      navigate(`/koperasi/simpanan/permohonan/${created.id}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  const formFields = (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tipe Permohonan</label>
        <select
          className={styles.input}
          value={form.tipe}
          onChange={(e) => setForm((f) => ({ ...f, tipe: e.target.value as TipePermohonan }))}
        >
          {TIPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {!isBukaRekening && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>No Rekening</label>
          <input
            className={styles.input}
            placeholder="Masukkan no rekening..."
            value={form.no_rekening ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, no_rekening: e.target.value }))}
            required
          />
        </div>
      )}

      {isBukaRekening && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>ID Nasabah</label>
          <input
            className={styles.input}
            placeholder="ID nasabah..."
            value={form.nasabah_id ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, nasabah_id: e.target.value }))}
            required
          />
        </div>
      )}

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Alasan / Keterangan</label>
        <textarea
          className={styles.textarea}
          rows={4}
          value={form.alasan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, alasan: e.target.value }))}
          required
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title="Buat Permohonan"
      onBack={() => navigate('/koperasi/simpanan/permohonan')}
      onCancel={() => navigate('/koperasi/simpanan/permohonan')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      tabs={[{ id: 'form', label: 'Detail Permohonan', content: formFields }]}
    />
  )
}
