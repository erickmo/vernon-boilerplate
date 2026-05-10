import { useQuery } from '@tanstack/react-query'
import { siswaService } from '@/services/sekolah/siswa.service'
import type { MutasiSiswa, KelulusanSiswa } from '@/types/sekolah/siswa.types'
import styles from './SiswaTab.module.css'

interface Props {
  siswaId: string
}

export function SiswaMutasiTab({ siswaId }: Props) {
  const { data: mutasiList, isLoading: loadingMutasi } = useQuery<MutasiSiswa[]>({
    queryKey: ['siswa-mutasi', siswaId],
    queryFn: () => siswaService.getMutasi(siswaId),
  })

  const { data: kelulusanList, isLoading: loadingKelulusan } = useQuery<KelulusanSiswa[]>({
    queryKey: ['siswa-kelulusan', siswaId],
    queryFn: () => siswaService.getKelulusan(siswaId),
  })

  if (loadingMutasi || loadingKelulusan) return <div className={styles.loading}>Memuat data...</div>

  const hasMutasi = mutasiList && mutasiList.length > 0
  const hasKelulusan = kelulusanList && kelulusanList.length > 0

  if (!hasMutasi && !hasKelulusan) {
    return <div className={styles.empty}>Tidak ada data mutasi atau kelulusan.</div>
  }

  return (
    <div className={styles.rombelWrap}>
      {hasMutasi && (
        <section>
          <h4 className={styles.sectionTitle}>Riwayat Mutasi</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Sekolah Asal</th>
                <th>Sekolah Tujuan</th>
                <th>Alasan</th>
              </tr>
            </thead>
            <tbody>
              {mutasiList.map((m) => (
                <tr key={m.id}>
                  <td>{m.tanggal_mutasi}</td>
                  <td>{m.jenis_mutasi}</td>
                  <td>{m.sekolah_asal ?? '—'}</td>
                  <td>{m.sekolah_tujuan ?? '—'}</td>
                  <td>{m.alasan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {hasKelulusan && (
        <section>
          <h4 className={styles.sectionTitle}>Data Kelulusan</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal Lulus</th>
                <th>Tahun Ajaran</th>
                <th>No. Ijazah</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {kelulusanList.map((k) => (
                <tr key={k.id}>
                  <td>{k.tanggal_lulus}</td>
                  <td>{k.tahun_ajaran}</td>
                  <td>{k.nomor_ijazah ?? '—'}</td>
                  <td>{k.keterangan ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
