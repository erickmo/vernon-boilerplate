// src/pages/koperasi/zis/PenerimaanZISFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { penerimaanZISService } from '@/services/koperasi/zis.service'
import { toast } from '@/widgets/Toast/Toast'
import type { PenerimaanZIS } from '@/types/koperasi/zis.types'

const JENIS_DANA_OPTIONS = ['Zakat', 'Infaq', 'Shadaqah'] as const
const METODE_OPTIONS = ['Tunai', 'Transfer', 'QRIS', 'Kartu']

export function PenerimaanZISFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-penerimaan-zis', id],
    queryFn: () => penerimaanZISService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<PenerimaanZIS>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? penerimaanZISService.update(id!, form) : penerimaanZISService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Penerimaan ZIS diperbarui.' : 'Penerimaan ZIS berhasil dicatat.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-penerimaan-zis'] })
      navigate('/koperasi/zis/penerimaan')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  if (isEdit && isLoading) return <div style={{ padding: 32 }}>Memuat...</div>

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Penerimaan ZIS' : 'Tambah Penerimaan ZIS'}
      onBack={() => navigate('/koperasi/zis/penerimaan')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/zis/penerimaan')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Penerimaan',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Donatur *</span>
                <input
                  type="text"
                  value={data.donatur ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, donatur: e.target.value }))}
                  required
                  placeholder="Nama donatur"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal *</span>
                <input
                  type="date"
                  value={data.tanggal ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Jenis Dana *</span>
                <select
                  value={data.jenis_dana ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, jenis_dana: e.target.value as PenerimaanZIS['jenis_dana'] }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="">Pilih jenis dana...</option>
                  {JENIS_DANA_OPTIONS.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nominal *</span>
                <input
                  type="number"
                  value={data.nominal ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nominal: Number(e.target.value) }))}
                  required
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Metode Pembayaran *</span>
                <select
                  value={data.metode_pembayaran ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, metode_pembayaran: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="">Pilih metode...</option>
                  {METODE_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Keterangan</span>
                <textarea
                  value={data.keterangan ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                  rows={3}
                  placeholder="Keterangan tambahan (opsional)"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, resize: 'vertical' }}
                />
              </label>
            </div>
          ),
        },
      ]}
    />
  )
}
