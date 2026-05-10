// src/pages/sekolah/perpustakaan/BukuFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { bukuService, kategoriBukuService } from '@/services/sekolah/perpustakaan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { Buku } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuFormPage.module.css'

interface BukuFormData {
  judul: string
  penulis: string
  isbn: string
  penerbit: string
  tahun_terbit: string
  kategori: string
  deskripsi: string
}

const EMPTY_FORM: BukuFormData = {
  judul: '',
  penulis: '',
  isbn: '',
  penerbit: '',
  tahun_terbit: '',
  kategori: '',
  deskripsi: '',
}

function BukuFormFields({
  form,
  onChange,
  kategoriOptions,
}: {
  form: BukuFormData
  onChange: (key: keyof BukuFormData, value: string) => void
  kategoriOptions: { id: string; nama: string }[]
}) {
  return (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="judul">Judul <span className={styles.required}>*</span></label>
        <input
          id="judul"
          className={styles.input}
          value={form.judul}
          onChange={(e) => onChange('judul', e.target.value)}
          required
          placeholder="Masukkan judul buku"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="penulis">Penulis <span className={styles.required}>*</span></label>
        <input
          id="penulis"
          className={styles.input}
          value={form.penulis}
          onChange={(e) => onChange('penulis', e.target.value)}
          required
          placeholder="Nama penulis"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="isbn">ISBN</label>
        <input
          id="isbn"
          className={styles.input}
          value={form.isbn}
          onChange={(e) => onChange('isbn', e.target.value)}
          placeholder="978-xxx-xxx-xxx-x"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="penerbit">Penerbit</label>
        <input
          id="penerbit"
          className={styles.input}
          value={form.penerbit}
          onChange={(e) => onChange('penerbit', e.target.value)}
          placeholder="Nama penerbit"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tahun_terbit">Tahun Terbit</label>
        <input
          id="tahun_terbit"
          className={styles.input}
          type="number"
          min={1900}
          max={2100}
          value={form.tahun_terbit}
          onChange={(e) => onChange('tahun_terbit', e.target.value)}
          placeholder="2024"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="kategori">Kategori</label>
        <select
          id="kategori"
          className={styles.select}
          value={form.kategori}
          onChange={(e) => onChange('kategori', e.target.value)}
        >
          <option value="">— Pilih Kategori —</option>
          {kategoriOptions.map((k) => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label} htmlFor="deskripsi">Deskripsi</label>
        <textarea
          id="deskripsi"
          className={styles.textarea}
          value={form.deskripsi}
          onChange={(e) => onChange('deskripsi', e.target.value)}
          rows={4}
          placeholder="Sinopsis atau keterangan buku"
        />
      </div>
    </div>
  )
}

export function BukuFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<BukuFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: buku } = useQuery({
    queryKey: ['buku', id],
    queryFn: () => bukuService.getById(id!),
    enabled: isEdit,
  })

  const { data: kategoriRes } = useQuery({
    queryKey: ['kategori-buku'],
    queryFn: () => kategoriBukuService.list({ limit: 200 }),
  })
  const kategoriOptions = kategoriRes?.items ?? []

  useEffect(() => {
    if (buku) {
      setForm({
        judul: buku.judul,
        penulis: buku.penulis,
        isbn: buku.isbn,
        penerbit: buku.penerbit,
        tahun_terbit: String(buku.tahun_terbit),
        kategori: buku.kategori,
        deskripsi: buku.deskripsi ?? '',
      })
    }
  }, [buku])

  function handleChange(key: keyof BukuFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      const payload: Partial<Buku> = {
        ...form,
        tahun_terbit: Number(form.tahun_terbit) || undefined,
      }
      if (isEdit) {
        await bukuService.update(id!, payload)
        await queryClient.invalidateQueries({ queryKey: ['buku', id] })
        toast.success('Data buku berhasil diperbarui')
        navigate(`/sekolah/perpustakaan/buku/${id}`)
      } else {
        const created = await bukuService.create(payload)
        await queryClient.invalidateQueries({ queryKey: ['perpustakaan-buku'] })
        toast.success('Buku berhasil ditambahkan')
        navigate(`/sekolah/perpustakaan/buku/${(created as Buku).id}`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan data buku')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Buku' : 'Tambah Buku'}
      onBack={() => navigate(isEdit ? `/sekolah/perpustakaan/buku/${id}` : '/sekolah/perpustakaan/buku')}
      backLabel={isEdit ? 'Detail Buku' : 'Katalog Buku'}
      tabs={[{
        id: 'form',
        label: 'Data Buku',
        content: (
          <BukuFormFields
            form={form}
            onChange={handleChange}
            kategoriOptions={kategoriOptions}
          />
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate(isEdit ? `/sekolah/perpustakaan/buku/${id}` : '/sekolah/perpustakaan/buku')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Simpan'}
      serverError={serverError}
    />
  )
}

export default BukuFormPage
