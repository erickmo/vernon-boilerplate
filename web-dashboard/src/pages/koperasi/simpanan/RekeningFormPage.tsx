// src/pages/koperasi/simpanan/RekeningFormPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { rekeningSimapnanService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { RekeningSimapnan } from '@/types/koperasi/simpanan.types'
import styles from './RekeningFormPage.module.css'

// Only these fields can be edited directly.
// status and tanggal_buka MUST go through Permohonan workflow.
type EditableFields = Pick<RekeningSimapnan, 'produk_id' | 'produk_nama'>

export function RekeningFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: rekening, isLoading } = useQuery<RekeningSimapnan>({
    queryKey: [QK.rekeningSimapnanDetail, id],
    queryFn: () => rekeningSimapnanService.getById(id!),
    enabled: !!id,
  })

  const [form, setForm] = useState<Partial<EditableFields>>({})

  if (rekening && form.produk_id === undefined) {
    setForm({ produk_id: rekening.produk_id, produk_nama: rekening.produk_nama })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<RekeningSimapnan>) =>
      rekeningSimapnanService.update(id!, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.rekeningSimapnanDetail, id] })
      toast.success('Rekening berhasil diperbarui.')
      navigate(`/koperasi/simpanan/rekening/${id}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  if (isLoading || !rekening) {
    return <div className={styles.loading}>Memuat rekening...</div>
  }

  const restrictedBanner = (
    <div className={styles.warningBanner}>
      <AlertTriangle size={16} />
      <span>
        <strong>Catatan:</strong> Status rekening dan tanggal buka tidak dapat diubah langsung.
        Gunakan <strong>Permohonan</strong> untuk mengubah status (blokir, tutup, dll).
      </span>
    </div>
  )

  const formFields = (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>No Rekening</label>
        <input className={styles.inputReadonly} value={rekening.no_rekening} readOnly disabled />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nasabah</label>
        <input className={styles.inputReadonly} value={rekening.nasabah_nama} readOnly disabled />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Status</label>
        <input className={styles.inputReadonly} value={rekening.status} readOnly disabled />
        <span className={styles.hint}>Ubah status via menu Permohonan.</span>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tanggal Buka</label>
        <input className={styles.inputReadonly} value={new Date(rekening.tanggal_buka).toLocaleDateString('id-ID')} readOnly disabled />
        <span className={styles.hint}>Tidak dapat diubah.</span>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Produk Simpanan (ID)</label>
        <input
          className={styles.input}
          value={form.produk_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, produk_id: e.target.value }))}
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={`Edit Rekening — ${rekening.no_rekening}`}
      onBack={() => navigate(`/koperasi/simpanan/rekening/${id}`)}
      onCancel={() => navigate(`/koperasi/simpanan/rekening/${id}`)}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      beforeTabsContent={restrictedBanner}
      tabs={[{ id: 'form', label: 'Edit Rekening', content: formFields }]}
    />
  )
}
