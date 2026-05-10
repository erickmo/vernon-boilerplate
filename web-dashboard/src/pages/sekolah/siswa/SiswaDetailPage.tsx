import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { siswaService } from '@/services/sekolah/siswa.service'
import { toast } from '@/widgets/Toast/Toast'
import { SiswaInfoTab } from './tabs/SiswaInfoTab'
import { SiswaWaliTab } from './tabs/SiswaWaliTab'
import { SiswaRombelTab } from './tabs/SiswaRombelTab'
import { SiswaAbsensiTab } from './tabs/SiswaAbsensiTab'
import { SiswaNilaiTab } from './tabs/SiswaNilaiTab'
import { SiswaMutasiTab } from './tabs/SiswaMutasiTab'
import type { DetailPageTab, DetailPageAction } from '@/widgets/DetailPageTemplate/DetailPageTemplate'

export default function SiswaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: siswa, isLoading, error } = useQuery({
    queryKey: ['siswa', id],
    queryFn: () => siswaService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div>Memuat data siswa...</div>
  if (error || !siswa) return <div>Data siswa tidak ditemukan.</div>

  const tabs: DetailPageTab[] = [
    {
      id: 'info',
      label: 'Info Dasar',
      content: <SiswaInfoTab siswa={siswa} />,
    },
    {
      id: 'wali',
      label: 'Wali',
      content: <SiswaWaliTab siswaId={siswa.id} />,
    },
    {
      id: 'rombel',
      label: 'Rombel',
      content: <SiswaRombelTab siswaId={siswa.id} />,
    },
    {
      id: 'absensi',
      label: 'Absensi',
      content: <SiswaAbsensiTab siswaId={siswa.id} />,
    },
    {
      id: 'nilai',
      label: 'Nilai & Raport',
      content: <SiswaNilaiTab siswaId={siswa.id} />,
    },
    {
      id: 'mutasi',
      label: 'Mutasi/Kelulusan',
      content: <SiswaMutasiTab siswaId={siswa.id} />,
    },
  ]

  const actions: DetailPageAction[] = [
    {
      label: 'Edit',
      icon: <Edit size={14} />,
      onClick: () => navigate(`/sekolah/siswa/${siswa.id}/edit`),
      variant: 'primary',
    },
    {
      label: 'Hapus',
      icon: <Trash2 size={14} />,
      onClick: async () => {
        if (!confirm(`Hapus siswa "${siswa.nama_lengkap}"?`)) return
        try {
          await siswaService.delete(siswa.id)
          toast.success(`Siswa "${siswa.nama_lengkap}" berhasil dihapus.`)
          navigate('/sekolah/siswa')
        } catch {
          toast.error('Gagal menghapus data siswa.')
        }
      },
      variant: 'danger',
    },
  ]

  return (
    <DetailPageTemplate
      title={siswa.nama_lengkap}
      code={siswa.nis}
      tabs={tabs}
      actions={actions}
      onBack={() => navigate('/sekolah/siswa')}
    />
  )
}
