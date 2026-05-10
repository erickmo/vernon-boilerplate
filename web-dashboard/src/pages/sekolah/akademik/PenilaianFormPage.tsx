// src/pages/sekolah/akademik/PenilaianFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { penilaianService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type { EntriNilai } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

const KOMPONEN_OPTIONS = ['UH1', 'UH2', 'UH3', 'UTS', 'UAS', 'Tugas', 'Praktik']
const SEMESTER_OPTIONS = ['Ganjil', 'Genap']

interface NilaiSiswa {
  siswa: string
  siswa_nama: string
  nis: string
  nilai: number | ''
}

interface FormState {
  mata_pelajaran: string
  rombel: string
  komponen: string
  semester: string
  tahun_ajaran: string
  guru: string
  nilai_siswa: NilaiSiswa[]
}

const EMPTY_FORM: FormState = {
  mata_pelajaran: '',
  rombel: '',
  komponen: '',
  semester: '',
  tahun_ajaran: '',
  guru: '',
  nilai_siswa: [],
}

export default function PenilaianFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery<EntriNilai>({
    queryKey: ['entri-nilai', id],
    queryFn: () => penilaianService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        mata_pelajaran: existing.mata_pelajaran,
        rombel: existing.rombel,
        komponen: existing.komponen,
        semester: existing.semester,
        tahun_ajaran: existing.tahun_ajaran,
        guru: existing.guru,
        nilai_siswa: [],
      })
    }
  }, [existing])

  function handleNilaiChange(index: number, nilai: string) {
    setForm((prev) => {
      const nilai_siswa = [...prev.nilai_siswa]
      nilai_siswa[index] = { ...nilai_siswa[index], nilai: nilai === '' ? '' : Number(nilai) }
      return { ...prev, nilai_siswa }
    })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<EntriNilai>) =>
      isEdit ? penilaianService.update(id!, data) : penilaianService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['entri-nilai'] })
      toast.success(isEdit ? 'Entri nilai diperbarui' : 'Entri nilai disimpan')
      navigate('/sekolah/akademik/penilaian')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate(form as unknown as Partial<EntriNilai>)
  }

  const headerContent = (
    <div className={styles.fields}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Mata Pelajaran <span className={styles.required}>*</span></label>
          <input
            className={styles.input}
            type="text"
            value={form.mata_pelajaran}
            onChange={(e) => setForm((p) => ({ ...p, mata_pelajaran: e.target.value }))}
            placeholder="ID Mata Pelajaran"
            required
          />
        </div>
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
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Komponen <span className={styles.required}>*</span></label>
          <select
            className={styles.select}
            value={form.komponen}
            onChange={(e) => setForm((p) => ({ ...p, komponen: e.target.value }))}
            required
          >
            <option value="">Pilih Komponen</option>
            {KOMPONEN_OPTIONS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Semester <span className={styles.required}>*</span></label>
          <select
            className={styles.select}
            value={form.semester}
            onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
            required
          >
            <option value="">Pilih Semester</option>
            {SEMESTER_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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
          <label className={styles.label}>Guru Pengampu</label>
          <input
            className={styles.input}
            type="text"
            value={form.guru}
            onChange={(e) => setForm((p) => ({ ...p, guru: e.target.value }))}
            placeholder="ID Guru"
          />
        </div>
      </div>
    </div>
  )

  const nilaiContent = (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>NIS</th>
            <th>Nama Siswa</th>
            <th>Nilai (0–100)</th>
          </tr>
        </thead>
        <tbody>
          {form.nilai_siswa.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>
                Pilih Mata Pelajaran dan Rombel untuk memuat daftar siswa
              </td>
            </tr>
          )}
          {form.nilai_siswa.map((s, i) => (
            <tr key={s.siswa}>
              <td>{s.nis}</td>
              <td>{s.siswa_nama}</td>
              <td>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  max={100}
                  value={s.nilai}
                  onChange={(e) => handleNilaiChange(i, e.target.value)}
                  placeholder="0–100"
                  style={{ width: 80 }}
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
      title={isEdit ? 'Edit Entri Nilai' : 'Entri Nilai Baru'}
      onBack={() => navigate('/sekolah/akademik/penilaian')}
      onCancel={() => navigate('/sekolah/akademik/penilaian')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        { id: 'header', label: 'Info Penilaian', content: headerContent },
        { id: 'nilai', label: 'Nilai Siswa', content: nilaiContent },
      ]}
    />
  )
}
