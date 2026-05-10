// src/pages/koperasi/zis/PenyaluranZISFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { penyaluranZISService, programPenyaluranService } from '@/services/koperasi/zis.service'
import { toast } from '@/widgets/Toast/Toast'
import type { PenyaluranZIS } from '@/types/koperasi/zis.types'

export function PenyaluranZISFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-penyaluran-zis', id],
    queryFn: () => penyaluranZISService.getById(id!),
    enabled: isEdit,
  })

  const { data: programData } = useQuery({
    queryKey: ['koperasi-program-penyaluran-all'],
    queryFn: () => programPenyaluranService.list({ limit: 9999 }),
  })

  const [form, setForm] = useState<Partial<PenyaluranZIS>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form
  const programs = programData?.items ?? []

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? penyaluranZISService.update(id!, form) : penyaluranZISService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Penyaluran ZIS diperbarui.' : 'Penyaluran ZIS berhasil dicatat.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-penyaluran-zis'] })
      navigate('/koperasi/zis/penyaluran')
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
      title={isEdit ? 'Edit Penyaluran ZIS' : 'Tambah Penyaluran ZIS'}
      onBack={() => navigate('/koperasi/zis/penyaluran')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/zis/penyaluran')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Penyaluran',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Program *</span>
                <select
                  value={data.program_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, program_id: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="">Pilih program...</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Penerima *</span>
                <input
                  type="text"
                  value={data.penerima ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, penerima: e.target.value }))}
                  required
                  placeholder="Nama penerima"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nominal (Rp) *</span>
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
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal *</span>
                <input
                  type="date"
                  value={data.tanggal ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
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
