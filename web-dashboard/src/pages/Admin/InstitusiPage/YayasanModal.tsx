import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { organisasiService } from '@/services/organisasi.service'
import type { Organisasi } from './types'
import styles from './InstitusiPage.module.css'

interface Props {
  mode: 'create' | 'edit'
  initial?: Organisasi
  onClose: () => void
  onSaved: () => void
}

export function YayasanModal({ mode, initial, onClose, onSaved }: Props) {
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [jenis, setJenis] = useState(initial?.jenis_organisasi ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [telepon, setTelepon] = useState(initial?.telepon ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) {
      setNama(initial.nama)
      setJenis(initial.jenis_organisasi ?? '')
      setEmail(initial.email ?? '')
      setTelepon(initial.telepon ?? '')
    }
  }, [initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { setError('Nama wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      if (mode === 'create') {
        await organisasiService.create({ nama: nama.trim(), jenis_organisasi: jenis || undefined, email: email || undefined, telepon: telepon || undefined })
      } else if (initial) {
        await organisasiService.update(initial.name, { nama: nama.trim(), jenis_organisasi: jenis || undefined, email: email || undefined, telepon: telepon || undefined })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const title = mode === 'create' ? 'Tambah Yayasan' : 'Edit Yayasan'

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="yayasan-modal-title">
        <div className={styles.modalHeader}>
          <h2 id="yayasan-modal-title" className={styles.modalTitle}>{title}</h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Tutup"><X size={16} /></button>
        </div>
        <form onSubmit={(e) => { void handleSubmit(e) }} className={styles.modalForm}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Nama Yayasan / Organisasi</label>
            <input className={styles.formInput} type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Yayasan Pendidikan Al-Falah" required />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Jenis Organisasi</label>
            <input className={styles.formInput} type="text" value={jenis} onChange={(e) => setJenis(e.target.value)} placeholder="Yayasan / Yayasan Pendidikan" />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Email</label>
            <input className={styles.formInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@yayasan.sch.id" />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Telepon</label>
            <input className={styles.formInput} type="tel" value={telepon} onChange={(e) => setTelepon(e.target.value)} placeholder="021-12345678" />
          </div>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? <span className={styles.spinner} /> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
