import { useQuery } from '@tanstack/react-query'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ClipboardCheck, TrendingUp, Star } from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { Skeleton } from '@/widgets/Skeleton/Skeleton'
import { QK } from '@/services/query-keys'
import {
  leaderDashboardService,
  type LeaderStats,
  type PhaseDistribution,
  type LeaderboardEntry,
  type OverdueTask,
} from '@/services/leader.service'
import styles from './LeaderDashboardPage.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  BACKLOG: '#94a3b8',
  PLAN: '#60a5fa',
  DO: '#34d399',
  CHECK: '#fbbf24',
  ACT: '#f87171',
  DONE: '#4ade80',
}

const PHASE_LABELS: Record<string, string> = {
  BACKLOG: 'Belum Dimulai',
  PLAN: 'Penjadwalan',
  DO: 'Dikerjakan',
  CHECK: 'Review',
  ACT: 'Revisi',
  DONE: 'Selesai',
}

const MEDAL_ICONS = ['🥇', '🥈', '🥉']
const MAX_LEADERBOARD_ENTRIES = 10
const MAX_MEMBER_NAME_LENGTH = 20
const MAX_TASK_TITLE_LENGTH = 40

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str
}

function formatDeadline(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  valueHighlight?: boolean
}

function MetricCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  valueHighlight = false,
}: MetricCardProps) {
  return (
    <section className={styles.metricCard} aria-label={label}>
      <span
        className={styles.metricIcon}
        style={{ background: iconBg, color: iconColor }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div>
        <p className={styles.metricLabel}>{label}</p>
        <p
          className={`${styles.metricValue} ${valueHighlight ? styles.metricValueAmber : ''}`}
        >
          {value}
        </p>
      </div>
    </section>
  )
}

interface StatsRowProps {
  stats: LeaderStats | undefined
  isLoading: boolean
}

function StatsRow({ stats, isLoading }: StatsRowProps) {
  if (isLoading) {
    return (
      <div className={styles.statsGrid}>
        <Skeleton height={88} borderRadius="12px" />
        <Skeleton height={88} borderRadius="12px" />
        <Skeleton height={88} borderRadius="12px" />
      </div>
    )
  }

  return (
    <div className={styles.statsGrid}>
      <MetricCard
        label="Menunggu Review"
        value={String(stats?.pending_review ?? 0)}
        icon={<ClipboardCheck size={18} />}
        iconBg="#fff7ed"
        iconColor="#f97316"
        valueHighlight={(stats?.pending_review ?? 0) > 0}
      />
      <MetricCard
        label="Tingkat Persetujuan"
        value={`${(stats?.approval_rate ?? 0).toFixed(1)}%`}
        icon={<TrendingUp size={18} />}
        iconBg="#f0fdfa"
        iconColor="#0d9488"
      />
      <MetricCard
        label="Poin Tim Bulan Ini"
        value={`${(stats?.team_points_month ?? 0).toFixed(1)}`}
        icon={<Star size={18} />}
        iconBg="#ede9fe"
        iconColor="#7c3aed"
      />
    </div>
  )
}

interface PhaseDistributionPanelProps {
  distribution: PhaseDistribution[]
}

function PhaseDistributionPanel({ distribution }: PhaseDistributionPanelProps) {
  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>Distribusi Fase</p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={distribution}
            dataKey="count"
            nameKey="phase"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={100}
          >
            {distribution.map((entry) => (
              <Cell
                key={entry.phase}
                fill={PHASE_COLORS[entry.phase] ?? '#e5e7eb'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${value} tugas`,
              PHASE_LABELS[name as string] ?? name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className={styles.legend} aria-label="Legenda fase">
        {distribution.map((entry) => (
          <span key={entry.phase} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: PHASE_COLORS[entry.phase] ?? '#e5e7eb' }}
              aria-hidden="true"
            />
            {PHASE_LABELS[entry.phase] ?? entry.phase}
            <span className={styles.countBadge}>{entry.count}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[]
}

function LeaderboardPanel({ entries }: LeaderboardPanelProps) {
  const visible = entries.slice(0, MAX_LEADERBOARD_ENTRIES)

  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>Peringkat Tim</p>
      {visible.length === 0 ? (
        <p className={styles.emptyState}>Belum ada data peringkat</p>
      ) : (
        <div role="list" aria-label="Peringkat anggota tim">
          {visible.map((entry, index) => (
            <div key={entry.member} className={styles.leaderRow} role="listitem">
              {index < 3 ? (
                <span className={styles.leaderRank} aria-label={`Peringkat ${index + 1}`}>
                  {MEDAL_ICONS[index]}
                </span>
              ) : (
                <span className={styles.leaderRankNumber} aria-label={`Peringkat ${index + 1}`}>
                  {index + 1}
                </span>
              )}
              <span className={styles.leaderName} title={entry.member}>
                {truncate(entry.member, MAX_MEMBER_NAME_LENGTH)}
              </span>
              <span className={styles.leaderPoints}>{entry.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface OverdueTableProps {
  tasks: OverdueTask[]
}

function OverdueTable({ tasks }: OverdueTableProps) {
  return (
    <section className={styles.overdueSection} aria-label="Tugas terlambat">
      <div className={styles.overdueSectionHeader}>
        <h2 className={styles.overdueTitle}>Tugas Terlambat</h2>
        {tasks.length > 0 && (
          <span className={styles.overdueBadge} aria-label={`${tasks.length} tugas terlambat`}>
            {tasks.length}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className={styles.emptyState}>Tidak ada tugas terlambat 🎉</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Tugas</th>
                <th className={styles.th}>Anggota</th>
                <th className={styles.th}>Tenggat</th>
                <th className={styles.th}>Fase</th>
                <th className={styles.th}>Terlambat</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <OverdueRow key={task.task_name} task={task} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

interface OverdueRowProps {
  task: OverdueTask
}

function OverdueRow({ task }: OverdueRowProps) {
  return (
    <tr>
      <td className={styles.td} title={task.task_title}>
        {truncate(task.task_title, MAX_TASK_TITLE_LENGTH)}
      </td>
      <td className={styles.td}>{task.member}</td>
      <td className={styles.td}>{formatDeadline(task.deadline)}</td>
      <td className={styles.td}>{PHASE_LABELS[task.phase] ?? task.phase}</td>
      <td className={`${styles.td} ${styles.overdueDay}`}>
        {task.days_overdue} hari
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: [QK.vtLeaderStats],
    queryFn: leaderDashboardService.getLeaderStats,
  })

  const { data: distribution = [] } = useQuery({
    queryKey: [QK.vtPhaseDistribution],
    queryFn: leaderDashboardService.getPhaseDistribution,
  })

  const { data: leaderboard = [] } = useQuery({
    queryKey: [QK.vtTeamLeaderboard],
    queryFn: leaderDashboardService.getTeamLeaderboard,
  })

  const { data: overdue = [] } = useQuery({
    queryKey: [QK.vtOverdueTasks],
    queryFn: leaderDashboardService.getOverdueTasks,
  })

  return (
    <div className={`${styles.root} animate-page-in`}>
      <PageHeader
        title="Dashboard Tim"
        subtitle="Gambaran kinerja dan status tim Anda"
      />

      <StatsRow stats={stats} isLoading={isLoading} />

      <div className={styles.contentGrid}>
        <PhaseDistributionPanel distribution={distribution} />
        <LeaderboardPanel entries={leaderboard} />
      </div>

      <OverdueTable tasks={overdue} />
    </div>
  )
}
