import { useQuery } from '@tanstack/react-query'
import { siswaService } from '@/services/sekolah/siswa.service'
import type { WaliSiswa } from '@/types/sekolah/siswa.types'
import styles from './SiswaTab.module.css'

interface Props {
  siswaId: string
}

export function SiswaWaliTab({ siswaId }: Props) {
  const { data: waliList, isLoading } = useQuery<WaliSiswa[]>({
    queryKey: ['siswa-wali', siswaId],
    queryFn: () => siswaService.getWali(siswaId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data wali...</div>
  if (!waliList?.length) return <div className={styles.empty}>Belum ada data wali siswa.</div>

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nama Wali</th>
            <th>Hubungan</th>
            <th>No. Telepon</th>
            <th>Pekerjaan</th>
          </tr>
        </thead>
        <tbody>
          {waliList.map((wali) => (
            <tr key={wali.id}>
              <td>{wali.nama_wali}</td>
              <td>{wali.hubungan}</td>
              <td>{wali.no_telepon}</td>
              <td>{wali.pekerjaan ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
