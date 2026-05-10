// src/pages/koperasi/kas-teller/SesiKasTellerFormPage.tsx

import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import { toast } from '@/widgets/Toast/Toast'
import type { SesiKasTeller, ItemDenominasiKas } from '@/types/koperasi/kas-teller.types'

const DENOMINASI_MASTER = [
  { id: 'D100000', nilai: 100000, label: 'Rp 100.000' },
  { id: 'D50000', nilai: 50000, label: 'Rp 50.000' },
  { id: 'D20000', nilai: 20000, label: 'Rp 20.000' },
  { id: 'D10000', nilai: 10000, label: 'Rp 10.000' },
  { id: 'D5000', nilai: 5000, label: 'Rp 5.000' },
  { id: 'D2000', nilai: 2000, label: 'Rp 2.000' },
  { id: 'D1000', nilai: 1000, label: 'Rp 1.000' },
  { id: 'D500', nilai: 500, label: 'Rp 500' },
  { id: 'D200', nilai: 200, label: 'Rp 200' },
  { id: 'D100', nilai: 100, label: 'Rp 100' },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

export function SesiKasTellerFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const today = new Date().toISOString().split('T')[0]

  const [tanggal, setTanggal] = useState(today)
  const [denominasi, setDenominasi] = useState<Record<string, number>>(
    Object.fromEntries(DENOMINASI_MASTER.map((d) => [d.id, 0])),
  )
  const [serverError, setServerError] = useState<string | undefined>()

  const saldoAwal = DENOMINASI_MASTER.reduce(
    (sum, d) => sum + (denominasi[d.id] ?? 0) * d.nilai,
    0,
  )

  const denominasiAwal: ItemDenominasiKas[] = DENOMINASI_MASTER.filter(
    (d) => (denominasi[d.id] ?? 0) > 0,
  ).map((d) => ({
    denominasi_id: d.id,
    denominasi_nilai: d.nilai,
    denominasi_label: d.label,
    jumlah_lembar: denominasi[d.id] ?? 0,
    total: (denominasi[d.id] ?? 0) * d.nilai,
  }))

  const mutation = useMutation({
    mutationFn: () =>
      sesiKasTellerService.create({
        tanggal,
        saldo_awal: saldoAwal,
        denominasi_awal: denominasiAwal,
      } as Partial<SesiKasTeller>),
    onSuccess: () => {
      toast.success('Sesi kas teller berhasil dibuka.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-sesi-kas-teller'] })
      navigate('/koperasi/kas-teller')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  function updateLembar(id: string, delta: number) {
    setDenominasi((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }))
  }

  return (
    <FormPageTemplate
      title="Buka Sesi Kas Teller"
      onBack={() => navigate('/koperasi/kas-teller')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/kas-teller')}
      isSubmitting={mutation.isPending}
      submitLabel="Buka Sesi"
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Buka Sesi',
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 240 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal Sesi *</span>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>

              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: 12 }}>Denominasi Saldo Awal</p>
                <table style={{ width: '100%', maxWidth: 520, borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-slate-200)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Denominasi</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600 }}>Lembar</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DENOMINASI_MASTER.map((d) => {
                      const lembar = denominasi[d.id] ?? 0
                      return (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                          <td style={{ padding: '8px 12px' }}>{d.label}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => updateLembar(d.id, -1)}
                                disabled={lembar === 0}
                                style={{ width: 28, height: 28, border: '1px solid var(--color-slate-200)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Minus size={12} />
                              </button>
                              <input
                                type="number"
                                value={lembar}
                                onChange={(e) => setDenominasi((prev) => ({ ...prev, [d.id]: Math.max(0, Number(e.target.value)) }))}
                                min={0}
                                style={{ width: 60, textAlign: 'center', padding: '4px 8px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                              />
                              <button
                                type="button"
                                onClick={() => updateLembar(d.id, 1)}
                                style={{ width: 28, height: 28, border: '1px solid var(--color-slate-200)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: lembar > 0 ? 600 : 400 }}>
                            {fmt(lembar * d.nilai)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-slate-200)', background: 'var(--color-slate-50)' }}>
                      <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700 }}>Saldo Awal</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: '16px', color: 'var(--color-green-700)' }}>
                        {fmt(saldoAwal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ),
        },
      ]}
    />
  )
}
