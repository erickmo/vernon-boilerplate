// src/pages/koperasi/pembiayaan/AkadFormPage.tsx
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { akadPembiayaanService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { AkadPembiayaan, JenisAkad } from '@/types/koperasi/pembiayaan.types'
import styles from './AkadFormPage.module.css'

const AKAD_OPTIONS: JenisAkad[] = ['Murabahah', 'Mudharabah', 'Musyarakah', 'Ijarah', 'Qardh']

export function AkadFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState<Partial<AkadPembiayaan>>({
    nasabah_id: '',
    produk_id: '',
    akad: 'Murabahah',
    nominal_pokok: 0,
    tenor: 12,
    tujuan_pembiayaan: '',
    tanggal_akad: new Date().toISOString().split('T')[0],
    agunan: '',
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<AkadPembiayaan>) => akadPembiayaanService.create(data),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: [QK.akadPembiayaan] })
      toast.success('Akad pembiayaan berhasil dibuat.')
      navigate(`/koperasi/pembiayaan/akad/${created.id}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  const formFields = (
    <div className={styles.fields}>
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
      <div className={styles.fieldGroup}>
        <label className={styles.label}>ID Produk Pembiayaan</label>
        <input
          className={styles.input}
          placeholder="ID produk..."
          value={form.produk_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, produk_id: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Jenis Akad</label>
        <select
          className={styles.input}
          value={form.akad}
          onChange={(e) => setForm((f) => ({ ...f, akad: e.target.value as JenisAkad }))}
        >
          {AKAD_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nominal Pokok (Rp)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          value={form.nominal_pokok ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, nominal_pokok: parseInt(e.target.value, 10) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tenor (bulan)</label>
        <input
          className={styles.input}
          type="number"
          min={1}
          value={form.tenor ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tenor: parseInt(e.target.value, 10) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tujuan Pembiayaan</label>
        <textarea
          className={styles.textarea}
          rows={2}
          value={form.tujuan_pembiayaan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tujuan_pembiayaan: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tanggal Akad</label>
        <input
          className={styles.input}
          type="date"
          value={form.tanggal_akad ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tanggal_akad: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Agunan</label>
        <textarea
          className={styles.textarea}
          rows={2}
          value={form.agunan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, agunan: e.target.value }))}
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title="Buat Akad Pembiayaan"
      onBack={() => navigate('/koperasi/pembiayaan/akad')}
      onCancel={() => navigate('/koperasi/pembiayaan/akad')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      tabs={[{ id: 'form', label: 'Data Akad', content: formFields }]}
    />
  )
}
