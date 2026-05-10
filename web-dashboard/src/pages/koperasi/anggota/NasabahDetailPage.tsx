// src/pages/koperasi/anggota/NasabahDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { toast } from '@/widgets/Toast/Toast'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import { NasabahInfoTab } from './tabs/NasabahInfoTab'
import { NasabahRekeningTab } from './tabs/NasabahRekeningTab'
import { NasabahPembiayaanTab } from './tabs/NasabahPembiayaanTab'
import { NasabahKartuTab } from './tabs/NasabahKartuTab'
import type { DetailPageTab, DetailPageAction } from '@/widgets/DetailPageTemplate/DetailPageTemplate'

export default function NasabahDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const nasabahId = id!

  const { data: nasabah, isLoading, error } = useQuery({
    queryKey: ['nasabah', nasabahId],
    queryFn: () => nasabahService.getById(nasabahId),
    enabled: !!nasabahId,
  })

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Memuat data nasabah...</div>
  }

  if (error || !nasabah) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>
        Nasabah tidak ditemukan atau terjadi kesalahan.
      </div>
    )
  }

  const tabs: DetailPageTab[] = [
    {
      id: 'info',
      label: 'Info Dasar',
      content: <NasabahInfoTab nasabah={nasabah} />,
    },
    {
      id: 'rekening',
      label: 'Rekening Simpanan',
      content: <NasabahRekeningTab nasabahId={nasabahId} />,
    },
    {
      id: 'pembiayaan',
      label: 'Pembiayaan',
      content: <NasabahPembiayaanTab nasabahId={nasabahId} />,
    },
    {
      id: 'kartu',
      label: 'Kartu',
      content: <NasabahKartuTab nasabahId={nasabahId} />,
    },
  ]

  const actions: DetailPageAction[] = [
    {
      label: 'Edit',
      icon: <Edit size={14} />,
      onClick: () => navigate(`/koperasi/anggota/nasabah/${nasabahId}/edit`),
      variant: 'primary',
    },
    {
      label: 'Hapus',
      icon: <Trash2 size={14} />,
      onClick: async () => {
        if (!confirm(`Hapus nasabah "${nasabah.nama}"? Tindakan ini tidak dapat dibatalkan.`)) return
        try {
          await nasabahService.delete(nasabahId)
          await queryClient.invalidateQueries({ queryKey: ['nasabah'] })
          toast.success(`Nasabah ${nasabah.nama} berhasil dihapus.`)
          navigate('/koperasi/anggota/nasabah')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Gagal menghapus nasabah.')
        }
      },
      variant: 'danger',
    },
  ]

  return (
    <DetailPageTemplate
      title={nasabah.nama}
      code={nasabah.nik}
      onBack={() => navigate('/koperasi/anggota/nasabah')}
      backLabel="Daftar Nasabah"
      tabs={tabs}
      actions={actions}
    />
  )
}
