// src/pages/koperasi/pengaturan/PengaturanKoperasiPage.tsx

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { pengaturanKoperasiService } from '@/services/koperasi/pengaturan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { PengaturanKoperasi } from '@/types/koperasi/pengaturan.types'

export function PengaturanKoperasiPage() {
  const queryClient = useQueryClient()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-pengaturan'],
    queryFn: pengaturanKoperasiService.get,
  })

  const [form, setForm] = useState<Partial<PengaturanKoperasi>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  useEffect(() => {
    if (existing) setForm(existing)
  }, [existing])

  const mutation = useMutation({
    mutationFn: () => pengaturanKoperasiService.save(form),
    onSuccess: () => {
      toast.success('Pengaturan koperasi berhasil disimpan.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-pengaturan'] })
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  if (isLoading) return <div style={{ padding: 32 }}>Memuat pengaturan...</div>

  return (
    <FormPageTemplate
      title="Pengaturan Koperasi"
      onBack={() => window.history.back()}
      backLabel="Kembali"
      onSubmit={handleSubmit}
      onCancel={() => { if (existing) setForm(existing) }}
      isSubmitting={mutation.isPending}
      submitLabel="Simpan Pengaturan"
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Konfigurasi',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px', padding: '4px 0', maxWidth: 640 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Limit Transaksi (Rp)</span>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>Nominal maksimal per transaksi kartu</span>
                <input
                  type="number"
                  value={form.limit_transaksi ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, limit_transaksi: Number(e.target.value) }))}
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, marginTop: 4 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Biaya Admin Bulanan (Rp)</span>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>Biaya admin rekening simpanan per bulan</span>
                <input
                  type="number"
                  value={form.biaya_admin_bulanan ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, biaya_admin_bulanan: Number(e.target.value) }))}
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, marginTop: 4 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Maks. Percobaan PIN</span>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>Kartu diblokir otomatis setelah N kali salah PIN</span>
                <input
                  type="number"
                  value={form.max_pin_attempts ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, max_pin_attempts: Number(e.target.value) }))}
                  min={1}
                  max={10}
                  placeholder="3"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, marginTop: 4 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Denda Terlambat/Hari (Rp)</span>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>Denda angsuran per hari keterlambatan</span>
                <input
                  type="number"
                  value={form.denda_terlambat_per_hari ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, denda_terlambat_per_hari: Number(e.target.value) }))}
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, marginTop: 4 }}
                />
              </label>
            </div>
          ),
        },
      ]}
    />
  )
}
