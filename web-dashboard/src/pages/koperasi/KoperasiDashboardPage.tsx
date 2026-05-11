import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { anggotaKoperasiService } from '@/services/koperasi/anggota-koperasi.service'
import { rekeningSimapnanService, transaksiSimpananService, permohonanSimpananService } from '@/services/koperasi/simpanan.service'
import { akadPembiayaanService, jadwalAngsuranService } from '@/services/koperasi/pembiayaan.service'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import { useAuthStore } from '@/stores/auth.store'
import styles from './KoperasiDashboardPage.module.css'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  to?: string
  loading?: boolean
}

function StatCard({ label, value, hint, to, loading }: StatCardProps) {
  const body = (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{loading ? '…' : value}</p>
      {hint && <p className={styles.statHint}>{hint}</p>}
    </div>
  )
  return to ? <Link to={to} className={styles.statLink}>{body}</Link> : body
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso?: string): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export function KoperasiDashboardPage() {
  const user = useAuthStore((s) => s.user)

  const anggotaQ = useQuery({
    queryKey: ['koperasi-dashboard', 'anggota-count'],
    queryFn: () => anggotaKoperasiService.list({ limit: 1 }),
  })
  const rekeningQ = useQuery({
    queryKey: ['koperasi-dashboard', 'rekening-count'],
    queryFn: () => rekeningSimapnanService.list({ limit: 1 }),
  })
  const akadQ = useQuery({
    queryKey: ['koperasi-dashboard', 'akad-count'],
    queryFn: () => akadPembiayaanService.list({ limit: 1 }),
  })
  const sesiQ = useQuery({
    queryKey: ['koperasi-dashboard', 'sesi-count'],
    queryFn: () => sesiKasTellerService.list({ limit: 1 }),
  })

  const permohonanPendingCountQ = useQuery({
    queryKey: ['koperasi-dashboard', 'permohonan-pending-count'],
    queryFn: () =>
      permohonanSimpananService.list({
        limit: 1,
        filters: [['status', '=', 'Diajukan']],
      }),
  })
  const akadPendingCountQ = useQuery({
    queryKey: ['koperasi-dashboard', 'akad-pending-count'],
    queryFn: () =>
      akadPembiayaanService.list({
        limit: 1,
        filters: [['status', '=', 'Pengajuan']],
      }),
  })

  const totalPending =
    (permohonanPendingCountQ.data?.total ?? 0) + (akadPendingCountQ.data?.total ?? 0)
  const pendingLoading = permohonanPendingCountQ.isLoading || akadPendingCountQ.isLoading

  const jadwalDueQ = useQuery({
    queryKey: ['koperasi-dashboard', 'jadwal-due'],
    queryFn: () =>
      jadwalAngsuranService.list({
        limit: 8,
        sort: [['tanggal_jatuh_tempo', 1]],
        filters: [['status_bayar', '=', 'Belum']],
      }),
  })

  const transaksiRecentQ = useQuery({
    queryKey: ['koperasi-dashboard', 'transaksi-recent'],
    queryFn: () => transaksiSimpananService.list({ limit: 5, sort: [['creation', -1]] }),
  })
  const permohonanPendingQ = useQuery({
    queryKey: ['koperasi-dashboard', 'permohonan-pending'],
    queryFn: () => permohonanSimpananService.list({ limit: 5, sort: [['creation', -1]] }),
  })

  return (
    <div className="animate-page-in">
      <PageHeader
        title={`Selamat Datang, ${user?.name ?? 'User'}`}
        subtitle="Ringkasan koperasi sekolah"
      />

      <div className={styles.statsGrid}>
        <StatCard
          label="Menunggu Persetujuan"
          value={totalPending}
          hint={totalPending > 0 ? 'Klik untuk meninjau' : 'Tidak ada antrian'}
          loading={pendingLoading}
          to="/koperasi/persetujuan"
        />
        <StatCard
          label="Total Anggota Koperasi"
          value={anggotaQ.data?.total ?? 0}
          loading={anggotaQ.isLoading}
          to="/koperasi/anggota/anggota-koperasi"
        />
        <StatCard
          label="Rekening Simpanan"
          value={rekeningQ.data?.total ?? 0}
          loading={rekeningQ.isLoading}
          to="/koperasi/simpanan/rekening"
        />
        <StatCard
          label="Akad Pembiayaan"
          value={akadQ.data?.total ?? 0}
          loading={akadQ.isLoading}
          to="/koperasi/pembiayaan/akad"
        />
        <StatCard
          label="Sesi Kas Teller"
          value={sesiQ.data?.total ?? 0}
          loading={sesiQ.isLoading}
          to="/koperasi/kas-teller/sesi"
        />
      </div>

      <div className={styles.quickActions}>
        <Link to="/koperasi/kas-teller/sesi/new" className={styles.quickActionBtn}>+ Buka Sesi Kas</Link>
        <Link to="/koperasi/simpanan/permohonan/new" className={styles.quickActionBtn}>+ Permohonan Simpanan</Link>
        <Link to="/koperasi/pembiayaan/akad/new" className={styles.quickActionBtn}>+ Akad Pembiayaan</Link>
        <Link to="/koperasi/anggota/nasabah/new" className={styles.quickActionBtn}>+ Nasabah Baru</Link>
      </div>

      <section className={styles.card} style={{ marginBottom: 'var(--space-4)' }}>
        <header className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Jadwal Angsuran Mendekati Jatuh Tempo</h2>
          <Link to="/koperasi/pembiayaan/pembayaran" className={styles.cardLink}>Catat pembayaran</Link>
        </header>
        {jadwalDueQ.isLoading && <p className={styles.muted}>Memuat…</p>}
        {jadwalDueQ.error && <p className={styles.error}>Gagal memuat jadwal</p>}
        {jadwalDueQ.data && jadwalDueQ.data.items.length === 0 && (
          <p className={styles.muted}>Tidak ada angsuran belum lunas</p>
        )}
        {jadwalDueQ.data && jadwalDueQ.data.items.length > 0 && (
          <ul className={styles.list}>
            {jadwalDueQ.data.items.map((j) => {
              const due = new Date(j.tanggal_jatuh_tempo).getTime()
              const overdue = !Number.isNaN(due) && due < Date.now()
              return (
                <li key={j.id} className={styles.listItem}>
                  <div>
                    <p className={styles.itemTitle}>Akad {j.akad_id} — Angsuran #{j.no_angsuran}</p>
                    <p className={styles.itemMeta}>
                      Jatuh tempo {formatDate(j.tanggal_jatuh_tempo)}
                      {overdue && <span className={styles.overdueBadge}> Terlambat</span>}
                    </p>
                  </div>
                  <p className={styles.itemAmount}>{formatRupiah(j.total)}</p>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Transaksi Simpanan Terbaru</h2>
            <Link to="/koperasi/simpanan/transaksi" className={styles.cardLink}>Lihat semua</Link>
          </header>
          {transaksiRecentQ.isLoading && <p className={styles.muted}>Memuat…</p>}
          {transaksiRecentQ.error && <p className={styles.error}>Gagal memuat data</p>}
          {transaksiRecentQ.data && transaksiRecentQ.data.items.length === 0 && (
            <p className={styles.muted}>Belum ada transaksi</p>
          )}
          {transaksiRecentQ.data && transaksiRecentQ.data.items.length > 0 && (
            <ul className={styles.list}>
              {transaksiRecentQ.data.items.map((t) => {
                const item = t as unknown as Record<string, unknown>
                const tanggal = (item.tanggal as string) ?? (item.creation as string)
                const jenis = (item.jenis_transaksi as string) ?? '-'
                const nominal = Number(item.nominal ?? 0)
                const rekening = (item.rekening as string) ?? '-'
                return (
                  <li key={(item.name as string) ?? Math.random()} className={styles.listItem}>
                    <div>
                      <p className={styles.itemTitle}>{jenis} — {rekening}</p>
                      <p className={styles.itemMeta}>{formatDate(tanggal)}</p>
                    </div>
                    <p className={styles.itemAmount}>{formatRupiah(nominal)}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Permohonan Terbaru</h2>
            <Link to="/koperasi/simpanan/permohonan" className={styles.cardLink}>Lihat semua</Link>
          </header>
          {permohonanPendingQ.isLoading && <p className={styles.muted}>Memuat…</p>}
          {permohonanPendingQ.error && <p className={styles.error}>Gagal memuat data</p>}
          {permohonanPendingQ.data && permohonanPendingQ.data.items.length === 0 && (
            <p className={styles.muted}>Belum ada permohonan</p>
          )}
          {permohonanPendingQ.data && permohonanPendingQ.data.items.length > 0 && (
            <ul className={styles.list}>
              {permohonanPendingQ.data.items.map((p) => {
                const item = p as unknown as Record<string, unknown>
                const status = (item.status as string) ?? '-'
                const nasabah = (item.nasabah as string) ?? '-'
                const tanggal = (item.tanggal_permohonan as string) ?? (item.creation as string)
                return (
                  <li key={(item.name as string) ?? Math.random()} className={styles.listItem}>
                    <div>
                      <p className={styles.itemTitle}>{nasabah}</p>
                      <p className={styles.itemMeta}>{formatDate(tanggal)}</p>
                    </div>
                    <span className={styles.badge}>{status}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default KoperasiDashboardPage
