// src/pages/koperasi/simpanan/ProdukSimpananFormPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { produkSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { ProdukSimpanan, TipeSimpanan } from '@/types/koperasi/simpanan.types'
import styles from './ProdukSimpananFormPage.module.css'

const TIPE_OPTIONS: TipeSimpanan[] = ['Tabungan', 'Deposito', 'Giro']

export function ProdukSimpananFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const qc = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: [QK.produkSimpananDetail, id],
    queryFn: () => produkSimpananService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<ProdukSimpanan>>({
    nama: '',
    tipe: 'Tabungan',
    nisbah_bagi_hasil: 0,
    min_setoran: 0,
    keterangan: '',
    status: 'Aktif',
  })

  // Populate form when edit data arrives
  if (isEdit && existing && form.nama === '' && existing.nama) {
    setForm({
      nama: existing.nama,
      tipe: existing.tipe,
      nisbah_bagi_hasil: existing.nisbah_bagi_hasil,
      min_setoran: existing.min_setoran,
      keterangan: existing.keterangan,
      status: existing.status,
    })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<ProdukSimpanan>) =>
      isEdit
        ? produkSimpananService.update(id!, data)
        : produkSimpananService.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.produkSimpanan] })
      toast.success(isEdit ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.')
      navigate('/koperasi/simpanan/produk')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  const formFields = (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nama Produk</label>
        <input
          className={styles.input}
          value={form.nama ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tipe</label>
        <select
          className={styles.input}
          value={form.tipe}
          onChange={(e) => setForm((f) => ({ ...f, tipe: e.target.value as TipeSimpanan }))}
        >
          {TIPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nisbah Bagi Hasil (%)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={form.nisbah_bagi_hasil ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, nisbah_bagi_hasil: parseFloat(e.target.value) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Minimum Setoran (Rp)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          value={form.min_setoran ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, min_setoran: parseInt(e.target.value, 10) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Keterangan</label>
        <textarea
          className={styles.textarea}
          value={form.keterangan ?? ''}
          rows={3}
          onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
        />
      </div>
      {isEdit && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Status</label>
          <select
            className={styles.input}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'Aktif' | 'Tidak Aktif' }))}
          >
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>
      )}
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Produk Simpanan' : 'Tambah Produk Simpanan'}
      onBack={() => navigate('/koperasi/simpanan/produk')}
      onCancel={() => navigate('/koperasi/simpanan/produk')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      tabs={[{ id: 'form', label: 'Data Produk', content: formFields }]}
    />
  )
}
