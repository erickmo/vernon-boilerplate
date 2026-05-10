import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { useAuthStore } from '@/stores/auth.store'
import styles from './DashboardPage.module.css'

type MetricTone = 'teal' | 'green' | 'amber'

interface Metric {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone: MetricTone
}

interface Task {
  title: string
  description: string
  icon: LucideIcon
}

interface Activity {
  title: string
  description: string
  time: string
}

const metrics: Metric[] = [
  {
    label: 'Pengguna aktif',
    value: '84',
    helper: '12 orang kembali aktif minggu ini',
    icon: HeartHandshake,
    tone: 'teal',
  },
  {
    label: 'Tugas terbantu',
    value: '320',
    helper: 'Mayoritas selesai tanpa eskalasi',
    icon: CheckCircle2,
    tone: 'green',
  },
  {
    label: 'Perlu perhatian',
    value: '7',
    helper: 'Menunggu bantuan admin',
    icon: ShieldCheck,
    tone: 'amber',
  },
]

const tasks: Task[] = [
  {
    title: 'Rapikan data produk',
    description: 'Lengkapi kategori dan produk agar laporan tim tetap mudah dipercaya.',
    icon: Database,
  },
  {
    title: 'Review audit terbaru',
    description: 'Bantu tim memahami perubahan penting sebelum mereka menjadi hambatan.',
    icon: ClipboardCheck,
  },
  {
    title: 'Undang rekan kerja',
    description: 'Berikan akses ke orang yang membutuhkan konteks untuk bekerja mandiri.',
    icon: UserPlus,
  },
]

const activities: Activity[] = [
  {
    title: 'Audit perubahan kategori selesai direview',
    description: 'Tidak ada tindakan lanjutan. Catatan sudah tersedia untuk tim produk.',
    time: '12 menit lalu',
  },
  {
    title: '3 data produk menunggu kelengkapan',
    description: 'Prioritas rendah, tetapi akan meningkatkan akurasi laporan mingguan.',
    time: '35 menit lalu',
  },
  {
    title: 'Akses operator baru sudah aktif',
    description: 'Mereka dapat mulai mengelola data perusahaan hari ini.',
    time: '1 jam lalu',
  },
]

function MetricCard({ label, value, helper, icon: Icon, tone }: Metric) {
  return (
    <section className={styles.metricCard} aria-label={label}>
      <span className={`${styles.metricIcon} ${styles[`metricIcon_${tone}`]}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <p className={styles.metricLabel}>{label}</p>
        <p className={styles.metricValue}>{value}</p>
        <p className={styles.metricHelper}>{helper}</p>
      </div>
    </section>
  )
}

function NextActionCard() {
  return (
    <section className={`${styles.panel} ${styles.nextAction}`}>
      <div className={styles.panelHeader}>
        <span className={styles.panelIcon}>
          <HeartHandshake size={18} aria-hidden="true" />
        </span>
        <div>
          <p className={styles.panelEyebrow}>Next best action</p>
          <h2 className={styles.panelTitle}>Prioritas yang perlu dibantu</h2>
        </div>
      </div>
      <p className={styles.nextActionText}>
        Ada 7 approval yang menunggu keputusan. Mulai dari item yang berdampak ke jadwal tim,
        lalu tinggalkan catatan singkat agar pemilik tugas tahu alasannya.
      </p>
      <button className={styles.primaryButton} type="button">
        Review pending approvals
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </section>
  )
}

function ProgressPanel() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelIcon}>
          <Sparkles size={18} aria-hidden="true" />
        </span>
        <div>
          <p className={styles.panelEyebrow}>Readiness</p>
          <h2 className={styles.panelTitle}>Kesiapan workspace</h2>
        </div>
      </div>
      <div className={styles.progressMeta}>
        <span>6 dari 8 langkah sudah selesai</span>
        <strong>76%</strong>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressFill} />
      </div>
      <p className={styles.panelNote}>
        Workspace sudah cukup siap untuk operasional harian. Lengkapi dua langkah tersisa saat tim
        sudah punya waktu.
      </p>
    </section>
  )
}

function TaskCard({ title, description, icon: Icon }: Task) {
  return (
    <article className={styles.taskCard}>
      <span className={styles.taskIcon}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <h3 className={styles.taskTitle}>{title}</h3>
        <p className={styles.taskDescription}>{description}</p>
      </div>
    </article>
  )
}

function ActivityItem({ title, description, time }: Activity) {
  return (
    <li className={styles.activityItem}>
      <span className={styles.activityDot} aria-hidden="true" />
      <div>
        <p className={styles.activityTitle}>{title}</p>
        <p className={styles.activityDescription}>{description}</p>
      </div>
      <time className={styles.activityTime}>{time}</time>
    </li>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className={`${styles.dashboard} animate-page-in`}>
      <PageHeader
        title={`Selamat Datang, ${user?.name ?? 'User'}`}
        subtitle="Mulai dari hal yang paling membantu tim Anda hari ini."
      />

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Guided workspace</p>
          <h2 className={styles.heroText}>Bantu tim bergerak dengan jelas, tenang, dan terarah.</h2>
          <p className={styles.heroDescription}>
            Dashboard ini menyorot bantuan yang paling berguna lebih dulu, lalu menyimpan metrik
            pendukung tetap dekat untuk keputusan cepat.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.primaryButton} type="button">
            Lihat prioritas
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button className={styles.secondaryButton} type="button">
            Buka audit log
          </button>
        </div>
      </section>

      <section className={styles.metricGrid} aria-label="Ringkasan workspace">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <NextActionCard />

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>
                <ClipboardCheck size={18} aria-hidden="true" />
              </span>
              <div>
                <p className={styles.panelEyebrow}>Recent context</p>
                <h2 className={styles.panelTitle}>Aktivitas terbaru</h2>
              </div>
            </div>
            <ul className={styles.activityList}>
              {activities.map((activity) => (
                <ActivityItem key={activity.title} {...activity} />
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.sideColumn} aria-label="Panduan workspace">
          <ProgressPanel />

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>
                <HeartHandshake size={18} aria-hidden="true" />
              </span>
              <div>
                <p className={styles.panelEyebrow}>Support paths</p>
                <h2 className={styles.panelTitle}>Cara membantu tim</h2>
              </div>
            </div>
            <div className={styles.taskGrid}>
              {tasks.map((task) => (
                <TaskCard key={task.title} {...task} />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
