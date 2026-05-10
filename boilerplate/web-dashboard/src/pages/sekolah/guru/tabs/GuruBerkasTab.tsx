import { useQuery } from '@tanstack/react-query'
import { FileText, ExternalLink } from 'lucide-react'
import { guruService } from '@/services/sekolah/guru.service'
import type { BerkasGuru } from '@/types/sekolah/guru.types'
import styles from './GuruTab.module.css'

interface Props {
  guruId: string
}

export function GuruBerkasTab({ guruId }: Props) {
  const { data: berkasList, isLoading } = useQuery<BerkasGuru[]>({
    queryKey: ['guru-berkas', guruId],
    queryFn: () => guruService.getBerkas(guruId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data berkas...</div>
  if (!berkasList?.length) return <div className={styles.empty}>Belum ada berkas yang diunggah.</div>

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Jenis Berkas</th>
            <th>Nama Berkas</th>
            <th>Tanggal</th>
            <th>Keterangan</th>
            <th>File</th>
          </tr>
        </thead>
        <tbody>
          {berkasList.map((b) => (
            <tr key={b.id}>
              <td>
                <span className={styles.berkasType}>
                  <FileText size={14} />
                  {b.jenis_berkas}
                </span>
              </td>
              <td>{b.nama_berkas}</td>
              <td>{b.tanggal_berkas ?? '—'}</td>
              <td>{b.keterangan ?? '—'}</td>
              <td>
                {b.file_url ? (
                  <a href={b.file_url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                    <ExternalLink size={12} /> Buka
                  </a>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
