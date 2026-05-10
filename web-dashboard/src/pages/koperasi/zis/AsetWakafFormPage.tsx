// src/pages/koperasi/zis/AsetWakafFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { asetWakafService } from '@/services/koperasi/zis.service'
import { toast } from '@/widgets/Toast/Toast'
import type { AsetWakaf } from '@/types/koperasi/zis.types'

const JENIS_ASET_OPTIONS = ['Tanah', 'Bangunan', 'Kendaraan', 'Peralatan', 'Lainnya']

export function AsetWakafFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-aset-wakaf', id],
    queryFn: () => asetWakafService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<AsetWakaf>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? asetWakafService.update(id!, form) : asetWakafService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Aset wakaf diperbarui.' : 'Aset wakaf berhasil ditambahkan.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-aset-wakaf'] })
      navigate('/koperasi/zis/wakaf')
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
      title={isEdit ? 'Edit Aset Wakaf' : 'Tambah Aset Wakaf'}
      onBack={() => navigate('/koperasi/zis/wakaf')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/zis/wakaf')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Aset Wakaf',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nama Aset *</span>
                <input
                  type="text"
                  value={data.nama_aset ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nama_aset: e.target.value }))}
                  required
                  placeholder="Nama aset wakaf"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Jenis Aset *</span>
                <select
                  value={data.jenis_aset ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, jenis_aset: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="">Pilih jenis...</option>
                  {JENIS_ASET_OPTIONS.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nilai (Rp) *</span>
                <input
                  type="number"
                  value={data.nilai ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nilai: Number(e.target.value) }))}
                  required
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Wakif *</span>
                <input
                  type="text"
                  value={data.wakif ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, wakif: e.target.value }))}
                  required
                  placeholder="Nama wakif (pemberi wakaf)"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal Wakaf *</span>
                <input
                  type="date"
                  value={data.tanggal_wakaf ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal_wakaf: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Lokasi</span>
                <input
                  type="text"
                  value={data.lokasi ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))}
                  placeholder="Lokasi aset (opsional)"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Keterangan</span>
                <textarea
                  value={data.keterangan ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                  rows={3}
                  placeholder="Keterangan aset wakaf (opsional)"
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
