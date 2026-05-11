import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/services/api.client'
import { laporanService, getDrillDownPath } from '@/services/koperasi/laporan.service'

const mockGet = vi.mocked(apiClient.get)

describe('laporanService.preview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls the preview endpoint with required params', async () => {
    mockGet.mockResolvedValue({
      message: { columns: [], rows: [], summary: {}, truncated: false },
    })
    await laporanService.preview({
      laporan: 'rekap_zis',
      periode_start: '2026-01-01',
      periode_end: '2026-12-31',
    })
    expect(mockGet).toHaveBeenCalledTimes(1)
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('/api/method/sekolahpro.koperasi.api.laporan.preview')
    expect(url).toContain('laporan=rekap_zis')
    expect(url).toContain('periode_start=2026-01-01')
    expect(url).toContain('periode_end=2026-12-31')
    expect(url).not.toContain('nasabah=')
  })

  it('includes nasabah param when provided', async () => {
    mockGet.mockResolvedValue({
      message: { columns: [], rows: [], summary: {}, truncated: false },
    })
    await laporanService.preview({
      laporan: 'rekap_transaksi_simpanan',
      periode_start: '2026-01-01',
      periode_end: '2026-12-31',
      nasabah: 'NAS-001',
    })
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('nasabah=NAS-001')
  })
})

describe('laporanService.export', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requests blob for xlsx format', async () => {
    const blob = new Blob(['xlsx'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    mockGet.mockResolvedValue(blob)
    const result = await laporanService.export(
      { laporan: 'rekap_angsuran', periode_start: '2026-01-01', periode_end: '2026-12-31' },
      'xlsx',
    )
    expect(result).toBeInstanceOf(Blob)
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('/api/method/sekolahpro.koperasi.api.laporan.export')
    expect(url).toContain('format=xlsx')
  })

  it('supports pdf and csv formats', async () => {
    mockGet.mockResolvedValue(new Blob([]))
    await laporanService.export(
      { laporan: 'rekap_zis', periode_start: '2026-01-01', periode_end: '2026-12-31' },
      'pdf',
    )
    expect((mockGet.mock.calls[0][0] as string)).toContain('format=pdf')

    await laporanService.export(
      { laporan: 'rekap_zis', periode_start: '2026-01-01', periode_end: '2026-12-31' },
      'csv',
    )
    expect((mockGet.mock.calls[1][0] as string)).toContain('format=csv')
  })
})

describe('getDrillDownPath', () => {
  it('routes ZIS to detail pages', () => {
    expect(getDrillDownPath({ doctype: 'Penerimaan ZIS', name: 'PZ-001' }))
      .toBe('/koperasi/zis/penerimaan/PZ-001')
    expect(getDrillDownPath({ doctype: 'Penyaluran ZIS', name: 'YZ-001' }))
      .toBe('/koperasi/zis/penyaluran/YZ-001')
  })

  it('routes Sesi Kas Teller to its detail page', () => {
    expect(getDrillDownPath({ doctype: 'Sesi Kas Teller', name: 'SST-001' }))
      .toBe('/koperasi/kas-teller/SST-001')
  })

  it('returns null for doctypes without a frontend detail page', () => {
    expect(getDrillDownPath({ doctype: 'Transaksi Simpanan', name: 'TS-001' })).toBeNull()
    expect(getDrillDownPath({ doctype: 'Pembayaran Angsuran', name: 'PA-001' })).toBeNull()
  })
})
