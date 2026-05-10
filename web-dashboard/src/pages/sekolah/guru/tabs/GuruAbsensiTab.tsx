import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api.client'
import styles from './GuruTab.module.css'

interface AbsensiGuruEntry {
  id: string
  tanggal: string
  keterangan: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'
  kelas?: string
  mata_pelajaran?: string
}

interface Props {
  guruId: string
}

export function GuruAbsensiTab({ guruId }: Props) {
  const { data: absensiList, isLoading } = useQuery<AbsensiGuruEntry[]>({
    queryKey: ['guru-absensi', guruId],
    queryFn: () =>
      apiClient.get<AbsensiGuruEntry[]>(
        `/api/resource/Absensi Guru?filters=[["guru","=","${guruId}"]]&fields=["name","tanggal","keterangan","kelas","mata_pelajaran"]&limit_page_length=100&order_by=tanggal desc`
      ),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data absensi...</div>
  if (!absensiList?.length) return <div className={styles.empty}>Belum ada data absensi guru.</div>

  const summary = absensiList.reduce(
    (acc, a) => {
      acc[a.keterangan] = (acc[a.keterangan] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className={styles.tableWrap}>
      <div className={styles.summaryRow}>
        {(['Hadir', 'Sakit', 'Izin', 'Alpha'] as const).map((k) => (
          <div key={k} className={styles.summaryCard} data-type={k.toLowerCase()}>
            <span className={styles.summaryLabel}>{k}</span>
            <span className={styles.summaryCount}>{summary[k] ?? 0}</span>
          </div>
        ))}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Mata Pelajaran</th>
            <th>Kelas</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {absensiList.map((a) => (
            <tr key={a.id}>
              <td>{a.tanggal}</td>
              <td>{a.mata_pelajaran ?? '—'}</td>
              <td>{a.kelas ?? '—'}</td>
              <td>
                <span data-status={a.keterangan.toLowerCase()}>{a.keterangan}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
