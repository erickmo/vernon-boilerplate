import { useQuery } from '@tanstack/react-query'
import { siswaService } from '@/services/sekolah/siswa.service'
import type { AnggotaRombel } from '@/types/sekolah/siswa.types'
import styles from './SiswaTab.module.css'

interface Props {
  siswaId: string
}

export function SiswaRombelTab({ siswaId }: Props) {
  const { data: rombelList, isLoading } = useQuery<AnggotaRombel[]>({
    queryKey: ['siswa-rombel', siswaId],
    queryFn: () => siswaService.getRombel(siswaId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data rombel...</div>
  if (!rombelList?.length) return <div className={styles.empty}>Belum ada data rombongan belajar.</div>

  const aktif = rombelList.filter((r) => r.is_aktif)
  const historis = rombelList.filter((r) => !r.is_aktif)

  return (
    <div className={styles.rombelWrap}>
      {aktif.length > 0 && (
        <section>
          <h4 className={styles.sectionTitle}>Rombel Aktif</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rombel</th>
                <th>Tahun Ajaran</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {aktif.map((r) => (
                <tr key={r.id}>
                  <td>{r.rombel}</td>
                  <td>{r.tahun_ajaran}</td>
                  <td>{r.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {historis.length > 0 && (
        <section>
          <h4 className={styles.sectionTitle}>Riwayat Rombel</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rombel</th>
                <th>Tahun Ajaran</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {historis.map((r) => (
                <tr key={r.id}>
                  <td>{r.rombel}</td>
                  <td>{r.tahun_ajaran}</td>
                  <td>{r.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
