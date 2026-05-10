// src/pages/koperasi/pembiayaan/ProdukPembiayaanFormPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { produkPembiayaanService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { ProdukPembiayaan, JenisAkad } from '@/types/koperasi/pembiayaan.types'
import styles from './ProdukPembiayaanFormPage.module.css'

const AKAD_OPTIONS: JenisAkad[] = ['Murabahah', 'Mudharabah', 'Musyarakah', 'Ijarah', 'Qardh']

export function ProdukPembiayaanFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const qc = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: [QK.produkPembiayaanDetail, id],
    queryFn: () => produkPembiayaanService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<ProdukPembiayaan>>({
    nama: '',
    akad: 'Murabahah',
    margin: 0,
    tenor_max: 12,
    keterangan: '',
    status: 'Aktif',
  })

  if (isEdit && existing && form.nama === '' && existing.nama) {
    setForm({
      nama: existing.nama,
      akad: existing.akad,
      margin: existing.margin,
      tenor_max: existing.tenor_max,
      keterangan: existing.keterangan,
      status: existing.status,
    })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<ProdukPembiayaan>) =>
      isEdit
        ? produkPembiayaanService.update(id!, data)
        : produkPembiayaanService.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.produkPembiayaan] })
      toast.success(isEdit ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.')
      navigate('/koperasi/pembiayaan/produk')
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
        <label className={styles.label}>Margin (%)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={form.margin ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, margin: parseFloat(e.target.value) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tenor Maksimum (bulan)</label>
        <input
          className={styles.input}
          type="number"
          min={1}
          value={form.tenor_max ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tenor_max: parseInt(e.target.value, 10) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Keterangan</label>
        <textarea
          className={styles.textarea}
          rows={3}
          value={form.keterangan ?? ''}
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
      title={isEdit ? 'Edit Produk Pembiayaan' : 'Tambah Produk Pembiayaan'}
      onBack={() => navigate('/koperasi/pembiayaan/produk')}
      onCancel={() => navigate('/koperasi/pembiayaan/produk')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      tabs={[{ id: 'form', label: 'Data Produk', content: formFields }]}
    />
  )
}
