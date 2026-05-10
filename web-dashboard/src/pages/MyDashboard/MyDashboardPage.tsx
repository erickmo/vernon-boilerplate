import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  Star,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { myDashboardService } from '@/services/my-dashboard.service'
import { QK } from '@/services/query-keys'
import { Skeleton } from '@/widgets/Skeleton/Skeleton'
import styles from './MyDashboardPage.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

type Tone = 'green' | 'teal' | 'amber' | 'red' | 'gray'

const TONE_COLORS: Record<Tone, string> = {
  green: '#dcfce7',
  teal: '#ccfbf1',
  amber: '#fef3c7',
  red: '#fee2e2',
  gray: '#f3f4f6',
}

const TONE_TEXT: Record<Tone, string> = {
  green: '#16a34a',
  teal: '#0f766e',
  amber: '#d97706',
  red: '#dc2626',
  gray: '#6b7280',
}

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const BAR_COLOR_GREEN = '#16a34a'
const BAR_COLOR_RED = '#ef4444'
const PROGRESS_MAX = 100

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortDay(dateStr: string): string {
  return DAYS_ID[new Date(dateStr + 'T00:00:00').getDay()] ?? dateStr
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string | number
  helper: string
  icon: LucideIcon
  tone: Tone
}

function MetricCard({ label, value, helper, icon: Icon, tone }: MetricCardProps) {
  const iconStyle = {
    backgroundColor: TONE_COLORS[tone],
    color: TONE_TEXT[tone],
  }

  return (
    <section className={styles.metricCard} aria-label={label}>
      <span className={styles.metricIcon} style={iconStyle}>
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

// ─── CompletionChart ──────────────────────────────────────────────────────────

interface ChartDatum {
  day: string
  count: number
}

interface CompletionChartProps {
  data: ChartDatum[]
  isLoading: boolean
}

function CompletionChart({ data, isLoading }: CompletionChartProps) {
  const isEmpty = data.every((d) => d.count === 0)

  const chartBody = isEmpty ? (
    <p className={styles.emptyChart}>Belum ada tugas selesai minggu ini</p>
  ) : (
    <div className={styles.chartWrap}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip formatter={(value) => [`${value} tugas`, 'Selesai']} />
          <Bar dataKey="count" fill={BAR_COLOR_GREEN} radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              style={{ fontSize: 11, fill: '#374151' }}
            />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={BAR_COLOR_GREEN} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Tugas Selesai 7 Hari Terakhir</h2>
      {isLoading ? <Skeleton height={200} style={{ borderRadius: 8 }} /> : chartBody}
    </section>
  )
}

// ─── HoursPanel ───────────────────────────────────────────────────────────────

interface HoursPanelProps {
  actual: number
  estimated: number
  isLoading: boolean
}

function HoursPanel({ actual, estimated, isLoading }: HoursPanelProps) {
  if (isLoading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ringkasan Jam Kerja</h2>
        <Skeleton height={80} style={{ borderRadius: 8 }} />
      </section>
    )
  }

  const hasEstimate = estimated > 0
  const pct = hasEstimate
    ? Math.min((actual / estimated) * PROGRESS_MAX, PROGRESS_MAX)
    : 0
  const barColor = actual > estimated ? BAR_COLOR_RED : BAR_COLOR_GREEN

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Ringkasan Jam Kerja</h2>
      <div className={styles.hoursNumbers}>
        <div className={styles.hoursNumber}>
          <p className={styles.hoursValue}>{actual}</p>
          <p className={styles.hoursLabel}>Jam Aktual</p>
        </div>
        <div className={styles.hoursNumber}>
          <p className={styles.hoursValue}>{estimated}</p>
          <p className={styles.hoursLabel}>Jam Estimasi</p>
        </div>
      </div>
      {hasEstimate ? (
        <>
          <div className={styles.progressTrack} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={PROGRESS_MAX}>
            <div
              className={styles.progressFill}
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
          <p className={styles.hoursNote}>
            {actual} jam aktual dari {estimated} jam estimasi
          </p>
        </>
      ) : (
        <p className={styles.hoursNote}>Belum ada estimasi jam kerja</p>
      )}
    </section>
  )
}

// ─── StatsRow ─────────────────────────────────────────────────────────────────

interface StatsRowProps {
  doneToday: number
  doneWeek: number
  pointsMonth: number
  blocked: number
  isLoading: boolean
}

function StatsRow({ doneToday, doneWeek, pointsMonth, blocked, isLoading }: StatsRowProps) {
  if (isLoading) {
    return (
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={88} style={{ borderRadius: 12 }} />
        ))}
      </div>
    )
  }

  const blockedTone: Tone = blocked > 0 ? 'red' : 'gray'

  return (
    <div className={styles.statsGrid}>
      <MetricCard
        label="Selesai Hari Ini"
        value={doneToday}
        helper="tugas diselesaikan"
        icon={CheckCircle2}
        tone="green"
      />
      <MetricCard
        label="Selesai Minggu Ini"
        value={doneWeek}
        helper="dalam 7 hari terakhir"
        icon={TrendingUp}
        tone="teal"
      />
      <MetricCard
        label="Poin Bulan Ini"
        value={pointsMonth.toFixed(1)}
        helper="total poin diperoleh"
        icon={Star}
        tone="amber"
      />
      <MetricCard
        label="Tugas Tertahan"
        value={blocked}
        helper="menunggu unblock"
        icon={AlertCircle}
        tone={blockedTone}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyDashboardPage() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: [QK.vtEmployeeStats],
    queryFn: myDashboardService.getEmployeeStats,
  })

  const { data: completions = [], isLoading: loadingChart } = useQuery({
    queryKey: [QK.vtDailyCompletions],
    queryFn: myDashboardService.getDailyCompletions,
  })

  const { data: hours, isLoading: loadingHours } = useQuery({
    queryKey: [QK.vtHoursSummary],
    queryFn: myDashboardService.getHoursSummary,
  })

  const chartData = completions.map((c) => ({ day: shortDay(c.date), count: c.count }))

  return (
    <div className={`${styles.root} animate-page-in`}>
      <PageHeader title="Dashboard Saya" />

      <StatsRow
        doneToday={stats?.done_today ?? 0}
        doneWeek={stats?.done_week ?? 0}
        pointsMonth={stats?.points_month ?? 0}
        blocked={stats?.blocked ?? 0}
        isLoading={loadingStats}
      />

      <CompletionChart data={chartData} isLoading={loadingChart} />

      <HoursPanel
        actual={hours?.actual_hours ?? 0}
        estimated={hours?.estimated_hours ?? 0}
        isLoading={loadingHours}
      />
    </div>
  )
}
