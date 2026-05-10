import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api.client'
import styles from './SiswaTab.module.css'

interface AbsensiEntry {
  id: string
  tanggal: string
  mata_pelajaran: string
  keterangan: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'
  jam_ke?: number
}

const ABSENSI_KEYS = ['Hadir', 'Sakit', 'Izin', 'Alpha'] as const

interface Props {
  siswaId: string
}

export function SiswaAbsensiTab({ siswaId }: Props) {
  const { data: absensiList, isLoading } = useQuery<AbsensiEntry[]>({
    queryKey: ['siswa-absensi', siswaId],
    queryFn: () =>
      apiClient.get<AbsensiEntry[]>(
        `/api/resource/Absensi Siswa?filters=[["siswa","=","${siswaId}"]]&fields=["name","tanggal","mata_pelajaran","keterangan","jam_ke"]&limit_page_length=100&order_by=tanggal desc`
      ),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data absensi...</div>
  if (!absensiList?.length) return <div className={styles.empty}>Belum ada data absensi.</div>

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
        {ABSENSI_KEYS.map((k) => (
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
            <th>Jam Ke</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {absensiList.map((a) => (
            <tr key={a.id}>
              <td>{a.tanggal}</td>
              <td>{a.mata_pelajaran}</td>
              <td>{a.jam_ke ?? '—'}</td>
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
