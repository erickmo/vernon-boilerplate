// src/pages/sekolah/akademik/JadwalDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { jadwalService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type { JadwalPelajaran, SlotJadwal } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

// ─── Slot Jadwal tab ─────────────────────────────────────────────────────────

function SlotJadwalTab({ slots }: { slots: SlotJadwal[] }) {
  const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const sorted = [...slots].sort(
    (a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari),
  )

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Hari</th>
            <th>Jam</th>
            <th>Mata Pelajaran</th>
            <th>Guru</th>
            <th>Ruangan</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Belum ada slot jadwal
              </td>
            </tr>
          )}
          {sorted.map((slot) => (
            <tr key={slot.id}>
              <td>{slot.hari}</td>
              <td>{slot.jam_mulai} – {slot.jam_selesai}</td>
              <td>{slot.mata_pelajaran_nama}</td>
              <td>{slot.guru_nama}</td>
              <td>{slot.ruangan ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Info tab ────────────────────────────────────────────────────────────────

function InfoJadwalTab({ jadwal }: { jadwal: JadwalPelajaran }) {
  return (
    <div className={styles.fields}>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Rombongan Belajar</span>
          <strong>{jadwal.rombel_nama}</strong>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Tahun Ajaran</span>
          <strong>{jadwal.tahun_ajaran}</strong>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Semester</span>
          <strong>{jadwal.semester}</strong>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Jumlah Slot</span>
          <strong>{jadwal.jumlah_slot}</strong>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function JadwalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: jadwal, isLoading, error } = useQuery<JadwalPelajaran>({
    queryKey: ['jadwal-pelajaran', id],
    queryFn: () => jadwalService.getById(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => jadwalService.delete(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jadwal-pelajaran'] })
      toast.success('Jadwal berhasil dihapus')
      navigate('/sekolah/akademik/jadwal')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus jadwal')
    },
  })

  if (isLoading) return <div style={{ padding: 32 }}>Memuat...</div>
  if (error || !jadwal) return <div style={{ padding: 32 }}>Data tidak ditemukan</div>

  return (
    <DetailPageTemplate
      title={`Jadwal — ${jadwal.rombel_nama}`}
      code={`${jadwal.tahun_ajaran} / ${jadwal.semester}`}
      onBack={() => navigate('/sekolah/akademik/jadwal')}
      tabs={[
        {
          id: 'info',
          label: 'Info Jadwal',
          content: <InfoJadwalTab jadwal={jadwal} />,
        },
        {
          id: 'slot',
          label: 'Slot Jadwal',
          content: <SlotJadwalTab slots={(jadwal as JadwalPelajaran & { slot_jadwal?: SlotJadwal[] }).slot_jadwal ?? []} />,
        },
        {
          id: 'override',
          label: 'Override',
          content: (
            <div style={{ padding: 24, color: 'var(--color-text-muted)' }}>
              Belum ada jadwal override untuk periode ini.
            </div>
          ),
        },
      ]}
      actions={[
        {
          label: 'Edit',
          icon: <Edit size={14} />,
          onClick: () => navigate(`/sekolah/akademik/jadwal/${id}/edit`),
          variant: 'primary',
        },
        {
          label: 'Hapus',
          icon: <Trash2 size={14} />,
          onClick: () => deleteMutation.mutate(),
          variant: 'danger',
        },
      ]}
    />
  )
}
