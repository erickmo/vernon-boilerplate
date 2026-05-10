// src/pages/koperasi/zis/ProgramPenyaluranFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { programPenyaluranService } from '@/services/koperasi/zis.service'
import { toast } from '@/widgets/Toast/Toast'
import type { ProgramPenyaluran } from '@/types/koperasi/zis.types'

export function ProgramPenyaluranFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-program-penyaluran', id],
    queryFn: () => programPenyaluranService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<ProgramPenyaluran>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? programPenyaluranService.update(id!, form) : programPenyaluranService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Program diperbarui.' : 'Program berhasil ditambahkan.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-program-penyaluran'] })
      navigate('/koperasi/zis/program')
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
      title={isEdit ? 'Edit Program Penyaluran' : 'Tambah Program Penyaluran'}
      onBack={() => navigate('/koperasi/zis/program')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/zis/program')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Program',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nama Program *</span>
                <input
                  type="text"
                  value={data.nama ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  required
                  placeholder="Nama program penyaluran"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Target Dana (Rp) *</span>
                <input
                  type="number"
                  value={data.target_dana ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, target_dana: Number(e.target.value) }))}
                  required
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Status *</span>
                <select
                  value={data.status ?? 'aktif'}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProgramPenyaluran['status'] }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="aktif">Aktif</option>
                  <option value="selesai">Selesai</option>
                  <option value="ditunda">Ditunda</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal Mulai *</span>
                <input
                  type="date"
                  value={data.tanggal_mulai ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal_mulai: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal Selesai *</span>
                <input
                  type="date"
                  value={data.tanggal_selesai ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal_selesai: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Deskripsi</span>
                <textarea
                  value={data.deskripsi ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                  rows={3}
                  placeholder="Deskripsi program (opsional)"
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
