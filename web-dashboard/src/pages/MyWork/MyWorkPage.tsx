import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { Skeleton } from '@/widgets/Skeleton/Skeleton'
import { toast } from '@/widgets/Toast/Toast'
import { tasksService, type VtTask, type BlockedTask } from '@/services/tasks.service'
import { QK } from '@/services/query-keys'
import styles from './MyWorkPage.module.css'

// ─── Constants ───────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  BACKLOG: 'Belum Dimulai',
  PLAN: 'Penjadwalan',
  DO: 'Sedang Dikerjakan',
  CHECK: 'Menunggu Review',
  ACT: 'Revisi',
  DONE: 'Selesai',
}

const PHASE_COLORS: Record<string, { bg: string; text: string }> = {
  BACKLOG: { bg: '#f3f4f6', text: '#6b7280' },
  PLAN: { bg: '#dbeafe', text: '#1d4ed8' },
  DO: { bg: '#dcfce7', text: '#16a34a' },
  CHECK: { bg: '#fef3c7', text: '#d97706' },
  ACT: { bg: '#fee2e2', text: '#dc2626' },
  DONE: { bg: '#f0fdf4', text: '#15803d' },
}

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#6b7280',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIndonesian(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: string }) {
  const color = PHASE_COLORS[phase] ?? { bg: '#f3f4f6', text: '#6b7280' }
  return (
    <span
      className={styles.phaseBadge}
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {PHASE_LABELS[phase] ?? phase}
    </span>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  return (
    <span
      className={styles.priorityDot}
      style={{ backgroundColor: PRIORITY_COLORS[priority] ?? '#6b7280' }}
      title={priority}
    />
  )
}

interface ActionButtonProps {
  task: VtTask
  onStart: (name: string) => void
  onSubmit: (name: string) => void
  isPending: boolean
}

function ActionButton({ task, onStart, onSubmit, isPending }: ActionButtonProps) {
  const phase = task.pdca_phase

  if (phase === 'BACKLOG' || phase === 'PLAN') {
    return (
      <button
        type="button"
        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
        onClick={() => onStart(task.name)}
        disabled={isPending}
      >
        Mulai Tugas
      </button>
    )
  }

  if (phase === 'DO') {
    return (
      <button
        type="button"
        className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
        onClick={() => onSubmit(task.name)}
        disabled={isPending}
      >
        Kirim Review
      </button>
    )
  }

  if (phase === 'CHECK') {
    return (
      <span className={`${styles.actionBtn} ${styles.actionBtnDisabled}`}>
        Menunggu Review
      </span>
    )
  }

  return null
}

// ─── FocusCard ────────────────────────────────────────────────────────────────

interface FocusCardProps {
  task: VtTask
  onStart: (name: string) => void
  onSubmit: (name: string) => void
  isPending: boolean
}

function FocusCard({ task, onStart, onSubmit, isPending }: FocusCardProps) {
  const borderColor = PHASE_COLORS[task.pdca_phase]?.text ?? '#6b7280'

  return (
    <div className={styles.focusCard} style={{ borderLeftColor: borderColor }}>
      <h2 className={styles.focusTitle}>{task.title}</h2>
      <p className={styles.focusProject}>{task.project}</p>
      <div className={styles.focusMeta}>
        <PriorityDot priority={task.priority} />
        <PhaseBadge phase={task.pdca_phase} />
        {task.deadline && (
          <span className={styles.taskMeta}>
            Tenggat: {formatDeadline(task.deadline)}
          </span>
        )}
      </div>
      <ActionButton
        task={task}
        onStart={onStart}
        onSubmit={onSubmit}
        isPending={isPending}
      />
    </div>
  )
}

function FocusEmpty() {
  return (
    <div className={styles.focusCard} style={{ borderLeftColor: '#6b7280' }}>
      <p className={styles.emptyState} style={{ padding: 0 }}>
        Tidak ada tugas mendesak. Cek daftar tugas di bawah.
      </p>
    </div>
  )
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: VtTask
  onStart: (name: string) => void
  onSubmit: (name: string) => void
  isPending: boolean
}

function TaskRow({ task, onStart, onSubmit, isPending }: TaskRowProps) {
  return (
    <article className={styles.taskCard}>
      <PhaseBadge phase={task.pdca_phase} />
      <div style={{ flex: 1 }}>
        <p className={styles.taskTitle}>{task.title}</p>
        <span className={styles.taskProject}>{task.project}</span>
      </div>
      <div className={styles.taskMeta}>
        <PriorityDot priority={task.priority} />
        {task.deadline && <span>Tenggat: {formatDeadline(task.deadline)}</span>}
      </div>
      <ActionButton
        task={task}
        onStart={onStart}
        onSubmit={onSubmit}
        isPending={isPending}
      />
    </article>
  )
}

// ─── TodaySection ─────────────────────────────────────────────────────────────

interface TodaySectionProps {
  tasks: VtTask[]
  isLoading: boolean
  onStart: (name: string) => void
  onSubmit: (name: string) => void
  isPending: boolean
}

function TodaySection({ tasks, isLoading, onStart, onSubmit, isPending }: TodaySectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Tugas Hari Ini</h2>
      </div>

      {isLoading && (
        <>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.skeletonWrap}>
              <Skeleton height={72} borderRadius="8px" />
            </div>
          ))}
        </>
      )}

      {!isLoading && tasks.length === 0 && (
        <div className={styles.emptyState}>
          <ClipboardList size={32} aria-hidden="true" />
          <p>Tidak ada tugas hari ini</p>
        </div>
      )}

      {!isLoading &&
        tasks.map((task) => (
          <TaskRow
            key={task.name}
            task={task}
            onStart={onStart}
            onSubmit={onSubmit}
            isPending={isPending}
          />
        ))}
    </section>
  )
}

// ─── BlockedSection ───────────────────────────────────────────────────────────

function BlockedSection({ blocked }: { blocked: BlockedTask[] }) {
  const [open, setOpen] = useState(false)

  if (blocked.length === 0) return null

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Menunggu ({blocked.length})</h2>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {open ? 'Sembunyikan' : 'Tampilkan'}
        </button>
      </div>

      {open &&
        blocked.map((task) => (
          <article key={task.name} className={styles.blockedCard}>
            <div style={{ flex: 1 }}>
              <p className={styles.taskTitle}>{task.title}</p>
              <span className={styles.taskProject}>
                Menunggu {task.blocker_assignee}
              </span>
            </div>
            <span className={styles.blockedBadge}>{task.days_blocked} hari</span>
          </article>
        ))}
    </section>
  )
}

// ─── MyWorkPage ───────────────────────────────────────────────────────────────

export default function MyWorkPage() {
  const qc = useQueryClient()

  const { data: todayTasks = [], isLoading: loadingToday } = useQuery({
    queryKey: [QK.vtMyDay],
    queryFn: tasksService.getMyDay,
  })

  const { data: recommended = [], isLoading: loadingRec } = useQuery({
    queryKey: [QK.vtWhatToDoToday],
    queryFn: tasksService.getWhatToDoToday,
  })

  const { data: blocked = [] } = useQuery({
    queryKey: [QK.vtMyBlockedTasks],
    queryFn: tasksService.getMyBlockedTasks,
  })

  const invalidateTaskLists = () => {
    qc.invalidateQueries({ queryKey: [QK.vtMyDay] })
    qc.invalidateQueries({ queryKey: [QK.vtWhatToDoToday] })
  }

  const startMutation = useMutation({
    mutationFn: (name: string) => tasksService.startTask(name),
    onSuccess: () => {
      toast.success('Tugas dimulai')
      invalidateTaskLists()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    },
  })

  const submitMutation = useMutation({
    mutationFn: (name: string) => tasksService.submitForReview(name),
    onSuccess: () => {
      toast.success('Dikirim untuk review')
      invalidateTaskLists()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    },
  })

  const isPending = startMutation.isPending || submitMutation.isPending

  const focusTask = recommended[0] ?? null

  return (
    <div className={`${styles.root} animate-page-in`}>
      <PageHeader title="Kerja Saya" subtitle={todayIndonesian()} />

      <section className={styles.focusSection}>
        {loadingRec ? (
          <Skeleton height={140} borderRadius="12px" />
        ) : focusTask ? (
          <FocusCard
            task={focusTask}
            onStart={(name) => startMutation.mutate(name)}
            onSubmit={(name) => submitMutation.mutate(name)}
            isPending={isPending}
          />
        ) : (
          <FocusEmpty />
        )}
      </section>

      <TodaySection
        tasks={todayTasks}
        isLoading={loadingToday}
        onStart={(name) => startMutation.mutate(name)}
        onSubmit={(name) => submitMutation.mutate(name)}
        isPending={isPending}
      />

      <BlockedSection blocked={blocked} />
    </div>
  )
}
