import { test, expect, type Page } from '@playwright/test'

// Smoke test: navigate every new koperasi route and assert no console errors + heading renders.
//
// Prereq:
//   - Dev server running on PLAYWRIGHT_BASE_URL (default http://localhost:5173)
//   - Credentials in env: E2E_USER, E2E_PASS
//
// Run: npm run smoke:routes

const USER = process.env.E2E_USER
const PASS = process.env.E2E_PASS

const ROUTES = [
  { path: '/koperasi/dashboard',                  heading: /Selamat Datang/i },
  { path: '/koperasi/persetujuan',                heading: /Pusat Persetujuan/i },
  { path: '/koperasi/teller',                     heading: /Workstation Teller/i },
  { path: '/koperasi/anggota/nasabah',            heading: /Nasabah/i },
  { path: '/koperasi/anggota/anggota-koperasi',   heading: /Anggota/i },
  { path: '/koperasi/anggota/simpanan-pokok',     heading: /Simpanan Pokok/i },
  { path: '/koperasi/simpanan/produk',            heading: /Produk Simpanan/i },
  { path: '/koperasi/simpanan/rekening',          heading: /Rekening/i },
  { path: '/koperasi/simpanan/transaksi',         heading: /Transaksi/i },
  { path: '/koperasi/simpanan/permohonan',        heading: /Permohonan/i },
  { path: '/koperasi/pembiayaan/produk',          heading: /Produk Pembiayaan/i },
  { path: '/koperasi/pembiayaan/akad',            heading: /Akad/i },
  { path: '/koperasi/pembiayaan/pembayaran',      heading: /Pembayaran|Angsuran/i },
  { path: '/koperasi/pembiayaan/shu',             heading: /SHU/i },
  { path: '/koperasi/kartu/daftar',               heading: /Kartu/i },
  { path: '/koperasi/kartu/terminal',             heading: /Terminal/i },
  { path: '/koperasi/kartu/merchant',             heading: /Merchant/i },
  { path: '/koperasi/zis/penerimaan',             heading: /Penerimaan ZIS/i },
  { path: '/koperasi/zis/program',                heading: /Program/i },
  { path: '/koperasi/zis/penyaluran',             heading: /Penyaluran/i },
  { path: '/koperasi/zis/wakaf',                  heading: /Wakaf/i },
  { path: '/koperasi/kas-teller/sesi',            heading: /Sesi Kas/i },
  { path: '/koperasi/laporan',                    heading: /Laporan/i },
  { path: '/koperasi/pengaturan',                 heading: /Pengaturan/i },
]

async function login(page: Page) {
  if (!USER || !PASS) {
    test.skip(true, 'E2E_USER / E2E_PASS not set — skipping authenticated smoke')
  }
  await page.goto('/login')
  await page.getByLabel(/email|username/i).fill(USER!)
  await page.getByLabel(/password|kata sandi/i).fill(PASS!)
  await page.getByRole('button', { name: /login|masuk/i }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 })
}

test.describe('Koperasi routes smoke', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  for (const route of ROUTES) {
    test(`renders ${route.path}`, async ({ page }) => {
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })
      page.on('pageerror', (err) => consoleErrors.push(err.message))

      await page.goto(route.path)

      // Stub fallback text from old routes file means wiring failed.
      await expect(page.locator('text=/coming soon/i')).toHaveCount(0)

      // Heading present (PageHeader renders title)
      await expect(page.locator('h1, h2').filter({ hasText: route.heading })).toBeVisible({ timeout: 8_000 })

      // No uncaught errors.
      expect(consoleErrors, `Console errors on ${route.path}:\n${consoleErrors.join('\n')}`).toEqual([])
    })
  }
})
