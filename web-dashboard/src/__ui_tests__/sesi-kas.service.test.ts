import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '@/services/api.client'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)

describe('sesiKasTellerService.getActiveForMe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hits the whitelisted endpoint and returns the message field', async () => {
    mockGet.mockResolvedValue({ message: { name: 'SST-001', status: 'Aktif' } })
    const result = await sesiKasTellerService.getActiveForMe()
    expect(mockGet).toHaveBeenCalledWith(
      '/api/method/sekolahpro.koperasi.api.sesi_kas.get_active_for_me',
    )
    expect(result).toEqual({ name: 'SST-001', status: 'Aktif' })
  })

  it('returns null when message is null', async () => {
    mockGet.mockResolvedValue({ message: null })
    const result = await sesiKasTellerService.getActiveForMe()
    expect(result).toBeNull()
  })
})

describe('sesiKasTellerService.bukaSesi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('POSTs to the resource endpoint with submit flag', async () => {
    mockPost.mockResolvedValue({ data: { name: 'SST-001', status: 'Aktif' } })
    const payload = {
      tanggal: '2026-05-11',
      shift: 'Pagi' as const,
      supervisor_buka: 'sup@example.com',
      modal_kas: 100000,
      denominasi_buka: [{ denominasi: 'Rp 100.000', jumlah: 1 }],
    }
    await sesiKasTellerService.bukaSesi(payload)
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/resource/Sesi Kas Teller'),
      expect.objectContaining({ ...payload, docstatus: 1 }),
    )
  })
})

describe('sesiKasTellerService.tutupKas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls run_doc_method with tutup_kas args', async () => {
    mockPost.mockResolvedValue({ message: {} })
    await sesiKasTellerService.tutupKas('SST-001', [
      { denominasi: 'Rp 100.000', jumlah: 5 },
    ], 'catatan')
    expect(mockPost).toHaveBeenCalledWith(
      '/api/method/run_doc_method',
      {
        dt: 'Sesi Kas Teller',
        dn: 'SST-001',
        method: 'tutup_kas',
        args: JSON.stringify({
          denominasi_tutup: [{ denominasi: 'Rp 100.000', jumlah: 5 }],
          catatan_selisih: 'catatan',
        }),
      },
    )
  })

  it('omits catatan_selisih when undefined', async () => {
    mockPost.mockResolvedValue({ message: {} })
    await sesiKasTellerService.tutupKas('SST-001', [
      { denominasi: 'Rp 100.000', jumlah: 5 },
    ])
    expect(mockPost).toHaveBeenCalledWith(
      '/api/method/run_doc_method',
      expect.objectContaining({
        args: JSON.stringify({
          denominasi_tutup: [{ denominasi: 'Rp 100.000', jumlah: 5 }],
        }),
      }),
    )
  })
})

describe('sesiKasTellerService.approveTutup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls run_doc_method with approve_tutup + catatan_supervisor', async () => {
    mockPost.mockResolvedValue({ message: {} })
    await sesiKasTellerService.approveTutup('SST-001', 'looks good')
    expect(mockPost).toHaveBeenCalledWith(
      '/api/method/run_doc_method',
      {
        dt: 'Sesi Kas Teller',
        dn: 'SST-001',
        method: 'approve_tutup',
        args: JSON.stringify({ catatan_supervisor: 'looks good' }),
      },
    )
  })

  it('omits catatan_supervisor when undefined', async () => {
    mockPost.mockResolvedValue({ message: {} })
    await sesiKasTellerService.approveTutup('SST-001')
    expect(mockPost).toHaveBeenCalledWith(
      '/api/method/run_doc_method',
      expect.objectContaining({ args: JSON.stringify({}) }),
    )
  })
})
