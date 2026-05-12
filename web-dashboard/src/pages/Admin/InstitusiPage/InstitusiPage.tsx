import { useState, useCallback, useEffect } from 'react'
import { ChevronRight, Building2, GraduationCap, BookOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import { organisasiService } from '@/services/organisasi.service'
import { sekolahService } from '@/services/sekolah.service'
import { jenjangService } from '@/services/jenjang.service'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { PageWrapper } from '@/widgets/PageWrapper/PageWrapper'
import { YayasanModal } from './YayasanModal'
import { SekolahModal } from './SekolahModal'
import { JenjangModal } from './JenjangModal'
import type { Organisasi, Sekolah, UnitJenjang, ModalState } from './types'
import styles from './InstitusiPage.module.css'

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  label,
  name,
  onClose,
  onConfirm,
}: {
  label: string
  name: string
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setDeleting(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus')
      setDeleting(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <div className={styles.modalHeader}>
          <h2 id="delete-modal-title" className={styles.modalTitle}>Hapus {label}</h2>
        </div>
        <div className={styles.confirmBody}>
          Yakin ingin menghapus <span className={styles.confirmName}>{name}</span>? Tindakan ini tidak dapat dibatalkan.
          {error && <p className={styles.formError} style={{ marginTop: 8 }}>{error}</p>}
        </div>
        <div className={styles.modalActions} style={{ padding: '0 var(--space-5) var(--space-5)' }}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Batal</button>
          <button
            type="button"
            className={`${styles.submitBtn} ${styles.submitBtnDanger}`}
            disabled={deleting}
            onClick={() => { void handleConfirm() }}
          >
            {deleting ? <span className={styles.spinner} /> : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Jenjang row ──────────────────────────────────────────────────────────────

function JenjangRow({
  jenjang,
  onEdit,
  onDelete,
}: {
  jenjang: UnitJenjang
  onEdit: (j: UnitJenjang) => void
  onDelete: (j: UnitJenjang) => void
}) {
  return (
    <div className={styles.jenjangRow}>
      <BookOpen size={13} className={styles.sekolahIcon} />
      <span className={styles.jenjangName}>{jenjang.nama}</span>
      <span className={styles.jenjangTingkat}>{jenjang.tingkat}</span>
      <div className={styles.rowActions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={(e) => { e.stopPropagation(); onEdit(jenjang) }}
          aria-label="Edit jenjang"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
          onClick={(e) => { e.stopPropagation(); onDelete(jenjang) }}
          aria-label="Hapus jenjang"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Sekolah node ─────────────────────────────────────────────────────────────

function SekolahNode({
  sekolah,
  onEdit,
  onDelete,
  onAddJenjang,
  onEditJenjang,
  onDeleteJenjang,
}: {
  sekolah: Sekolah
  onEdit: (s: Sekolah) => void
  onDelete: (s: Sekolah) => void
  onAddJenjang: (sekolahName: string) => void
  onEditJenjang: (j: UnitJenjang) => void
  onDeleteJenjang: (j: UnitJenjang) => void
}) {
  const [open, setOpen] = useState(false)
  const [jenjangList, setJenjangList] = useState<UnitJenjang[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const loadJenjang = useCallback(async () => {
    setLoading(true)
    try {
      const list = await jenjangService.listBySekolah(sekolah.name)
      setJenjangList(list)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [sekolah.name])

  function toggle() {
    if (!open && !loaded) {
      void loadJenjang()
    }
    setOpen((o) => !o)
  }

  return (
    <div className={styles.sekolahRow}>
      <div
        className={styles.sekolahHeader}
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') toggle() }}
      >
        <ChevronRight size={14} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
        <GraduationCap size={14} className={styles.sekolahIcon} />
        <span className={styles.sekolahName}>{sekolah.nama}</span>
        <span className={sekolah.status === 'Aktif' ? styles.badgeAktif : styles.badgeNonaktif}>
          {sekolah.status}
        </span>
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={(e) => { e.stopPropagation(); onAddJenjang(sekolah.name) }}
            aria-label="Tambah jenjang"
          >
            <Plus size={11} /> Jenjang
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); onEdit(sekolah) }}
            aria-label="Edit sekolah"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={(e) => { e.stopPropagation(); onDelete(sekolah) }}
            aria-label="Hapus sekolah"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.jenjangList}>
          {loading && <p className={styles.loadingChildren}>Memuat jenjang...</p>}
          {!loading && jenjangList.length === 0 && (
            <p className={styles.emptyChildren}>Belum ada jenjang</p>
          )}
          {!loading && jenjangList.map((j) => (
            <JenjangRow
              key={j.name}
              jenjang={j}
              onEdit={onEditJenjang}
              onDelete={onDeleteJenjang}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Yayasan node ─────────────────────────────────────────────────────────────

function YayasanNode({
  yayasan,
  onEdit,
  onDelete,
  onAddSekolah,
  onEditSekolah,
  onDeleteSekolah,
  onAddJenjang,
  onEditJenjang,
  onDeleteJenjang,
  refreshTrigger,
}: {
  yayasan: Organisasi
  onEdit: (y: Organisasi) => void
  onDelete: (y: Organisasi) => void
  onAddSekolah: (orgName: string) => void
  onEditSekolah: (s: Sekolah) => void
  onDeleteSekolah: (s: Sekolah) => void
  onAddJenjang: (sekolahName: string) => void
  onEditJenjang: (j: UnitJenjang) => void
  onDeleteJenjang: (j: UnitJenjang) => void
  refreshTrigger: number
}) {
  const [open, setOpen] = useState(false)
  const [sekolahList, setSekolahList] = useState<Sekolah[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const loadSekolah = useCallback(async () => {
    setLoading(true)
    try {
      const list = await sekolahService.listByOrganisasi(yayasan.name)
      setSekolahList(list)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [yayasan.name])

  useEffect(() => {
    if (open) {
      void loadSekolah()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  function toggle() {
    if (!open && !loaded) {
      void loadSekolah()
    }
    setOpen((o) => !o)
  }

  return (
    <div className={styles.yayasanRow}>
      <div
        className={styles.yayasanHeader}
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') toggle() }}
      >
        <ChevronRight size={15} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
        <Building2 size={15} className={styles.yayasanIcon} />
        <span className={styles.yayasanName}>{yayasan.nama}</span>
        {yayasan.jenis_organisasi && (
          <span className={styles.yayasanMeta}>{yayasan.jenis_organisasi}</span>
        )}
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={(e) => { e.stopPropagation(); onAddSekolah(yayasan.name) }}
            aria-label="Tambah sekolah"
          >
            <Plus size={11} /> Sekolah
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); onEdit(yayasan) }}
            aria-label="Edit yayasan"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={(e) => { e.stopPropagation(); onDelete(yayasan) }}
            aria-label="Hapus yayasan"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.sekolahList}>
          {loading && <p className={styles.loadingChildren}>Memuat sekolah...</p>}
          {!loading && sekolahList.length === 0 && (
            <p className={styles.emptyChildren}>Belum ada sekolah</p>
          )}
          {!loading && sekolahList.map((s) => (
            <SekolahNode
              key={s.name}
              sekolah={s}
              onEdit={onEditSekolah}
              onDelete={onDeleteSekolah}
              onAddJenjang={onAddJenjang}
              onEditJenjang={onEditJenjang}
              onDeleteJenjang={onDeleteJenjang}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstitusiPage() {
  const [yayasanList, setYayasanList] = useState<Organisasi[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [sekolahRefreshTrigger, setSekolahRefreshTrigger] = useState(0)

  const loadYayasan = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await organisasiService.list({ limit: 200 })
      setYayasanList(res.items)
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error('Gagal memuat data'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadYayasan() }, [loadYayasan])

  function closeModal() { setModal(null) }

  function afterYayasanSaved() {
    closeModal()
    void loadYayasan()
  }

  function afterSekolahSaved() {
    closeModal()
    setSekolahRefreshTrigger((n) => n + 1)
  }

  function afterJenjangSaved() {
    closeModal()
    setSekolahRefreshTrigger((n) => n + 1)
  }

  async function handleDeleteYayasan(yayasan: Organisasi) {
    await organisasiService.deleteByName(yayasan.name)
    closeModal()
    void loadYayasan()
  }

  async function handleDeleteSekolah(sekolah: Sekolah) {
    await sekolahService.deleteByName(sekolah.name)
    closeModal()
    setSekolahRefreshTrigger((n) => n + 1)
  }

  async function handleDeleteJenjang(jenjang: UnitJenjang) {
    await jenjangService.deleteByName(jenjang.name)
    closeModal()
    setSekolahRefreshTrigger((n) => n + 1)
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Institusi"
        subtitle="Kelola yayasan, sekolah, dan jenjang"
        actions={
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setModal({ type: 'yayasan-create' })}
          >
            <Plus size={16} />
            Tambah Yayasan
          </button>
        }
      />

      <PageWrapper isLoading={loading} error={loadError} onRetry={loadYayasan}>
        {yayasanList.length === 0 ? (
          <div className={styles.emptyPage}>
            <Building2 size={36} />
            <p>Belum ada yayasan. Mulai dengan menambahkan yang pertama.</p>
          </div>
        ) : (
          <div className={styles.tree}>
            {yayasanList.map((y) => (
              <YayasanNode
                key={y.name}
                yayasan={y}
                refreshTrigger={sekolahRefreshTrigger}
                onEdit={(yy) => setModal({ type: 'yayasan-edit', yayasan: yy })}
                onDelete={(yy) => setModal({ type: 'yayasan-delete', yayasan: yy })}
                onAddSekolah={(orgName) => setModal({ type: 'sekolah-create', organisasiName: orgName })}
                onEditSekolah={(s) => setModal({ type: 'sekolah-edit', sekolah: s })}
                onDeleteSekolah={(s) => setModal({ type: 'sekolah-delete', sekolah: s })}
                onAddJenjang={(sekolahName) => setModal({ type: 'jenjang-create', sekolahName })}
                onEditJenjang={(j) => setModal({ type: 'jenjang-edit', jenjang: j })}
                onDeleteJenjang={(j) => setModal({ type: 'jenjang-delete', jenjang: j })}
              />
            ))}
          </div>
        )}
      </PageWrapper>

      {modal?.type === 'yayasan-create' && (
        <YayasanModal mode="create" onClose={closeModal} onSaved={afterYayasanSaved} />
      )}
      {modal?.type === 'yayasan-edit' && (
        <YayasanModal mode="edit" initial={modal.yayasan} onClose={closeModal} onSaved={afterYayasanSaved} />
      )}
      {modal?.type === 'yayasan-delete' && (
        <DeleteConfirmModal
          label="Yayasan"
          name={modal.yayasan.nama}
          onClose={closeModal}
          onConfirm={() => handleDeleteYayasan(modal.yayasan)}
        />
      )}

      {modal?.type === 'sekolah-create' && (
        <SekolahModal mode="create" organisasiName={modal.organisasiName} onClose={closeModal} onSaved={afterSekolahSaved} />
      )}
      {modal?.type === 'sekolah-edit' && (
        <SekolahModal mode="edit" initial={modal.sekolah} onClose={closeModal} onSaved={afterSekolahSaved} />
      )}
      {modal?.type === 'sekolah-delete' && (
        <DeleteConfirmModal
          label="Sekolah"
          name={modal.sekolah.nama}
          onClose={closeModal}
          onConfirm={() => handleDeleteSekolah(modal.sekolah)}
        />
      )}

      {modal?.type === 'jenjang-create' && (
        <JenjangModal mode="create" sekolahName={modal.sekolahName} onClose={closeModal} onSaved={afterJenjangSaved} />
      )}
      {modal?.type === 'jenjang-edit' && (
        <JenjangModal mode="edit" initial={modal.jenjang} onClose={closeModal} onSaved={afterJenjangSaved} />
      )}
      {modal?.type === 'jenjang-delete' && (
        <DeleteConfirmModal
          label="Jenjang"
          name={modal.jenjang.nama}
          onClose={closeModal}
          onConfirm={() => handleDeleteJenjang(modal.jenjang)}
        />
      )}
    </div>
  )
}
