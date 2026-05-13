import { useState, useEffect } from 'react'
import { Modal } from '@/widgets/Modal'
import { sekolahService } from '@/services/sekolah.service'
import type { Sekolah } from './types'
import styles from './InstitusiPage.module.css'

interface Props {
  mode: 'create' | 'edit'
  organisasiName?: string
  initial?: Sekolah
  onClose: () => void
  onSaved: () => void
}

export function SekolahModal({ mode, organisasiName, initial, onClose, onSaved }: Props) {
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>(initial?.status ?? 'Aktif')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) {
      setNama(initial.nama)
      setStatus(initial.status)
    }
  }, [initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { setError('Nama wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      if (mode === 'create' && organisasiName) {
        await sekolahService.create({ nama: nama.trim(), organisasi: organisasiName, status })
      } else if (initial) {
        await sekolahService.update(initial.name, { nama: nama.trim(), status })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const title = mode === 'create' ? 'Tambah Sekolah' : 'Edit Sekolah'
  const formId = 'sekolah-modal-form'

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Batal</button>
          <button type="submit" form={formId} className={styles.submitBtn} disabled={saving}>
            {saving ? <span className={styles.spinner} /> : 'Simpan'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={(e) => { void handleSubmit(e) }} className={styles.modalForm}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Nama Sekolah</label>
          <input className={styles.formInput} type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="SDN Maju Jaya" required />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Status</label>
          <select className={styles.formSelect} value={status} onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Nonaktif')}>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
        {error && <p className={styles.formError}>{error}</p>}
      </form>
    </Modal>
  )
}
