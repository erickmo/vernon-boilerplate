import { useState, useEffect, useMemo } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Modal } from '@/widgets/Modal'
import { organisasiService, fetchFrappeUsers } from '@/services/organisasi.service'
import type { FrappeUser } from '@/services/organisasi.service'
import type { Organisasi } from './types'
import styles from './InstitusiPage.module.css'

const FORM_ID = 'yayasan-modal-form'

const JENIS_OPTIONS = ['Yayasan', 'PT', 'Koperasi', 'Lainnya'] as const

type OwnerMode = 'pick' | 'create'

function translateError(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('repeat') || lower.includes('harder to guess') || lower.includes('avoid repeated')) {
    return 'Password terlalu mudah ditebak. Hindari pengulangan karakter yang sama (contoh: "abcabc").'
  }
  if (lower.includes('common') || lower.includes('top 1') || lower.includes('very common')) {
    return 'Password terlalu umum. Gunakan kombinasi huruf, angka, dan simbol yang lebih unik.'
  }
  if (lower.includes('short') || lower.includes('too short')) {
    return 'Password terlalu pendek. Gunakan minimal 8 karakter.'
  }
  if (lower.includes('sequence') || lower.includes('sequential') || lower.includes('keyboard')) {
    return 'Password tidak boleh berupa urutan karakter (seperti "123456" atau "abcdef").'
  }
  if (lower.includes('date') || lower.includes('year')) {
    return 'Password tidak boleh menggunakan format tanggal atau tahun.'
  }
  return msg
}

interface Props {
  mode: 'create' | 'edit'
  initial?: Organisasi
  onClose: () => void
  onSaved: () => void
}

export function YayasanModal({ mode, initial, onClose, onSaved }: Props) {
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [jenis, setJenis] = useState(initial?.jenis_organisasi ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Owner fields
  const [ownerMode, setOwnerMode] = useState<OwnerMode>('pick')
  const [users, setUsers] = useState<FrappeUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [ownerNama, setOwnerNama] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (initial) {
      setNama(initial.nama)
      setJenis(initial.jenis_organisasi ?? '')
    }
  }, [initial])

  useEffect(() => {
    if (mode !== 'create') return
    setUsersLoading(true)
    fetchFrappeUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false))
  }, [mode])

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase()
    if (!q) return users
    return users.filter(u =>
      u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [users, userSearch])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { setError('Nama wajib diisi'); return }
    if (mode === 'create' && ownerMode === 'pick' && !selectedUser) {
      setError('Pilih user pemilik'); return
    }
    setSaving(true)
    setError('')
    try {
      if (mode === 'create') {
        if (ownerMode === 'pick') {
          await organisasiService.create({
            nama: nama.trim(),
            jenis_organisasi: jenis || undefined,
            owner_user: selectedUser,
          })
        } else {
          await organisasiService.create({
            nama: nama.trim(),
            jenis_organisasi: jenis || undefined,
            owner_nama: ownerNama.trim() || undefined,
            owner_email: ownerEmail.trim() || undefined,
            owner_password: ownerPassword || undefined,
          })
        }
      } else if (initial) {
        await organisasiService.update(initial.name, {
          nama: nama.trim(),
          jenis_organisasi: jenis || undefined,
        })
      }
      onSaved()
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : 'Gagal menyimpan'))
    } finally {
      setSaving(false)
    }
  }

  const title = mode === 'create' ? 'Tambah Yayasan' : 'Edit Yayasan'

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Batal</button>
          <button type="submit" form={FORM_ID} className={styles.submitBtn} disabled={saving}>
            {saving ? <span className={styles.spinner} /> : 'Simpan'}
          </button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={(e) => { void handleSubmit(e) }} className={styles.modalForm}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Nama Yayasan / Organisasi</label>
          <input
            className={styles.formInput}
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Yayasan Pendidikan Al-Falah"
            required
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>Jenis Organisasi</label>
          <select
            className={styles.formSelect}
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
            required
          >
            <option value="">-- Pilih Jenis --</option>
            {JENIS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {mode === 'create' && (
          <>
            <div className={styles.formSectionDivider}>
              <span className={styles.formSectionLabel}>Akun Pemilik</span>
            </div>

            <div className={styles.formField}>
              <div className={styles.ownerModeToggle}>
                <button
                  type="button"
                  className={`${styles.ownerModeBtn} ${ownerMode === 'pick' ? styles.ownerModeBtnActive : ''}`}
                  onClick={() => setOwnerMode('pick')}
                >
                  Pilih User
                </button>
                <button
                  type="button"
                  className={`${styles.ownerModeBtn} ${ownerMode === 'create' ? styles.ownerModeBtnActive : ''}`}
                  onClick={() => setOwnerMode('create')}
                >
                  Buat User Baru
                </button>
              </div>
            </div>

            {ownerMode === 'pick' && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Cari User</label>
                <input
                  className={styles.userSearchInput}
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Nama atau email..."
                />
                {usersLoading ? (
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>Memuat...</p>
                ) : (
                  <select
                    className={styles.userSelect}
                    size={5}
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    {filteredUsers.map(u => (
                      <option key={u.name} value={u.name}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                    {filteredUsers.length === 0 && (
                      <option disabled value="">Tidak ada hasil</option>
                    )}
                  </select>
                )}
              </div>
            )}

            {ownerMode === 'create' && (
              <>
                <div className={styles.formField}>
                  <label htmlFor="owner-nama" className={styles.formLabel}>Nama Pemilik</label>
                  <input
                    id="owner-nama"
                    className={styles.formInput}
                    type="text"
                    value={ownerNama}
                    onChange={(e) => setOwnerNama(e.target.value)}
                    placeholder="Budi Santoso"
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="owner-email" className={styles.formLabel}>Email Pemilik</label>
                  <input
                    id="owner-email"
                    className={styles.formInput}
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="pemilik@yayasan.sch.id"
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="owner-password" className={styles.formLabel}>Password</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="owner-password"
                      className={styles.formInput}
                      type={showPassword ? 'text' : 'password'}
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="Minimal 8 karakter, kombinasi huruf dan angka"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {error && <p className={styles.formError}>{error}</p>}
      </form>
    </Modal>
  )
}
