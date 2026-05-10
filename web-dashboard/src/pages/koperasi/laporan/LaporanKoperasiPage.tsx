// src/pages/koperasi/laporan/LaporanKoperasiPage.tsx

import { useState } from 'react'
import { FileSpreadsheet, FileText, Download } from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { apiClient } from '@/services/api.client'
import { toast } from '@/widgets/Toast/Toast'

type LaporanNama =
  | 'rekap_transaksi_simpanan'
  | 'rekap_angsuran'
  | 'rekap_zis'
  | 'kas_teller_summary'

const LAPORAN_OPTIONS: { value: LaporanNama; label: string; description: string }[] = [
  {
    value: 'rekap_transaksi_simpanan',
    label: 'Rekap Transaksi Simpanan',
    description: 'Rekap semua transaksi setoran, penarikan, dan bagi hasil per periode.',
  },
  {
    value: 'rekap_angsuran',
    label: 'Rekap Angsuran Pembiayaan',
    description: 'Rekap pembayaran angsuran dan kolektibilitas pembiayaan per periode.',
  },
  {
    value: 'rekap_zis',
    label: 'Rekap ZIS',
    description: 'Rekap penerimaan dan penyaluran ZIS per periode.',
  },
  {
    value: 'kas_teller_summary',
    label: 'Kas Teller Summary',
    description: 'Ringkasan sesi kas teller beserta total transaksi per periode.',
  },
]

export function LaporanKoperasiPage() {
  const [laporanNama, setLaporanNama] = useState<LaporanNama>('rekap_transaksi_simpanan')
  const [periodeStart, setPeriodeStart] = useState('')
  const [periodeEnd, setPeriodeEnd] = useState('')
  const [nasabah, setNasabah] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const selectedLaporan = LAPORAN_OPTIONS.find((l) => l.value === laporanNama)!

  async function handleExport(format: 'xlsx' | 'pdf') {
    if (!periodeStart || !periodeEnd) {
      toast.error('Periode wajib diisi.')
      return
    }

    setIsExporting(true)
    try {
      const params = new URLSearchParams({
        laporan: laporanNama,
        periode_start: periodeStart,
        periode_end: periodeEnd,
        format,
        ...(nasabah ? { nasabah } : {}),
      })

      const blob = await apiClient.get<Blob>(
        `/api/method/sekolahpro.koperasi.api.laporan.export?${params.toString()}`,
      )

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${laporanNama}_${periodeStart}_${periodeEnd}.${format}`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Laporan berhasil diunduh sebagai ${format.toUpperCase()}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunduh laporan.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <PageHeader title="Export Laporan Koperasi" />

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
        {/* Pilih Laporan */}
        <div style={{ background: 'white', border: '1px solid var(--color-slate-200)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 16, color: 'var(--color-slate-800)' }}>
            Jenis Laporan
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LAPORAN_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  border: `1.5px solid ${laporanNama === opt.value ? 'var(--color-indigo-500)' : 'var(--color-slate-200)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: laporanNama === opt.value ? 'var(--color-indigo-50)' : 'white',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <input
                  type="radio"
                  name="laporan"
                  value={opt.value}
                  checked={laporanNama === opt.value}
                  onChange={() => setLaporanNama(opt.value)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-slate-800)' }}>{opt.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginTop: 2 }}>{opt.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div style={{ background: 'white', border: '1px solid var(--color-slate-200)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 16, color: 'var(--color-slate-800)' }}>
            Filter
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Periode Mulai *</span>
              <input
                type="date"
                value={periodeStart}
                onChange={(e) => setPeriodeStart(e.target.value)}
                required
                style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Periode Selesai *</span>
              <input
                type="date"
                value={periodeEnd}
                onChange={(e) => setPeriodeEnd(e.target.value)}
                required
                style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Nasabah (opsional)</span>
              <input
                type="text"
                value={nasabah}
                onChange={(e) => setNasabah(e.target.value)}
                placeholder="Kosongkan untuk semua nasabah"
                style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
              />
            </label>
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ background: 'white', border: '1px solid var(--color-slate-200)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 16, color: 'var(--color-slate-800)' }}>
            Export
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-slate-500)', marginBottom: 16 }}>
            Unduh laporan <strong>{selectedLaporan.label}</strong> dalam format yang diinginkan.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => void handleExport('xlsx')}
              disabled={isExporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: 'var(--color-green-600)', color: 'white', fontWeight: 600, fontSize: '14px',
              }}
            >
              <FileSpreadsheet size={16} />
              {isExporting ? 'Mengunduh...' : 'Export XLSX'}
            </button>
            <button
              type="button"
              onClick={() => void handleExport('pdf')}
              disabled={isExporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: 'var(--color-red-600)', color: 'white', fontWeight: 600, fontSize: '14px',
              }}
            >
              <FileText size={16} />
              {isExporting ? 'Mengunduh...' : 'Export PDF'}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-slate-400)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Download size={11} />
            File akan langsung diunduh ke perangkat Anda.
          </p>
        </div>
      </div>
    </>
  )
}
