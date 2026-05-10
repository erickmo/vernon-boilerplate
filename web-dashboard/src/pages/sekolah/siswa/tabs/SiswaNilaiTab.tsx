import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api.client'
import styles from './SiswaTab.module.css'

interface NilaiEntry {
  id: string
  mata_pelajaran: string
  semester: string
  tahun_ajaran: string
  nilai_harian?: number
  nilai_uts?: number
  nilai_uas?: number
  nilai_akhir?: number
}

interface Props {
  siswaId: string
}

export function SiswaNilaiTab({ siswaId }: Props) {
  const { data: nilaiList, isLoading } = useQuery<NilaiEntry[]>({
    queryKey: ['siswa-nilai', siswaId],
    queryFn: () =>
      apiClient.get<NilaiEntry[]>(
        `/api/resource/Nilai Siswa?filters=[["siswa","=","${siswaId}"]]&fields=["name","mata_pelajaran","semester","tahun_ajaran","nilai_harian","nilai_uts","nilai_uas","nilai_akhir"]&order_by=tahun_ajaran desc, semester asc`
      ),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data nilai...</div>
  if (!nilaiList?.length) return <div className={styles.empty}>Belum ada data nilai.</div>

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mata Pelajaran</th>
            <th>Tahun Ajaran</th>
            <th>Semester</th>
            <th>Harian</th>
            <th>UTS</th>
            <th>UAS</th>
            <th>Akhir</th>
          </tr>
        </thead>
        <tbody>
          {nilaiList.map((n) => (
            <tr key={n.id}>
              <td>{n.mata_pelajaran}</td>
              <td>{n.tahun_ajaran}</td>
              <td>{n.semester}</td>
              <td>{n.nilai_harian ?? '—'}</td>
              <td>{n.nilai_uts ?? '—'}</td>
              <td>{n.nilai_uas ?? '—'}</td>
              <td>
                <strong>{n.nilai_akhir ?? '—'}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
