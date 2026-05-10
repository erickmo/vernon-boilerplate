// src/pages/sekolah/akademik/LaporanDinasPage.tsx
import { useState } from 'react'
import { FileSpreadsheet, FileText, Code2, Loader2 } from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { PageWrapper } from '@/widgets/PageWrapper/PageWrapper'
import { laporanDinasService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type {
  LaporanDinasReportName,
  LaporanDinasFilters,
} from '@/types/sekolah/akademik.types'
import styles from './LaporanDinas.module.css'

const REPORT_OPTIONS: { value: LaporanDinasReportName; label: string }[] = [
  { value: 'Rekap Absensi Siswa', label: 'Rekap Absensi Siswa' },
  { value: 'Rekap Absensi Guru', label: 'Rekap Absensi Guru' },
  { value: 'Laporan TPG', label: 'Laporan TPG (Tunjangan Profesi Guru)' },
]

// Fields shown per report
const REPORT_FILTER_FIELDS: Record<LaporanDinasReportName, (keyof LaporanDinasFilters)[]> = {
  'Rekap Absensi Siswa': ['sekolah', 'tahun_ajaran', 'semester', 'rombel'],
  'Rekap Absensi Guru': ['sekolah', 'bulan', 'tahun_ajaran'],
  'Laporan TPG': ['sekolah', 'tahun_ajaran', 'semester'],
}

const SEMESTER_OPTIONS = ['Ganjil', 'Genap']

const FIELD_LABELS: Record<keyof LaporanDinasFilters, string> = {
  sekolah: 'Sekolah',
  tahun_ajaran: 'Tahun Ajaran',
  semester: 'Semester',
  rombel: 'Rombongan Belajar',
  bulan: 'Bulan (YYYY-MM)',
}

type ExportFormat = 'xlsx' | 'pdf' | 'json'

export default function LaporanDinasPage() {
  const [reportName, setReportName] = useState<LaporanDinasReportName | ''>('')
  const [filters, setFilters] = useState<LaporanDinasFilters>({})
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null)

  const activeFields = reportName ? REPORT_FILTER_FIELDS[reportName] : []

  function handleFilterChange(field: keyof LaporanDinasFilters, value: string) {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }))
  }

  function handleReportChange(value: string) {
    setReportName(value as LaporanDinasReportName | '')
    setFilters({})  // reset filters when report changes
  }

  async function handleExport(format: ExportFormat) {
    if (!reportName) {
      toast.error('Pilih jenis laporan terlebih dahulu')
      return
    }
    setLoadingFormat(format)
    try {
      if (format === 'xlsx') {
        await laporanDinasService.exportXlsx(reportName, filters)
      } else if (format === 'pdf') {
        await laporanDinasService.exportPdf(reportName, filters)
      } else {
        await laporanDinasService.exportJson(reportName, filters)
      }
      toast.success(`Laporan berhasil diunduh (${format.toUpperCase()})`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Gagal mengunduh laporan ${format.toUpperCase()}`)
    } finally {
      setLoadingFormat(null)
    }
  }

  return (
    <>
      <PageHeader title="Laporan Dinas" />
      <PageWrapper error={null} onRetry={() => {}}>
        <div className={styles.container}>
          {/* Report selector */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Pilih Jenis Laporan</h2>
            <div className={styles.field}>
              <label className={styles.label}>Jenis Laporan <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={reportName}
                onChange={(e) => handleReportChange(e.target.value)}
              >
                <option value="">— Pilih laporan —</option>
                {REPORT_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter fields — only shown after report is selected */}
          {reportName && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Filter Laporan</h2>
              <div className={styles.filterGrid}>
                {activeFields.map((field) => (
                  <div key={field} className={styles.field}>
                    <label className={styles.label}>{FIELD_LABELS[field]}</label>
                    {field === 'semester' ? (
                      <select
                        className={styles.select}
                        value={filters.semester ?? ''}
                        onChange={(e) => handleFilterChange('semester', e.target.value)}
                      >
                        <option value="">Semua Semester</option>
                        {SEMESTER_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={styles.input}
                        type={field === 'bulan' ? 'month' : 'text'}
                        value={(filters[field] as string | undefined) ?? ''}
                        onChange={(e) => handleFilterChange(field, e.target.value)}
                        placeholder={field === 'bulan' ? 'YYYY-MM' : FIELD_LABELS[field]}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export buttons */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Unduh Laporan</h2>
            <p className={styles.exportHint}>
              Pilih format laporan yang ingin diunduh. Filter yang telah diisi akan diterapkan secara otomatis.
            </p>
            <div className={styles.exportButtons}>
              <button
                className={styles.exportBtn}
                onClick={() => void handleExport('xlsx')}
                disabled={!reportName || loadingFormat !== null}
              >
                {loadingFormat === 'xlsx'
                  ? <Loader2 size={18} className={styles.spin} />
                  : <FileSpreadsheet size={18} />
                }
                Excel (.xlsx)
              </button>
              <button
                className={styles.exportBtn}
                onClick={() => void handleExport('pdf')}
                disabled={!reportName || loadingFormat !== null}
              >
                {loadingFormat === 'pdf'
                  ? <Loader2 size={18} className={styles.spin} />
                  : <FileText size={18} />
                }
                PDF
              </button>
              <button
                className={styles.exportBtn}
                onClick={() => void handleExport('json')}
                disabled={!reportName || loadingFormat !== null}
              >
                {loadingFormat === 'json'
                  ? <Loader2 size={18} className={styles.spin} />
                  : <Code2 size={18} />
                }
                JSON (Data Dinas)
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
