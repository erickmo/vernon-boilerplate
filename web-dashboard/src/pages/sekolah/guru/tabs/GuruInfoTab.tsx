import type { Guru } from '@/types/sekolah/guru.types'
import styles from './GuruTab.module.css'

interface Props {
  guru: Guru
}

export function GuruInfoTab({ guru }: Props) {
  const fields: { label: string; value: string | undefined }[] = [
    { label: 'NIP', value: guru.nip },
    { label: 'Nama', value: guru.nama },
    { label: 'Mata Pelajaran', value: guru.mata_pelajaran },
    { label: 'Status', value: guru.status },
    { label: 'Jenis Kelamin', value: guru.jenis_kelamin },
    { label: 'Tanggal Lahir', value: guru.tanggal_lahir },
    { label: 'No. Telepon', value: guru.no_telepon },
    { label: 'Email', value: guru.email },
    { label: 'Alamat', value: guru.alamat },
  ]

  return (
    <div className={styles.infoGrid}>
      {fields.map(({ label, value }) => (
        <div key={label} className={styles.fieldRow}>
          <span className={styles.fieldLabel}>{label}</span>
          <span className={styles.fieldValue}>{value ?? '—'}</span>
        </div>
      ))}
      {guru.foto && (
        <div className={styles.fotoRow}>
          <span className={styles.fieldLabel}>Foto</span>
          <img src={guru.foto} alt={guru.nama} className={styles.foto} />
        </div>
      )}
    </div>
  )
}
