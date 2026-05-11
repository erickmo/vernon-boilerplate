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
  SesiKasTeller,
} from '@/types/koperasi/kas-teller.types'
import styles from './TutupSesiModal.module.css'

const denominasiService = createEntityService<DenominasiUang>(
  '/api/resource/Denominasi Uang',
)

export interface TutupSesiModalProps {
  open: boolean
  onClose: () => void
  sesi: SesiKasTeller
}

export function TutupSesiModal({ open, onClose, sesi }: TutupSesiModalProps) {
  const queryClient = useQueryClient()
  const [denominasiValue, setDenominasiValue] = useState<
    Record<string, number>
  >({})
  const [catatan, setCatatan] = useState('')

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

  const totalDenominasi = useMemo(() => {
    const items = denominasiQuery.data?.items ?? []
    return items.reduce(
      (sum, d) => sum + (denominasiValue[d.name] ?? 0) * d.nilai,
      0,
    )
  }, [denominasiValue, denominasiQuery.data])

  const saldoSeharusnya =
    sesi.modal_kas + (sesi.total_setoran ?? 0) - (sesi.total_penarikan ?? 0)
  const selisih = totalDenominasi - saldoSeharusnya

  const mutation = useMutation({
    mutationFn: () => {
      const denominasi_tutup = Object.entries(denominasiValue)
        .filter(([, qty]) => qty > 0)
        .map(([denominasi, jumlah_lembar]) => ({ denominasi, jumlah_lembar }))
      return sesiKasTellerService.tutupKas(
        sesi.name,
        denominasi_tutup,
        selisih !== 0 ? catatan : undefined,
      )
    },
    onSuccess: () => {
      toast.success('Sesi ditutup, menunggu approval supervisor')
      queryClient.invalidateQueries({ queryKey: ['sesi-kas', 'active'] })
      setDenominasiValue({})
      setCatatan('')
      onClose()
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Gagal tutup sesi'
      toast.error(message)
    },
  })

  const canSubmit =
    totalDenominasi > 0 &&
    !mutation.isPending &&
    (selisih === 0 || catatan.trim().length > 0)

  const handleClose = () => {
    if (mutation.isPending) return
    onClose()
  }

  return (
    <Modal isOpen={open} onClose={handleClose} title="Tutup Sesi Kas" size="lg">
      <div className={styles.body}>
        <div className={styles.summary}>
          <div>
            <span>Modal Kas</span>
            <strong>{formatCurrency(sesi.modal_kas)}</strong>
          </div>
          <div>
            <span>Total Setoran</span>
            <strong>{formatCurrency(sesi.total_setoran ?? 0)}</strong>
          </div>
          <div>
            <span>Total Penarikan</span>
            <strong>{formatCurrency(sesi.total_penarikan ?? 0)}</strong>
          </div>
          <div>
            <span>Saldo Seharusnya</span>
            <strong>{formatCurrency(saldoSeharusnya)}</strong>
          </div>
        </div>

        {denominasiQuery.isLoading && <p>Memuat denominasi…</p>}

        {denominasiQuery.data && (
          <DenominasiGrid
            denominasi={denominasiQuery.data.items}
            value={denominasiValue}
            onChange={setDenominasiValue}
            disabled={mutation.isPending}
          />
        )}

        <div className={styles.selisihRow}>
          <span>Selisih</span>
          <strong
            style={{
              color:
                selisih === 0
                  ? 'var(--color-green-600)'
                  : 'var(--color-red-600)',
            }}
          >
            {formatCurrency(selisih)}
          </strong>
        </div>

        {selisih !== 0 && (
          <div className={styles.field}>
            <label htmlFor="catatan">Catatan Selisih *</label>
            <textarea
              id="catatan"
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Wajib diisi karena selisih bukan nol"
            />
          </div>
        )}

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
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
          >
            {mutation.isPending ? 'Menutup…' : 'Tutup Sesi'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
