import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { Skeleton } from '@/widgets/Skeleton/Skeleton'
import { toast } from '@/widgets/Toast/Toast'
import { useDeepLinkTaskHighlight } from '@/hooks/useDeepLinkTaskHighlight'
import { QK } from '@/services/query-keys'
import {
  leaderReviewService,
  type ReviewTask,
  type TeamWorkloadEntry,
  type TeamBlockedTask,
} from '@/services/leader.service'
import styles from './LeaderReviewPage.module.css'

// ── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  Critical: { bg: '#fee2e2', text: '#dc2626' },
  High:     { bg: '#ffedd5', text: '#c2410c' },
  Medium:   { bg: '#fef9c3', text: '#a16207' },
  Low:      { bg: '#f3f4f6', text: '#6b7280' },
}

const SKELETON_ROW_COUNT = 4
const MIN_REJECT_REASON_LENGTH = 10
const MAX_REJECT_REASON_LENGTH = 500
const MAX_SUBTITLE_LENGTH = 60

// ── Helper ───────────────────────────────────────────────────────────────────

function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}...` : str
}

function getPriorityStyle(priority: string): { bg: string; text: string } {
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface PriorityBadgeProps {
  priority: string
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { bg, text } = getPriorityStyle(priority)
  return (
    <span
      className={styles.priorityBadge}
      style={{ backgroundColor: bg, color: text }}
    >
      {priority}
    </span>
  )
}

interface QueueListProps {
  queue: ReviewTask[]
  isLoading: boolean
  selectedTask: ReviewTask | null
  onSelect: (task: ReviewTask) => void
  highlightedTask: string | null
  registerRef: (name: string) => (el: HTMLElement | null) => void
}

function QueueList({
  queue,
  isLoading,
  selectedTask,
  onSelect,
  highlightedTask,
  registerRef,
}: QueueListProps) {
  return (
    <div className={styles.queuePanel}>
      <div className={styles.queueHeader}>Antrian Review ({queue.length})</div>

      {isLoading &&
        Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
          <div key={i} className={styles.queueItem}>
            <Skeleton height="14px" width="70%" />
            <Skeleton height="12px" width="50%" />
          </div>
        ))}

      {!isLoading && queue.length === 0 && (
        <div className={styles.queueEmpty}>
          Tidak ada tugas menunggu review. Kerja bagus! 🎉
        </div>
      )}

      {!isLoading &&
        queue.map((task) => {
          const isActive = task.name === selectedTask?.name
          return (
            <div
              key={task.name}
              ref={registerRef(task.name)}
              data-deeplink-highlight={String(highlightedTask === task.name)}
              className={`${styles.queueItem} ${isActive ? styles.queueItemActive : ''}`}
              onClick={() => onSelect(task)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(task)}
            >
              <p className={styles.queueTitle}>{task.title}</p>
              <div className={styles.queueMeta}>
                <span>{task.assigned_to}</span>
                <span>·</span>
                <span>{task.project}</span>
                <PriorityBadge priority={task.priority} />
              </div>
            </div>
          )
        })}
    </div>
  )
}

interface TaskDetailProps {
  task: ReviewTask | null
  isApproving: boolean
  onApprove: () => void
  onReject: () => void
}

function TaskDetail({ task, isApproving, onApprove, onReject }: TaskDetailProps) {
  if (!task) {
    return (
      <div className={styles.detailPanel}>
        <div className={styles.detailPlaceholder}>Pilih tugas dari daftar</div>
      </div>
    )
  }

  return (
    <div className={styles.detailPanel}>
      <p className={styles.detailTitle}>{task.title}</p>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Ditugaskan ke</span>
          <span className={styles.metaValue}>{task.assigned_to}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Proyek</span>
          <span className={styles.metaValue}>{task.project}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Prioritas</span>
          <span className={styles.metaValue}>
            <PriorityBadge priority={task.priority} />
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Tenggat</span>
          <span className={styles.metaValue}>{task.deadline}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Estimasi Jam</span>
          <span className={styles.metaValue}>{task.estimated_hours} jam</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Jadwal Review</span>
          <span className={styles.metaValue}>{task.review_scheduled_date ?? '—'}</span>
        </div>
      </div>

      <div className={styles.detailActions}>
        <button
          className={styles.approveBtn}
          type="button"
          disabled={isApproving}
          onClick={onApprove}
        >
          {isApproving ? 'Menyetujui...' : 'Setujui'}
        </button>
        <button className={styles.rejectBtn} type="button" onClick={onReject}>
          Tolak
        </button>
      </div>
    </div>
  )
}

interface WorkloadSectionProps {
  workload: TeamWorkloadEntry[]
}

function WorkloadSection({ workload }: WorkloadSectionProps) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>Beban Kerja Tim</p>
      {workload.map((entry) => {
        const pct = Math.min((entry.total_hours / entry.capacity) * 100, 100)
        const fillColor = entry.overloaded ? '#dc2626' : '#16a34a'
        return (
          <div key={entry.assigned_to} className={styles.workloadRow}>
            <span className={styles.workloadName}>{entry.assigned_to}</span>
            <div className={styles.workloadBar}>
              <div
                className={styles.workloadFill}
                style={{ width: `${pct}%`, backgroundColor: fillColor }}
              />
            </div>
            <span className={styles.workloadHours}>
              {entry.total_hours}/{entry.capacity} jam
            </span>
            {entry.overloaded && (
              <span className={styles.overloadBadge}>Kelebihan Beban</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface BlockedSectionProps {
  blockedTasks: TeamBlockedTask[]
}

function BlockedSection({ blockedTasks }: BlockedSectionProps) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>Tugas Tertahan</p>
      {blockedTasks.length === 0 ? (
        <p className={styles.emptyState}>Tidak ada tugas tertahan</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Tugas</th>
              <th className={styles.th}>Anggota</th>
              <th className={styles.th}>Menunggu</th>
              <th className={styles.th}>Hari Tertahan</th>
            </tr>
          </thead>
          <tbody>
            {blockedTasks.map((task) => (
              <tr key={task.name}>
                <td className={styles.td}>{task.title}</td>
                <td className={styles.td}>{task.assigned_to}</td>
                <td className={styles.td}>{task.blocker_title}</td>
                <td className={styles.td} style={{ color: '#9ca3af' }}>
                  {task.days_blocked} hari
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

interface RejectModalProps {
  task: ReviewTask
  reason: string
  isPending: boolean
  onReasonChange: (reason: string) => void
  onConfirm: () => void
  onCancel: () => void
}

function RejectModal({
  task,
  reason,
  isPending,
  onReasonChange,
  onConfirm,
  onCancel,
}: RejectModalProps) {
  const isSubmitDisabled =
    reason.trim().length < MIN_REJECT_REASON_LENGTH || isPending

  return (
    <div className={styles.modalOverlay} onClick={onCancel} role="dialog" aria-modal="true">
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <p className={styles.modalTitle}>Tolak Tugas</p>
        <p className={styles.modalSubtitle}>
          {truncate(task.title, MAX_SUBTITLE_LENGTH)}
        </p>

        <textarea
          className={styles.textarea}
          rows={5}
          placeholder="Jelaskan apa yang perlu diperbaiki..."
          value={reason}
          maxLength={MAX_REJECT_REASON_LENGTH}
          onChange={(e) => onReasonChange(e.target.value)}
        />
        <p className={styles.charCount}>
          {reason.length}/{MAX_REJECT_REASON_LENGTH}
        </p>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} type="button" onClick={onCancel}>
            Batal
          </button>
          <button
            className={styles.submitRejectBtn}
            type="button"
            disabled={isSubmitDisabled}
            onClick={onConfirm}
          >
            {isPending ? 'Mengirim...' : 'Tolak & Beritahu'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderReviewPage() {
  const [selectedTask, setSelectedTask] = useState<ReviewTask | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const qc = useQueryClient()

  const { data: queue = [], isLoading } = useQuery({
    queryKey: [QK.vtReviewQueue],
    queryFn: leaderReviewService.getReviewQueue,
  })

  const availableTaskNames = useMemo(() => queue.map((t) => t.name), [queue])
  const { highlightedTask, registerRef } = useDeepLinkTaskHighlight({
    availableTaskNames,
    onMissing: (name) => toast.warning(`Tugas ${name} tidak ada di antrian saat ini`),
  })

  const { data: workload = [] } = useQuery({
    queryKey: [QK.vtTeamWorkload],
    queryFn: leaderReviewService.getTeamWorkload,
  })

  const { data: blockedTasks = [] } = useQuery({
    queryKey: [QK.vtTeamBlockedTasks],
    queryFn: leaderReviewService.getTeamBlockedTasks,
  })

  const approveMutation = useMutation({
    mutationFn: (taskName: string) => leaderReviewService.approveTask(taskName),
    onSuccess: () => {
      toast.success('Tugas disetujui')
      setSelectedTask(null)
      void qc.invalidateQueries({ queryKey: [QK.vtReviewQueue] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ taskName, reason }: { taskName: string; reason: string }) =>
      leaderReviewService.rejectTask(taskName, reason),
    onSuccess: () => {
      toast.success('Tugas dikembalikan untuk revisi')
      setShowRejectModal(false)
      setRejectReason('')
      setSelectedTask(null)
      void qc.invalidateQueries({ queryKey: [QK.vtReviewQueue] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleApprove() {
    if (!selectedTask) return
    approveMutation.mutate(selectedTask.name)
  }

  function handleOpenRejectModal() {
    setShowRejectModal(true)
  }

  function handleConfirmReject() {
    if (!selectedTask) return
    rejectMutation.mutate({ taskName: selectedTask.name, reason: rejectReason })
  }

  function handleCloseRejectModal() {
    setShowRejectModal(false)
    setRejectReason('')
  }

  return (
    <div className={`${styles.root} animate-page-in`}>
      <PageHeader
        title="Review Tugas"
        subtitle="Tinjau dan setujui tugas tim yang menunggu persetujuan."
      />

      <div className={styles.splitPanel}>
        <QueueList
          queue={queue}
          isLoading={isLoading}
          selectedTask={selectedTask}
          onSelect={setSelectedTask}
          highlightedTask={highlightedTask}
          registerRef={registerRef}
        />
        <TaskDetail
          task={selectedTask}
          isApproving={approveMutation.isPending}
          onApprove={handleApprove}
          onReject={handleOpenRejectModal}
        />
      </div>

      <WorkloadSection workload={workload} />
      <BlockedSection blockedTasks={blockedTasks} />

      {showRejectModal && selectedTask && (
        <RejectModal
          task={selectedTask}
          reason={rejectReason}
          isPending={rejectMutation.isPending}
          onReasonChange={setRejectReason}
          onConfirm={handleConfirmReject}
          onCancel={handleCloseRejectModal}
        />
      )}
    </div>
  )
}
