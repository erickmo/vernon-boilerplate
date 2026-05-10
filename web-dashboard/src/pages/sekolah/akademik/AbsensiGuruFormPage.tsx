// src/pages/sekolah/akademik/AbsensiGuruFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { absensiGuruService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type { AbsensiGuru, StatusAbsensiGuru } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

const STATUS_OPTIONS: StatusAbsensiGuru[] = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Dinas Luar']

interface FormState {
  tanggal: string
  tahun_ajaran: string
  keterangan: string
  detail: Array<{
    guru: string
    guru_nama: string
    nip: string
    status: StatusAbsensiGuru
    keterangan: string
  }>
}

const EMPTY_FORM: FormState = {
  tanggal: new Date().toISOString().split('T')[0],
  tahun_ajaran: '',
  keterangan: '',
  detail: [],
}

export default function AbsensiGuruFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery<AbsensiGuru>({
    queryKey: ['absensi-guru', id],
    queryFn: () => absensiGuruService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        tanggal: existing.tanggal,
        tahun_ajaran: existing.tahun_ajaran,
        keterangan: existing.keterangan ?? '',
        detail: existing.detail.map((d) => ({
          guru: d.guru,
          guru_nama: d.guru_nama,
          nip: d.nip,
          status: d.status,
          keterangan: d.keterangan ?? '',
        })),
      })
    }
  }, [existing])

  function handleDetailStatusChange(index: number, status: StatusAbsensiGuru) {
    setForm((prev) => {
      const detail = [...prev.detail]
      detail[index] = { ...detail[index], status }
      return { ...prev, detail }
    })
  }

  function handleDetailKeteranganChange(index: number, keterangan: string) {
    setForm((prev) => {
      const detail = [...prev.detail]
      detail[index] = { ...detail[index], keterangan }
      return { ...prev, detail }
    })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<AbsensiGuru>) =>
      isEdit ? absensiGuruService.update(id!, data) : absensiGuruService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['absensi-guru'] })
      toast.success(isEdit ? 'Absensi guru diperbarui' : 'Absensi guru disimpan')
      navigate('/sekolah/akademik/absensi-guru')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate(form as unknown as Partial<AbsensiGuru>)
  }

  const headerContent = (
    <div className={styles.fields}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Tanggal <span className={styles.required}>*</span></label>
          <input
            className={styles.input}
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm((p) => ({ ...p, tanggal: e.target.value }))}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Tahun Ajaran</label>
          <input
            className={styles.input}
            type="text"
            value={form.tahun_ajaran}
            onChange={(e) => setForm((p) => ({ ...p, tahun_ajaran: e.target.value }))}
            placeholder="e.g. 2024/2025"
          />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Keterangan</label>
        <textarea
          className={styles.textarea}
          value={form.keterangan}
          onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))}
          rows={3}
          placeholder="Catatan tambahan (opsional)"
        />
      </div>
    </div>
  )

  const detailContent = (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>NIP</th>
            <th>Nama Guru</th>
            <th>Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {form.detail.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>
                Belum ada data guru. Simpan header dulu untuk memuat daftar guru.
              </td>
            </tr>
          )}
          {form.detail.map((d, i) => (
            <tr key={d.guru}>
              <td>{d.nip}</td>
              <td>{d.guru_nama}</td>
              <td>
                <select
                  className={styles.select}
                  value={d.status}
                  onChange={(e) => handleDetailStatusChange(i, e.target.value as StatusAbsensiGuru)}
                  style={{ minWidth: 130 }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  className={styles.input}
                  type="text"
                  value={d.keterangan}
                  onChange={(e) => handleDetailKeteranganChange(i, e.target.value)}
                  placeholder="Opsional"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Absensi Guru' : 'Input Absensi Guru'}
      onBack={() => navigate('/sekolah/akademik/absensi-guru')}
      onCancel={() => navigate('/sekolah/akademik/absensi-guru')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        { id: 'header', label: 'Info Absensi', content: headerContent },
        { id: 'detail', label: 'Daftar Guru', content: detailContent },
      ]}
    />
  )
}
