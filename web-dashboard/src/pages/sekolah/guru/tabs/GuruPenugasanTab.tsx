import { useQuery } from '@tanstack/react-query'
import { guruService } from '@/services/sekolah/guru.service'
import type { PenugasanGuru } from '@/types/sekolah/guru.types'
import styles from './GuruTab.module.css'

interface Props {
  guruId: string
}

export function GuruPenugasanTab({ guruId }: Props) {
  const { data: penugasanList, isLoading } = useQuery<PenugasanGuru[]>({
    queryKey: ['guru-penugasan', guruId],
    queryFn: () => guruService.getPenugasan(guruId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data penugasan...</div>
  if (!penugasanList?.length) return <div className={styles.empty}>Belum ada data penugasan.</div>

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tahun Ajaran</th>
            <th>Semester</th>
            <th>Mata Pelajaran</th>
            <th>Kelas</th>
            <th>Jam Mengajar</th>
          </tr>
        </thead>
        <tbody>
          {penugasanList.map((p) => (
            <tr key={p.id}>
              <td>{p.tahun_ajaran}</td>
              <td>{p.semester}</td>
              <td>{p.mata_pelajaran}</td>
              <td>{p.kelas}</td>
              <td>{p.jam_mengajar ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
