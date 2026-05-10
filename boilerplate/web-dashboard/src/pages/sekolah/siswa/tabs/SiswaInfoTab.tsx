import type { Siswa } from '@/types/sekolah/siswa.types'
import styles from './SiswaTab.module.css'

interface Props {
  siswa: Siswa
}

export function SiswaInfoTab({ siswa }: Props) {
  const fields: { label: string; value: string | undefined }[] = [
    { label: 'NIS', value: siswa.nis },
    { label: 'Nama Lengkap', value: siswa.nama_lengkap },
    { label: 'Tempat Lahir', value: siswa.tempat_lahir },
    { label: 'Tanggal Lahir', value: siswa.tanggal_lahir },
    { label: 'Jenis Kelamin', value: siswa.jenis_kelamin },
    { label: 'Agama', value: siswa.agama },
    { label: 'Status', value: siswa.status },
    { label: 'Rombel Aktif', value: siswa.rombel_aktif ?? '—' },
    { label: 'Tahun Ajaran', value: siswa.tahun_ajaran_aktif ?? '—' },
    { label: 'Alamat', value: siswa.alamat },
  ]

  return (
    <div className={styles.infoGrid}>
      {fields.map(({ label, value }) => (
        <div key={label} className={styles.fieldRow}>
          <span className={styles.fieldLabel}>{label}</span>
          <span className={styles.fieldValue}>{value ?? '—'}</span>
        </div>
      ))}
      {siswa.foto && (
        <div className={styles.fotoRow}>
          <span className={styles.fieldLabel}>Foto</span>
          <img src={siswa.foto} alt={siswa.nama_lengkap} className={styles.foto} />
        </div>
      )}
    </div>
  )
}
