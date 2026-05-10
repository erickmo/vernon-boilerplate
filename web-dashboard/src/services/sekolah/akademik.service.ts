// src/services/sekolah/akademik.service.ts
import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type {
  MataPelajaran,
  JadwalPelajaran,
  AbsensiHarian,
  AbsensiGuru,
  EntriNilai,
  Raport,
  LaporanDinasReportName,
  LaporanDinasFilters,
} from '@/types/sekolah/akademik.types'

// ─── Frappe base path ─────────────────────────────────────────────────────────
// All paths below are relative to VITE_API_BASE_URL.
// Frappe REST: /api/resource/<Doctype Name>  (spaces → %20 handled by apiClient)

export const mataPelajaranService = createEntityService<MataPelajaran>(
  '/api/resource/Mata Pelajaran',
)

export const jadwalService = createEntityService<JadwalPelajaran>(
  '/api/resource/Jadwal Pelajaran',
)

export const absensiSiswaService = createEntityService<AbsensiHarian>(
  '/api/resource/Absensi Harian',
)

export const absensiGuruService = createEntityService<AbsensiGuru>(
  '/api/resource/Absensi Guru',
)

export const penilaianService = createEntityService<EntriNilai>(
  '/api/resource/Entri Nilai',
)

export const raportService = createEntityService<Raport>(
  '/api/resource/Raport',
)

// ─── Laporan Dinas export helpers ────────────────────────────────────────────

const LAPORAN_BASE = '/api/method/sekolahpro.akademik.api.laporan_dinas'

function buildLaporanParams(
  reportName: LaporanDinasReportName,
  filters: LaporanDinasFilters,
): string {
  return (
    `report_name=${encodeURIComponent(reportName)}` +
    `&filters=${encodeURIComponent(JSON.stringify(filters))}`
  )
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: mimeType })
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const laporanDinasService = {
  exportXlsx: async (
    reportName: LaporanDinasReportName,
    filters: LaporanDinasFilters,
  ): Promise<void> => {
    const qs = buildLaporanParams(reportName, filters)
    const res = await apiClient.get<{ message: string }>(
      `${LAPORAN_BASE}.export_xlsx?${qs}`,
    )
    const blob = base64ToBlob(
      res.message,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    const safeReport = reportName.replace(/\s+/g, '_')
    triggerDownload(blob, `${safeReport}.xlsx`)
  },

  exportPdf: async (
    reportName: LaporanDinasReportName,
    filters: LaporanDinasFilters,
  ): Promise<void> => {
    const qs = buildLaporanParams(reportName, filters)
    const res = await apiClient.get<{ message: string }>(
      `${LAPORAN_BASE}.export_pdf?${qs}`,
    )
    const blob = base64ToBlob(res.message, 'application/pdf')
    const safeReport = reportName.replace(/\s+/g, '_')
    triggerDownload(blob, `${safeReport}.pdf`)
  },

  exportJson: async (
    reportName: LaporanDinasReportName,
    filters: LaporanDinasFilters,
  ): Promise<void> => {
    const qs = buildLaporanParams(reportName, filters) + '&format=json'
    const res = await apiClient.get<{ message: unknown }>(
      `${LAPORAN_BASE}.export_data?${qs}`,
    )
    const blob = new Blob([JSON.stringify(res.message, null, 2)], {
      type: 'application/json',
    })
    const safeReport = reportName.replace(/\s+/g, '_')
    triggerDownload(blob, `${safeReport}.json`)
  },
}
