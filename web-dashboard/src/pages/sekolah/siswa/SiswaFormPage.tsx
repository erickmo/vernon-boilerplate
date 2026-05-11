import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { siswaService } from '@/services/sekolah/siswa.service'
import { useForm } from '@/hooks/useForm'
import { toast } from '@/widgets/Toast/Toast'
import type { SiswaFormValues } from '@/types/sekolah/siswa.types'
import styles from './SiswaFormPage.module.css'

const JENIS_KELAMIN_OPTIONS = ['Laki-laki', 'Perempuan'] as const
const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katholik', 'Hindu', 'Buddha', 'Konghucu'] as const

const INITIAL_VALUES: SiswaFormValues = {
  nama_lengkap: '',
  nis: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  agama: '',
  alamat: '',
  foto: '',
}

function validate(values: SiswaFormValues): Partial<Record<keyof SiswaFormValues, string>> {
  const errors: Partial<Record<keyof SiswaFormValues, string>> = {}
  if (!values.nama_lengkap.trim()) errors.nama_lengkap = 'Nama lengkap wajib diisi.'
  if (!values.nis.trim()) errors.nis = 'NIS wajib diisi.'
  if (!values.tanggal_lahir) errors.tanggal_lahir = 'Tanggal lahir wajib diisi.'
  if (!values.jenis_kelamin) errors.jenis_kelamin = 'Jenis kelamin wajib dipilih.'
  return errors
}

export default function SiswaFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string>()

  const { data: existing } = useQuery({
    queryKey: ['siswa', id],
    queryFn: () => siswaService.getById(id!),
    enabled: isEdit,
  })

  const form = useForm<SiswaFormValues>({
    initialValues: existing
      ? {
          nama_lengkap: existing.nama_lengkap,
          nis: existing.nis,
          tempat_lahir: existing.tempat_lahir,
          tanggal_lahir: existing.tanggal_lahir,
          jenis_kelamin: existing.jenis_kelamin,
          agama: existing.agama,
          alamat: existing.alamat,
          foto: existing.foto ?? '',
        }
      : INITIAL_VALUES,
    validate,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      const payload = values as Parameters<typeof siswaService.update>[1]
      if (isEdit && id) {
        await siswaService.update(id, payload)
        await queryClient.invalidateQueries({ queryKey: ['siswa', id] })
        toast.success('Data siswa berhasil diperbarui.')
        navigate(`/sekolah/siswa/${id}`)
      } else {
        const created = await siswaService.create(payload)
        await queryClient.invalidateQueries({ queryKey: ['sekolah-siswa'] })
        toast.success('Siswa baru berhasil ditambahkan.')
        navigate(`/sekolah/siswa/${created.id}`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  })

  const formContent = (
    <div className={styles.formGrid}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="nama_lengkap">
          Nama Lengkap <span className={styles.required}>*</span>
        </label>
        <input id="nama_lengkap" className={styles.input} type="text" {...form.field('nama_lengkap')} />
        {form.touched.nama_lengkap && form.errors.nama_lengkap && (
          <span className={styles.errorMsg}>{form.errors.nama_lengkap}</span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="nis">
          NIS <span className={styles.required}>*</span>
        </label>
        <input id="nis" className={styles.input} type="text" {...form.field('nis')} />
        {form.touched.nis && form.errors.nis && (
          <span className={styles.errorMsg}>{form.errors.nis}</span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tempat_lahir">Tempat Lahir</label>
        <input id="tempat_lahir" className={styles.input} type="text" {...form.field('tempat_lahir')} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tanggal_lahir">
          Tanggal Lahir <span className={styles.required}>*</span>
        </label>
        <input id="tanggal_lahir" className={styles.input} type="date" {...form.field('tanggal_lahir')} />
        {form.touched.tanggal_lahir && form.errors.tanggal_lahir && (
          <span className={styles.errorMsg}>{form.errors.tanggal_lahir}</span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="jenis_kelamin">
          Jenis Kelamin <span className={styles.required}>*</span>
        </label>
        <select id="jenis_kelamin" className={styles.input} {...form.field('jenis_kelamin')}>
          <option value="">Pilih jenis kelamin...</option>
          {JENIS_KELAMIN_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {form.touched.jenis_kelamin && form.errors.jenis_kelamin && (
          <span className={styles.errorMsg}>{form.errors.jenis_kelamin}</span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="agama">Agama</label>
        <select id="agama" className={styles.input} {...form.field('agama')}>
          <option value="">Pilih agama...</option>
          {AGAMA_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label} htmlFor="alamat">Alamat</label>
        <textarea id="alamat" className={styles.textarea} rows={3} {...form.field('alamat')} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="foto">URL Foto</label>
        <input id="foto" className={styles.input} type="url" placeholder="https://..." {...form.field('foto')} />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Siswa' : 'Tambah Siswa'}
      onBack={() => navigate(-1)}
      onCancel={() => navigate(-1)}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      serverError={serverError}
      tabs={[{ id: 'form', label: 'Data Siswa', content: formContent }]}
    />
  )
}
