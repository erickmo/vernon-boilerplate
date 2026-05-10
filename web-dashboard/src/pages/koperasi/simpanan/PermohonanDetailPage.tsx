// src/pages/koperasi/simpanan/PermohonanDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { permohonanSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { PermohonanSimpanan } from '@/types/koperasi/simpanan.types'
import styles from './PermohonanDetailPage.module.css'

// ─── Info Tab ────────────────────────────────────────────────────────────────

function InfoTab({ p }: { p: PermohonanSimpanan }) {
  return (
    <div className={styles.infoGrid}>
      <InfoRow label="Tipe" value={p.tipe} />
      <InfoRow label="No Rekening" value={p.no_rekening ?? '—'} />
      <InfoRow label="Nasabah" value={p.nasabah_nama} />
      <InfoRow label="Alasan" value={p.alasan} />
      <InfoRow label="Tanggal" value={new Date(p.tanggal).toLocaleDateString('id-ID')} />
      {p.reviewed_by && <InfoRow label="Disetujui/Ditolak oleh" value={p.reviewed_by} />}
      {p.catatan_reviewer && <InfoRow label="Catatan Reviewer" value={p.catatan_reviewer} />}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}

// ─── Status Workflow Tab ──────────────────────────────────────────────────────

function WorkflowTab({
  permohonan,
  onApprove,
  onReject,
  isProcessing,
}: {
  permohonan: PermohonanSimpanan
  onApprove: () => void
  onReject: (alasan: string) => void
  isProcessing: boolean
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const isDiajukan = permohonan.status === 'Diajukan'

  const STEP_LABELS = ['Draft', 'Diajukan', permohonan.status === 'Ditolak' ? 'Ditolak' : 'Disetujui']
  const STEP_ACTIVE_INDEX = ['Draft', 'Diajukan', 'Disetujui', 'Ditolak'].indexOf(permohonan.status)

  return (
    <div className={styles.workflowTab}>
      <div className={styles.statusRow}>
        {STEP_LABELS.map((step, i) => (
          <div key={step} className={`${styles.step} ${i <= Math.min(STEP_ACTIVE_INDEX, 2) ? styles.stepDone : ''}`}>
            <div className={styles.stepDot} />
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div className={styles.currentStatus}>
        Status saat ini: <strong>{permohonan.status}</strong>
      </div>

      {isDiajukan && (
        <div className={styles.actions}>
          <button
            className={styles.btnApprove}
            onClick={onApprove}
            disabled={isProcessing}
          >
            <CheckCircle size={14} />
            Setujui
          </button>
          <button
            className={styles.btnReject}
            onClick={() => setShowRejectForm(true)}
            disabled={isProcessing}
          >
            <XCircle size={14} />
            Tolak
          </button>
        </div>
      )}

      {showRejectForm && (
        <div className={styles.rejectForm}>
          <label className={styles.rejectLabel}>Alasan Penolakan</label>
          <textarea
            className={styles.rejectTextarea}
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className={styles.rejectActions}>
            <button className={styles.btnSecondary} onClick={() => setShowRejectForm(false)}>Batal</button>
            <button
              className={styles.btnReject}
              disabled={!rejectReason.trim() || isProcessing}
              onClick={() => onReject(rejectReason)}
            >
              Konfirmasi Tolak
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function PermohonanDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: permohonan, isLoading } = useQuery<PermohonanSimpanan>({
    queryKey: [QK.permohonanSimpananDetail, id],
    queryFn: () => permohonanSimpananService.getById(id!),
    enabled: !!id,
  })

  const approveMutation = useMutation({
    mutationFn: () => permohonanSimpananService.approve(id!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.permohonanSimpananDetail, id] })
      void qc.invalidateQueries({ queryKey: [QK.permohonanSimpanan] })
      toast.success('Permohonan disetujui.')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal menyetujui'),
  })

  const rejectMutation = useMutation({
    mutationFn: (alasan: string) => permohonanSimpananService.reject(id!, alasan),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.permohonanSimpananDetail, id] })
      void qc.invalidateQueries({ queryKey: [QK.permohonanSimpanan] })
      toast.success('Permohonan ditolak.')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal menolak'),
  })

  if (isLoading || !permohonan) {
    return <div className={styles.loading}>Memuat permohonan...</div>
  }

  const isProcessing = approveMutation.isPending || rejectMutation.isPending

  return (
    <DetailPageTemplate
      title={permohonan.tipe}
      code={permohonan.status}
      onBack={() => navigate('/koperasi/simpanan/permohonan')}
      tabs={[
        { id: 'info', label: 'Info Permohonan', content: <InfoTab p={permohonan} /> },
        {
          id: 'workflow',
          label: 'Status Workflow',
          content: (
            <WorkflowTab
              permohonan={permohonan}
              onApprove={() => approveMutation.mutate()}
              onReject={(alasan) => rejectMutation.mutate(alasan)}
              isProcessing={isProcessing}
            />
          ),
        },
      ]}
    />
  )
}
