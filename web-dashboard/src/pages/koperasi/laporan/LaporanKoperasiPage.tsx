// src/pages/koperasi/laporan/LaporanKoperasiPage.tsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, FileText, FileDown, Eye } from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { DataTable, type ColumnDef } from '@/widgets/DataTable/DataTable'
import { toast } from '@/widgets/Toast/Toast'
import { formatCurrency, formatNumber } from '@/utils/format'
import {
  laporanService,
  getDrillDownPath,
  getFrappeDeskUrl,
  type LaporanNama,
  type ExportFormat,
  type PreviewParams,
  type LaporanRow,
  type LaporanColumn,
} from '@/services/koperasi/laporan.service'

const LAPORAN_OPTIONS: { value: LaporanNama; label: string; description: string }[] = [
  {
    value: 'rekap_transaksi_simpanan',
    label: 'Rekap Transaksi Simpanan',
    description: 'Setoran, penarikan, bagi hasil, bunga per periode.',
  },
  {
    value: 'rekap_angsuran',
    label: 'Rekap Angsuran Pembiayaan',
    description: 'Pembayaran angsuran + kolektibilitas (Lancar/Kurang Lancar/Diragukan/Macet).',
  },
  {
    value: 'rekap_zis',
    label: 'Rekap ZIS',
    description: 'Penerimaan + penyaluran ZIS.',
  },
  {
    value: 'kas_teller_summary',
    label: 'Kas Teller Summary',
    description: 'Sesi kas selesai + rekonsiliasi.',
  },
]

function buildColumns(cols: LaporanColumn[]): ColumnDef<LaporanRow>[] {
  return cols.map((c) => ({
    key: c.key,
    header: c.header,
    render: (_v: unknown, row: LaporanRow) => {
      const v = row[c.key]
      if (v === null || v === undefined || v === '') return '—'
      if (c.kind === 'currency') return formatCurrency(Number(v))
      if (c.kind === 'number') return formatNumber(Number(v))
      return String(v)
    },
  }))
}

function SummaryGrid({ summary }: { summary: Record<string, number> }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 16,
      }}
    >
      {Object.entries(summary).map(([k, v]) => {
        const isCount = k.startsWith('count_')
        return (
          <div
            key={k}
            style={{
              background: 'white',
              border: '1px solid var(--color-slate-200)',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: 'var(--color-slate-500)',
                margin: 0,
                textTransform: 'capitalize',
              }}
            >
              {k.replace(/_/g, ' ')}
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 0' }}>
              {isCount ? formatNumber(v) : formatCurrency(v)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export function LaporanKoperasiPage() {
  const navigate = useNavigate()
  const [laporanNama, setLaporanNama] = useState<LaporanNama>('rekap_transaksi_simpanan')
  const [periodeStart, setPeriodeStart] = useState('')
  const [periodeEnd, setPeriodeEnd] = useState('')
  const [nasabah, setNasabah] = useState('')
  const [previewParams, setPreviewParams] = useState<PreviewParams | null>(null)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const selected = LAPORAN_OPTIONS.find((l) => l.value === laporanNama)!

  const previewQuery = useQuery({
    queryKey: ['laporan', 'preview', previewParams],
    queryFn: () => laporanService.preview(previewParams!),
    enabled: previewParams !== null,
  })

  function validate(): PreviewParams | null {
    if (!periodeStart || !periodeEnd) {
      toast.error('Periode wajib diisi.')
      return null
    }
    if (periodeStart > periodeEnd) {
      toast.error('Periode awal lebih besar dari akhir.')
      return null
    }
    return {
      laporan: laporanNama,
      periode_start: periodeStart,
      periode_end: periodeEnd,
      nasabah: nasabah || undefined,
    }
  }

  function handlePreview() {
    const params = validate()
    if (params) setPreviewParams(params)
  }

  async function handleExport(format: ExportFormat) {
    const params = validate()
    if (!params) return
    setExporting(format)
    try {
      const blob = await laporanService.export(params, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${laporanNama}_${periodeStart}_${periodeEnd}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Laporan ${format.toUpperCase()} berhasil diunduh.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunduh laporan.')
    } finally {
      setExporting(null)
    }
  }

  function handleRowClick(row: LaporanRow) {
    const source = row._source
    if (!source) return
    const path = getDrillDownPath(source)
    if (path) {
      navigate(path)
    } else {
      window.open(getFrappeDeskUrl(source), '_blank', 'noopener')
    }
  }

  const data = previewQuery.data
  const isPreviewing = previewQuery.isFetching

  return (
    <>
      <PageHeader
        title="Laporan Koperasi"
        subtitle="Preview + export laporan operasional koperasi"
      />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            background: 'white',
            border: '1px solid var(--color-slate-200)',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>Jenis Laporan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LAPORAN_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    border: `1.5px solid ${
                      laporanNama === opt.value
                        ? 'var(--color-indigo-500)'
                        : 'var(--color-slate-200)'
                    }`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background:
                      laporanNama === opt.value ? 'var(--color-indigo-50)' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="laporan"
                    value={opt.value}
                    checked={laporanNama === opt.value}
                    onChange={(e) => {
                      setLaporanNama(e.target.value as LaporanNama)
                      setPreviewParams(null)
                    }}
                    style={{ marginTop: 4 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-slate-600)' }}>
                      {opt.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <span>Periode Awal *</span>
              <input
                type="date"
                value={periodeStart}
                onChange={(e) => setPeriodeStart(e.target.value)}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <span>Periode Akhir *</span>
              <input
                type="date"
                value={periodeEnd}
                onChange={(e) => setPeriodeEnd(e.target.value)}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <span>Nasabah (opsional)</span>
              <input
                type="text"
                placeholder="NAS-..."
                value={nasabah}
                onChange={(e) => setNasabah(e.target.value)}
                disabled={selected.value === 'kas_teller_summary'}
              />
              {selected.value === 'kas_teller_summary' && (
                <small style={{ color: 'var(--color-slate-500)' }}>
                  Filter nasabah tidak berlaku untuk laporan ini.
                </small>
              )}
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={handlePreview} disabled={isPreviewing}>
              <Eye size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {isPreviewing ? 'Memuat…' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              disabled={exporting !== null}
            >
              <FileSpreadsheet size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {exporting === 'xlsx' ? 'Export…' : 'Excel'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
            >
              <FileText size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {exporting === 'pdf' ? 'Export…' : 'PDF'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
            >
              <FileDown size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {exporting === 'csv' ? 'Export…' : 'CSV'}
            </button>
          </div>
        </div>

        {previewQuery.isError && (
          <div
            style={{
              padding: 16,
              background: 'var(--color-red-50)',
              border: '1px solid var(--color-red-200)',
              borderRadius: 8,
            }}
          >
            Gagal memuat preview:{' '}
            {previewQuery.error instanceof Error ? previewQuery.error.message : 'Unknown error'}
          </div>
        )}

        {data && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              Preview — {selected.label}
            </h3>

            {data.truncated && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: 'var(--color-amber-50)',
                  border: '1px solid var(--color-amber-200)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                Menampilkan 5000 baris pertama. Persempit periode untuk hasil lengkap.
              </div>
            )}

            <SummaryGrid summary={data.summary} />

            {data.rows.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: 'var(--color-slate-500)',
                }}
              >
                Tidak ada data pada periode ini.
              </div>
            ) : (
              <DataTable
                columns={buildColumns(data.columns)}
                data={data.rows}
                rowKey={(row) =>
                  (row._source?.name as string) ?? Math.random().toString(36)
                }
                onRowClick={handleRowClick}
              />
            )}
          </div>
        )}
      </div>
    </>
  )
}
