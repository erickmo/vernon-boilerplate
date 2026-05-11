import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createEntityService } from '@/services/createEntityService'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import { DenominasiGrid } from '@/widgets/DenominasiGrid/DenominasiGrid'
import { Modal } from '@/widgets/Modal/Modal'
import { toast } from '@/widgets/Toast/Toast'
import { formatCurrency } from '@/utils/format'
import type {
  DenominasiUang,
  Shift,
  BukaSesiPayload,
} from '@/types/koperasi/kas-teller.types'
import styles from './BukaSesiModal.module.css'

const denominasiService = createEntityService<DenominasiUang>(
  '/api/resource/Denominasi Uang',
)

interface Preset {
  label: string
  breakdown: Record<string, number>
}

const PRESETS: Preset[] = [
  { label: 'Rp 500.000', breakdown: { 'Rp 100.000': 4, 'Rp 50.000': 2 } },
  { label: 'Rp 1.000.000', breakdown: { 'Rp 100.000': 8, 'Rp 50.000': 4 } },
  { label: 'Rp 2.000.000', breakdown: { 'Rp 100.000': 18, 'Rp 50.000': 4 } },
]

const SHIFTS: Shift[] = ['Pagi', 'Siang', 'Sore']

export interface BukaSesiModalProps {
  open: boolean
  onClose: () => void
}

export function BukaSesiModal({ open, onClose }: BukaSesiModalProps) {
  const queryClient = useQueryClient()
  const [shift, setShift] = useState<Shift>('Pagi')
  const [supervisor, setSupervisor] = useState<string>('')
  const [denominasiValue, setDenominasiValue] = useState<
    Record<string, number>
  >({})

  const denominasiQuery = useQuery({
    queryKey: ['denominasi-uang', 'aktif'],
    queryFn: () =>
      denominasiService.list({
        filters: [['aktif', '=', 1]],
        sort: [['urutan', 1]],
        limit: 50,
      }),
    enabled: open,
  })

  const total = useMemo(() => {
    const items = denominasiQuery.data?.items ?? []
    return items.reduce(
      (sum, d) => sum + (denominasiValue[d.name] ?? 0) * d.nilai,
      0,
    )
  }, [denominasiValue, denominasiQuery.data])

  const mutation = useMutation({
    mutationFn: (payload: BukaSesiPayload) =>
      sesiKasTellerService.bukaSesi(payload),
    onSuccess: () => {
      toast.success('Sesi kas dibuka')
      queryClient.invalidateQueries({ queryKey: ['sesi-kas', 'active'] })
      resetForm()
      onClose()
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Gagal buka sesi'
      toast.error(message)
    },
  })

  const resetForm = () => {
    setShift('Pagi')
    setSupervisor('')
    setDenominasiValue({})
  }

  const handleClose = () => {
    if (mutation.isPending) return
    resetForm()
    onClose()
  }

  const applyPreset = (p: Preset) => setDenominasiValue(p.breakdown)

  const handleSubmit = () => {
    if (!supervisor) {
      toast.error('Pilih supervisor terlebih dahulu')
      return
    }
    if (total <= 0) {
      toast.error('Modal kas harus lebih dari 0')
      return
    }
    const denominasi_buka = Object.entries(denominasiValue)
      .filter(([, qty]) => qty > 0)
      .map(([denominasi, jumlah]) => ({ denominasi, jumlah }))

    mutation.mutate({
      tanggal: new Date().toISOString().slice(0, 10),
      shift,
      supervisor_buka: supervisor,
      modal_kas: total,
      denominasi_buka,
    })
  }

  return (
    <Modal isOpen={open} onClose={handleClose} title="Buka Sesi Kas" size="lg">
      <div className={styles.body}>
        <div className={styles.field}>
          <label htmlFor="shift">Shift</label>
          <select
            id="shift"
            value={shift}
            onChange={(e) => setShift(e.target.value as Shift)}
          >
            {SHIFTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="supervisor">Supervisor</label>
          <input
            id="supervisor"
            type="email"
            placeholder="supervisor@email"
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
          />
        </div>

        <div className={styles.presets}>
          <span>Preset cepat:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {denominasiQuery.isLoading && (
          <div className={styles.loading}>Memuat denominasi…</div>
        )}

        {denominasiQuery.data && (
          <DenominasiGrid
            denominasi={denominasiQuery.data.items}
            value={denominasiValue}
            onChange={setDenominasiValue}
            disabled={mutation.isPending}
          />
        )}

        <div className={styles.summary}>
          <strong>Modal Kas: {formatCurrency(total)}</strong>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending || total <= 0 || !supervisor}
          >
            {mutation.isPending ? 'Menyimpan…' : 'Buka Sesi'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
