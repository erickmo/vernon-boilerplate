import { useState, useEffect } from 'react'
import { Modal } from '@/widgets/Modal'
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
  const [ownerNama, setOwnerNama] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
        await organisasiService.create({
          nama: nama.trim(),
          jenis_organisasi: jenis || undefined,
          email: email || undefined,
          telepon: telepon || undefined,
          owner_nama: ownerNama.trim() || undefined,
          owner_email: ownerEmail.trim() || undefined,
          owner_password: ownerPassword || undefined,
        })
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
  const formId = 'yayasan-modal-form'

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
        {mode === 'create' && (
          <>
            <div className={styles.formSectionDivider}>
              <span className={styles.formSectionLabel}>Akun Pemilik</span>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Nama Pemilik</label>
              <input
                className={styles.formInput}
                type="text"
                value={ownerNama}
                onChange={(e) => setOwnerNama(e.target.value)}
                placeholder="Budi Santoso"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Email Pemilik</label>
              <input
                className={styles.formInput}
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="pemilik@yayasan.sch.id"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  className={styles.formInput}
                  type={showPassword ? 'text' : 'password'}
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          </>
        )}
        {error && <p className={styles.formError}>{error}</p>}
      </form>
    </Modal>
  )
}
