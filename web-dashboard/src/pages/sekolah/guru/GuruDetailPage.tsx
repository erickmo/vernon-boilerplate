import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { guruService } from '@/services/sekolah/guru.service'
import { toast } from '@/widgets/Toast/Toast'
import { GuruInfoTab } from './tabs/GuruInfoTab'
import { GuruPenugasanTab } from './tabs/GuruPenugasanTab'
import { GuruAbsensiTab } from './tabs/GuruAbsensiTab'
import { GuruBerkasTab } from './tabs/GuruBerkasTab'
import type { DetailPageTab, DetailPageAction } from '@/widgets/DetailPageTemplate/DetailPageTemplate'

export default function GuruDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: guru, isLoading, error } = useQuery({
    queryKey: ['guru', id],
    queryFn: () => guruService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div>Memuat data guru...</div>
  if (error || !guru) return <div>Data guru tidak ditemukan.</div>

  const tabs: DetailPageTab[] = [
    {
      id: 'info',
      label: 'Info Dasar',
      content: <GuruInfoTab guru={guru} />,
    },
    {
      id: 'penugasan',
      label: 'Penugasan & Jadwal',
      content: <GuruPenugasanTab guruId={guru.id} />,
    },
    {
      id: 'absensi',
      label: 'Absensi',
      content: <GuruAbsensiTab guruId={guru.id} />,
    },
    {
      id: 'berkas',
      label: 'SK & Berkas',
      content: <GuruBerkasTab guruId={guru.id} />,
    },
  ]

  const actions: DetailPageAction[] = [
    {
      label: 'Edit',
      icon: <Edit size={14} />,
      onClick: () => navigate(`/sekolah/guru/${guru.id}/edit`),
      variant: 'primary',
    },
    {
      label: 'Hapus',
      icon: <Trash2 size={14} />,
      onClick: async () => {
        if (!confirm(`Hapus guru "${guru.nama}"?`)) return
        try {
          await guruService.delete(guru.id)
          toast.success(`Guru "${guru.nama}" berhasil dihapus.`)
          navigate('/sekolah/guru')
        } catch {
          toast.error('Gagal menghapus data guru.')
        }
      },
      variant: 'danger',
    },
  ]

  return (
    <DetailPageTemplate
      title={guru.nama}
      code={guru.nip}
      tabs={tabs}
      actions={actions}
      onBack={() => navigate('/sekolah/guru')}
    />
  )
}
