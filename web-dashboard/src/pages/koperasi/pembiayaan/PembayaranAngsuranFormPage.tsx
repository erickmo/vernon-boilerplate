// src/pages/koperasi/pembiayaan/PembayaranAngsuranFormPage.tsx
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { pembayaranAngsuranService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { PembayaranAngsuran } from '@/types/koperasi/pembiayaan.types'
import styles from './PembayaranAngsuranFormPage.module.css'

export function PembayaranAngsuranFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState<Partial<PembayaranAngsuran>>({
    akad_id: '',
    jadwal_id: '',
    nominal: 0,
    tanggal_bayar: new Date().toISOString().split('T')[0],
    keterangan: '',
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<PembayaranAngsuran>) => pembayaranAngsuranService.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.pembayaranAngsuran] })
      void qc.invalidateQueries({ queryKey: [QK.akadPembiayaan] })
      toast.success('Pembayaran angsuran berhasil dicatat.')
      navigate('/koperasi/pembiayaan/pembayaran')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  const formFields = (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>ID Akad Pembiayaan</label>
        <input
          className={styles.input}
          placeholder="ID akad..."
          value={form.akad_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, akad_id: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>ID Jadwal Angsuran</label>
        <input
          className={styles.input}
          placeholder="ID jadwal..."
          value={form.jadwal_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, jadwal_id: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nominal (Rp)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          value={form.nominal ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, nominal: parseInt(e.target.value, 10) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tanggal Bayar</label>
        <input
          className={styles.input}
          type="date"
          value={form.tanggal_bayar ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tanggal_bayar: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Keterangan</label>
        <textarea
          className={styles.textarea}
          rows={2}
          value={form.keterangan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title="Catat Pembayaran Angsuran"
      onBack={() => navigate('/koperasi/pembiayaan/pembayaran')}
      onCancel={() => navigate('/koperasi/pembiayaan/pembayaran')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      tabs={[{ id: 'form', label: 'Data Pembayaran', content: formFields }]}
    />
  )
}
