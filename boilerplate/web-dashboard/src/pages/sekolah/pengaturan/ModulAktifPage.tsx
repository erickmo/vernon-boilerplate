// src/pages/sekolah/pengaturan/ModulAktifPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { getModulAktif, updateModulAktif } from '@/services/sekolah/pengaturan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { ModulAktif } from '@/types/sekolah/pengaturan.types'
import styles from './ModulAktifPage.module.css'

type ModulKey = keyof Omit<ModulAktif, 'id' | 'updated_at'>

const MODUL_LIST: { key: ModulKey; label: string; description: string }[] = [
  { key: 'akademik',     label: 'Akademik',     description: 'Jadwal, absensi, penilaian, dan raport siswa' },
  { key: 'perpustakaan', label: 'Perpustakaan', description: 'Katalog buku, peminjaman, dan sirkulasi perpustakaan' },
  { key: 'koperasi',     label: 'Koperasi',     description: 'Simpanan, pembiayaan, dan kartu anggota koperasi' },
  { key: 'absensi',      label: 'Absensi',      description: 'Rekap dan laporan absensi siswa dan guru' },
  { key: 'raport',       label: 'Raport',       description: 'Cetak dan distribusi raport per semester' },
]

export function ModulAktifPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<Partial<ModulAktif>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: modulAktif, isLoading } = useQuery({
    queryKey: ['modul-aktif'],
    queryFn: getModulAktif,
  })

  useEffect(() => {
    if (modulAktif) setForm(modulAktif)
  }, [modulAktif])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      await updateModulAktif(form)
      await queryClient.invalidateQueries({ queryKey: ['modul-aktif'] })
      toast.success('Pengaturan modul berhasil disimpan')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan modul')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p>Memuat pengaturan modul...</p>

  return (
    <FormPageTemplate
      title="Modul Aktif"
      onBack={() => navigate(-1)}
      backLabel="Pengaturan"
      tabs={[{
        id: 'form',
        label: 'Pengaturan Modul',
        content: (
          <div className={styles.modulList}>
            {MODUL_LIST.map(({ key, label, description }) => (
              <div key={key} className={styles.modulRow}>
                <div className={styles.modulInfo}>
                  <span className={styles.modulLabel}>{label}</span>
                  <span className={styles.modulDesc}>{description}</span>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={!!(form as Record<string, unknown>)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            ))}
          </div>
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      isSubmitting={isSubmitting}
      submitLabel="Simpan Pengaturan"
      serverError={serverError}
    />
  )
}

export default ModulAktifPage
