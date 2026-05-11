/**
 * QK — Centralized Query Key constants.
 *
 * Convention:
 *   - List  : QK.resourceSlug            → ['resource-slug']
 *   - Detail: QK.resourceSlugDetail      → ['resource-slug-detail']
 *
 * Usage:
 *   queryKey: [QK.users]
 *   queryKey: [QK.userDetail, id]
 *   invalidateQueries({ queryKey: [QK.users] })
 *
 * Add your own keys here as you build features.
 */
export const QK = {
  // ── Dashboard ────────────────────────────────────────────────────────────
  dashboardSummary: 'dashboard-summary',

  // ── Auth / Session ───────────────────────────────────────────────────────
  profile: 'profile',

  // ── Multi-tenant ─────────────────────────────────────────────────────────
  companyGroups: 'company-groups',
  companyGroupDetail: 'company-group-detail',

  // ── Chat ─────────────────────────────────────────────────────────────────
  chatChannels: 'chat-channels',
  chatMessages: 'chat-messages',
  chatMembers: 'chat-members',

  // ── Media ────────────────────────────────────────────────────────────────
  mediaFiles: 'media-files',

  // ── Koperasi — Simpanan ──────────────────────────────────────────────────
  produkSimpanan: 'produk-simpanan',
  produkSimpananDetail: 'produk-simpanan-detail',
  rekeningSimapnan: 'rekening-simpanan',
  rekeningSimapnanDetail: 'rekening-simpanan-detail',
  transaksiSimpanan: 'transaksi-simpanan',
  permohonanSimpanan: 'permohonan-simpanan',
  permohonanSimpananDetail: 'permohonan-simpanan-detail',

  // ── Koperasi — Pembiayaan ────────────────────────────────────────────────
  produkPembiayaan: 'produk-pembiayaan',
  produkPembiayaanDetail: 'produk-pembiayaan-detail',
  akadPembiayaan: 'akad-pembiayaan',
  akadPembiayaanDetail: 'akad-pembiayaan-detail',
  jadwalAngsuran: 'jadwal-angsuran',
  pembayaranAngsuran: 'pembayaran-angsuran',
  pembagianSHU: 'pembagian-shu',
  pembagianSHUDetail: 'pembagian-shu-detail',

  // ── Vernon Tasks — My Work ───────────────────────────────────────────────
  vtMyDay: 'vt-my-day',
  vtWhatToDoToday: 'vt-what-to-do-today',
  vtMyBlockedTasks: 'vt-my-blocked-tasks',

  // ── Vernon Tasks — My Dashboard ──────────────────────────────────────────
  vtEmployeeStats: 'vt-employee-stats',
  vtDailyCompletions: 'vt-daily-completions',
  vtHoursSummary: 'vt-hours-summary',

  // ── Vernon Tasks — Leader Dashboard ─────────────────────────────────────
  vtLeaderStats: 'vt-leader-stats',
  vtPhaseDistribution: 'vt-phase-distribution',
  vtTeamLeaderboard: 'vt-team-leaderboard',
  vtOverdueTasks: 'vt-overdue-tasks',

  // ── Vernon Tasks — Leader Review ─────────────────────────────────────────
  vtReviewQueue: 'vt-review-queue',
  vtTeamWorkload: 'vt-team-workload',
  vtTeamBlockedTasks: 'vt-team-blocked-tasks',
} as const

export type QueryKeyValue = (typeof QK)[keyof typeof QK]
