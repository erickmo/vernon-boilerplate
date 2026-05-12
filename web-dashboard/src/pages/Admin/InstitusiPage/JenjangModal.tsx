import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { jenjangService } from '@/services/jenjang.service'
import { TINGKAT_OPTIONS, type Tingkat } from './types'
import type { UnitJenjang } from './types'
import styles from './InstitusiPage.module.css'

interface Props {
  mode: 'create' | 'edit'
  sekolahName?: string
  initial?: UnitJenjang
  onClose: () => void
  onSaved: () => void
}

export function JenjangModal({ mode, sekolahName, initial, onClose, onSaved }: Props) {
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [tingkat, setTingkat] = useState<Tingkat>(initial?.tingkat as Tingkat ?? TINGKAT_OPTIONS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) {
      setNama(initial.nama)
      setTingkat(initial.tingkat)
    }
  }, [initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { setError('Nama wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      if (mode === 'create' && sekolahName) {
        await jenjangService.create({ nama: nama.trim(), sekolah: sekolahName, tingkat })
      } else if (initial) {
        await jenjangService.update(initial.name, { nama: nama.trim(), tingkat })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const title = mode === 'create' ? 'Tambah Jenjang' : 'Edit Jenjang'

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="jenjang-modal-title">
        <div className={styles.modalHeader}>
          <h2 id="jenjang-modal-title" className={styles.modalTitle}>{title}</h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Tutup"><X size={16} /></button>
        </div>
        <form onSubmit={(e) => { void handleSubmit(e) }} className={styles.modalForm}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Nama Unit</label>
            <input className={styles.formInput} type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Unit SD" required />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Tingkat</label>
            <select className={styles.formSelect} value={tingkat} onChange={(e) => setTingkat(e.target.value as Tingkat)}>
              {TINGKAT_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
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
