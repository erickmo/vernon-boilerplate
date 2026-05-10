// src/pages/sekolah/akademik/RaportDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { raportService } from '@/services/sekolah/akademik.service'
import type { Raport, RaportMapel } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

// ─── Info Raport tab ─────────────────────────────────────────────────────────

function InfoRaportTab({ raport }: { raport: Raport }) {
  return (
    <div className={styles.fields}>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Nama Siswa</span>
          <strong>{raport.siswa_nama}</strong>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>NIS</span>
          <strong>{raport.nis}</strong>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Rombongan Belajar</span>
          <strong>{raport.rombel_nama}</strong>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Semester</span>
          <strong>{raport.semester}</strong>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Tahun Ajaran</span>
          <strong>{raport.tahun_ajaran}</strong>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Rata-rata</span>
          <strong>{raport.rata_rata.toFixed(2)}</strong>
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Status</span>
        <strong>{raport.status}</strong>
      </div>
    </div>
  )
}

// ─── Nilai per Mapel tab ─────────────────────────────────────────────────────

function NilaiMapelTab({ mapel }: { mapel: RaportMapel[] }) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mata Pelajaran</th>
            <th>KKM</th>
            <th>Nilai Akhir</th>
            <th>Predikat</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          {mapel.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Belum ada data nilai
              </td>
            </tr>
          )}
          {mapel.map((m) => (
            <tr key={m.id}>
              <td>{m.mata_pelajaran_nama}</td>
              <td>{m.kkm}</td>
              <td style={{ fontWeight: m.nilai_akhir < m.kkm ? 600 : undefined, color: m.nilai_akhir < m.kkm ? 'var(--color-danger)' : undefined }}>
                {m.nilai_akhir}
              </td>
              <td>{m.predikat}</td>
              <td>{m.catatan ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RaportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: raport, isLoading, error } = useQuery<Raport>({
    queryKey: ['raport', id],
    queryFn: () => raportService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div style={{ padding: 32 }}>Memuat...</div>
  if (error || !raport) return <div style={{ padding: 32 }}>Data raport tidak ditemukan</div>

  return (
    <DetailPageTemplate
      title={raport.siswa_nama}
      code={raport.nis}
      onBack={() => navigate('/sekolah/akademik/raport')}
      badges={
        <span
          style={{
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            background: raport.status === 'Diterbitkan'
              ? 'var(--color-success-light)'
              : raport.status === 'Final'
              ? 'var(--color-warning-light)'
              : 'var(--color-surface-alt)',
            color: raport.status === 'Diterbitkan'
              ? 'var(--color-success)'
              : raport.status === 'Final'
              ? 'var(--color-warning)'
              : 'var(--color-text-secondary)',
          }}
        >
          {raport.status}
        </span>
      }
      tabs={[
        {
          id: 'info',
          label: 'Info Raport',
          content: <InfoRaportTab raport={raport} />,
        },
        {
          id: 'nilai',
          label: 'Nilai per Mapel',
          content: <NilaiMapelTab mapel={raport.mapel} />,
        },
      ]}
      actions={[]}
    />
  )
}
