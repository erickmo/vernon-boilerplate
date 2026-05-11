import { test, expect } from '@playwright/test'

test.describe('Sesi Kas lifecycle', () => {
  test.skip(
    !process.env.E2E_TELLER_USER || !process.env.E2E_SUPERVISOR_USER,
    'requires E2E_TELLER_USER + E2E_TELLER_PASS + E2E_SUPERVISOR_USER + E2E_SUPERVISOR_PASS env',
  )

  test('teller can buka, tutup; supervisor can approve', async ({ page, context }) => {
    // 1. Teller login
    await page.goto('/login')
    await page.fill('[name="usr"]', process.env.E2E_TELLER_USER!)
    await page.fill('[name="pwd"]', process.env.E2E_TELLER_PASS!)
    await page.click('button[type="submit"]')

    // 2. Visit teller — expect empty state
    await page.goto('/koperasi/teller')
    await expect(page.getByText(/Belum ada sesi kas aktif/)).toBeVisible({ timeout: 10000 })

    // 3. Buka sesi
    await page.getByRole('button', { name: 'Buka Sesi Kas' }).click()
    await page.getByRole('button', { name: 'Rp 500.000' }).click()
    await page.fill('#supervisor', process.env.E2E_SUPERVISOR_USER!)
    await page.getByRole('button', { name: 'Buka Sesi' }).click()
    await expect(page.getByText(/Sesi Aktif/)).toBeVisible({ timeout: 10000 })

    // 4. Tutup sesi (happy path: selisih=0 against the preset breakdown)
    await page.getByRole('button', { name: 'Tutup Sesi' }).click()
    await page.getByLabel(/Jumlah Rp 100\.000/i).fill('4')
    await page.getByLabel(/Jumlah Rp 50\.000/i).fill('2')
    await page.getByRole('button', { name: 'Tutup Sesi' }).last().click()
    await expect(page.getByText(/Menunggu approval supervisor/)).toBeVisible({ timeout: 10000 })

    // 5. Supervisor session (new context for clean cookies)
    const supervisorContext = await context.browser()!.newContext()
    const supervisorPage = await supervisorContext.newPage()
    await supervisorPage.goto('/login')
    await supervisorPage.fill('[name="usr"]', process.env.E2E_SUPERVISOR_USER!)
    await supervisorPage.fill('[name="pwd"]', process.env.E2E_SUPERVISOR_PASS!)
    await supervisorPage.click('button[type="submit"]')

    // 6. Supervisor approves
    await supervisorPage.goto('/koperasi/persetujuan')
    await supervisorPage.getByRole('button', { name: /Penutupan Kas/ }).click()
    await supervisorPage.getByRole('row').filter({ hasText: 'Pending' }).first().click()
    await supervisorPage.getByRole('button', { name: 'Approve' }).click()

    // 7. Teller page should clear back to empty state
    await page.goto('/koperasi/teller')
    await expect(page.getByText(/Belum ada sesi kas aktif/)).toBeVisible({ timeout: 10000 })

    await supervisorContext.close()
  })
})
