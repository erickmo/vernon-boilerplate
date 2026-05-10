// src/pages/koperasi/anggota/tabs/NasabahInfoTab.tsx
import type { Nasabah } from '@/types/koperasi/anggota.types'
import styles from './NasabahTab.module.css'

interface Props {
  nasabah: Nasabah
}

export function NasabahInfoTab({ nasabah }: Props) {
  return (
    <div className={styles.fieldGrid}>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>Nama Lengkap</span>
        <span className={styles.fieldValue}>{nasabah.nama}</span>
      </div>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>NIK</span>
        <span className={styles.fieldValue}>{nasabah.nik}</span>
      </div>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>No. HP</span>
        <span className={styles.fieldValue}>{nasabah.no_hp}</span>
      </div>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>Jenis Kelamin</span>
        <span className={styles.fieldValue}>{nasabah.jenis_kelamin}</span>
      </div>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>Tanggal Lahir</span>
        <span className={styles.fieldValue}>
          {new Date(nasabah.tanggal_lahir).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>Status</span>
        <span
          className={`${styles.badge} ${
            nasabah.status === 'Aktif' ? styles.badgeActive : styles.badgeInactive
          }`}
        >
          {nasabah.status}
        </span>
      </div>
      <div className={`${styles.fieldItem} ${styles.fieldItemFull}`}>
        <span className={styles.fieldLabel}>Alamat</span>
        <span className={styles.fieldValue}>{nasabah.alamat}</span>
      </div>
      {nasabah.foto && (
        <div className={`${styles.fieldItem} ${styles.fieldItemFull}`}>
          <span className={styles.fieldLabel}>Foto</span>
          <img src={nasabah.foto} alt={nasabah.nama} className={styles.foto} />
        </div>
      )}
    </div>
  )
}
