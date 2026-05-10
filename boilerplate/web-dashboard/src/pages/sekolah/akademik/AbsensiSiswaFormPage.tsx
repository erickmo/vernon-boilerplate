// src/pages/sekolah/akademik/AbsensiSiswaFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { absensiSiswaService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type {
  AbsensiHarian,
  StatusAbsensiSiswa,
} from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

const STATUS_OPTIONS: StatusAbsensiSiswa[] = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat']

interface FormState {
  rombel: string
  tanggal: string
  tahun_ajaran: string
  semester: string
  detail: Array<{
    siswa: string
    siswa_nama: string
    nis: string
    status: StatusAbsensiSiswa
    keterangan: string
  }>
}

const EMPTY_FORM: FormState = {
  rombel: '',
  tanggal: new Date().toISOString().split('T')[0],
  tahun_ajaran: '',
  semester: '',
  detail: [],
}

export default function AbsensiSiswaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery<AbsensiHarian>({
    queryKey: ['absensi-siswa', id],
    queryFn: () => absensiSiswaService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        rombel: existing.rombel,
        tanggal: existing.tanggal,
        tahun_ajaran: existing.tahun_ajaran,
        semester: existing.semester,
        detail: existing.detail.map((d) => ({
          siswa: d.siswa,
          siswa_nama: d.siswa_nama,
          nis: d.nis,
          status: d.status,
          keterangan: d.keterangan ?? '',
        })),
      })
    }
  }, [existing])

  function handleDetailStatusChange(index: number, status: StatusAbsensiSiswa) {
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
    mutationFn: (data: Partial<AbsensiHarian>) =>
      isEdit ? absensiSiswaService.update(id!, data) : absensiSiswaService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['absensi-siswa'] })
      toast.success(isEdit ? 'Absensi diperbarui' : 'Absensi disimpan')
      navigate('/sekolah/akademik/absensi-siswa')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate(form as unknown as Partial<AbsensiHarian>)
  }

  const headerContent = (
    <div className={styles.fields}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Rombongan Belajar <span className={styles.required}>*</span></label>
          <input
            className={styles.input}
            type="text"
            value={form.rombel}
            onChange={(e) => setForm((p) => ({ ...p, rombel: e.target.value }))}
            placeholder="ID Rombel"
            required
          />
        </div>
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
      </div>
      <div className={styles.row}>
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
        <div className={styles.field}>
          <label className={styles.label}>Semester</label>
          <select
            className={styles.select}
            value={form.semester}
            onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
          >
            <option value="">Pilih Semester</option>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>
    </div>
  )

  const detailContent = (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>NIS</th>
            <th>Nama Siswa</th>
            <th>Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {form.detail.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>
                Pilih rombel terlebih dahulu untuk memuat daftar siswa
              </td>
            </tr>
          )}
          {form.detail.map((d, i) => (
            <tr key={d.siswa}>
              <td>{d.nis}</td>
              <td>{d.siswa_nama}</td>
              <td>
                <select
                  className={styles.select}
                  value={d.status}
                  onChange={(e) => handleDetailStatusChange(i, e.target.value as StatusAbsensiSiswa)}
                  style={{ minWidth: 120 }}
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
      title={isEdit ? 'Edit Absensi Siswa' : 'Input Absensi Siswa'}
      onBack={() => navigate('/sekolah/akademik/absensi-siswa')}
      onCancel={() => navigate('/sekolah/akademik/absensi-siswa')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        { id: 'header', label: 'Info Absensi', content: headerContent },
        { id: 'detail', label: 'Daftar Siswa', content: detailContent },
      ]}
    />
  )
}
