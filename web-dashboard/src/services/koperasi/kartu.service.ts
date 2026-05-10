// src/services/koperasi/kartu.service.ts

import { apiClient } from '@/services/api.client'
import { createEntityService } from '@/services/createEntityService'
import type { Kartu, Terminal, Merchant, KartuHistoryResponse, KartuBalanceResponse } from '@/types/koperasi/kartu.types'

export const kartuService = {
  ...createEntityService<Kartu>('/api/resource/Kartu'),

  checkBalance: (kartuId: string): Promise<KartuBalanceResponse> =>
    apiClient.get<{ message: KartuBalanceResponse }>(
      `/api/method/sekolahpro.koperasi.api.card.balance?kartu=${encodeURIComponent(kartuId)}`,
    ).then((res) => res.message),

  getHistory: (kartuId: string, page = 1, pageSize = 20): Promise<KartuHistoryResponse> =>
    apiClient.get<{ message: KartuHistoryResponse }>(
      `/api/method/sekolahpro.koperasi.api.card.history?kartu=${encodeURIComponent(kartuId)}&page=${page}&page_size=${pageSize}`,
    ).then((res) => res.message),

  blokir: (kartuId: string): Promise<void> =>
    apiClient.put<void>(`/api/resource/Kartu/${kartuId}`, { status: 'blokir' }),

  aktifkan: (kartuId: string): Promise<void> =>
    apiClient.put<void>(`/api/resource/Kartu/${kartuId}`, { status: 'aktif' }),
}

export const terminalService = createEntityService<Terminal>('/api/resource/Terminal')

export const merchantService = createEntityService<Merchant>('/api/resource/Merchant')
