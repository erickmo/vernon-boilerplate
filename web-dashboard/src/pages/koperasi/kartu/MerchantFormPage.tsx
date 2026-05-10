// src/pages/koperasi/kartu/MerchantFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { merchantService } from '@/services/koperasi/kartu.service'
import { toast } from '@/widgets/Toast/Toast'
import type { Merchant } from '@/types/koperasi/kartu.types'

export function MerchantFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-merchant', id],
    queryFn: () => merchantService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<Merchant>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? merchantService.update(id!, form) : merchantService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Merchant diperbarui.' : 'Merchant berhasil ditambahkan.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-merchant'] })
      navigate('/koperasi/kartu/merchant')
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
      title={isEdit ? 'Edit Merchant' : 'Tambah Merchant'}
      onBack={() => navigate('/koperasi/kartu/merchant')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/kartu/merchant')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Merchant',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nama Merchant *</span>
                <input
                  type="text"
                  value={data.nama ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  required
                  placeholder="Kantin Utama"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Rekening Settlement *</span>
                <input
                  type="text"
                  value={data.rekening_settlement_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, rekening_settlement_id: e.target.value }))}
                  required
                  placeholder="ID Rekening Simpanan"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Status *</span>
                <select
                  value={data.status ?? 'aktif'}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Merchant['status'] }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </label>
            </div>
          ),
        },
      ]}
    />
  )
}
