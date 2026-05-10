// src/pages/koperasi/kartu/TerminalFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { terminalService, merchantService } from '@/services/koperasi/kartu.service'
import { toast } from '@/widgets/Toast/Toast'
import type { Terminal } from '@/types/koperasi/kartu.types'

export function TerminalFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-terminal', id],
    queryFn: () => terminalService.getById(id!),
    enabled: isEdit,
  })

  const { data: merchantsData } = useQuery({
    queryKey: ['koperasi-merchant-all'],
    queryFn: () => merchantService.list({ limit: 9999 }),
  })

  const [form, setForm] = useState<Partial<Terminal>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? terminalService.update(id!, form)
        : terminalService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Terminal berhasil diperbarui.' : 'Terminal berhasil ditambahkan.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-terminal'] })
      navigate('/koperasi/kartu/terminal')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  if (isEdit && isLoading) return <div style={{ padding: 32 }}>Memuat...</div>

  const merchants = merchantsData?.items ?? []

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Terminal' : 'Tambah Terminal'}
      onBack={() => navigate('/koperasi/kartu/terminal')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/kartu/terminal')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Terminal',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Terminal ID *</span>
                <input
                  type="text"
                  value={data.terminal_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, terminal_id: e.target.value }))}
                  required
                  placeholder="TERM-KANTIN-01"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Merchant *</span>
                <select
                  value={data.merchant_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, merchant_id: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="">Pilih merchant...</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>{m.nama}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>API Key *</span>
                <input
                  type="text"
                  value={data.api_key ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  required
                  placeholder="Masukkan API key terminal"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Status *</span>
                <select
                  value={data.status ?? 'aktif'}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Terminal['status'] }))}
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
