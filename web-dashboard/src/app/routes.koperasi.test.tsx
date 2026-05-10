import { describe, it, expect } from 'vitest'
import { koperasiRoutes } from './routes.koperasi'

describe('koperasiRoutes', () => {
  it('exports an array', () => { expect(Array.isArray(koperasiRoutes)).toBe(true) })
  it('has exactly one root entry at path /koperasi', () => {
    expect(koperasiRoutes).toHaveLength(1)
    expect(koperasiRoutes[0].path).toBe('/koperasi')
  })
  it('has a child route for dashboard', () => {
    const children = koperasiRoutes[0].children ?? []
    expect(children.some((c) => c.path === 'dashboard')).toBe(true)
  })
  it('has child routes for all 8 nav1 modules', () => {
    const children = koperasiRoutes[0].children ?? []
    const nav1Keys = ['anggota', 'simpanan', 'pembiayaan', 'kartu', 'zis', 'kas-teller', 'laporan', 'pengaturan']
    nav1Keys.forEach((key) => {
      const hasModule = children.some((c) => c.path?.startsWith(key))
      expect(hasModule, `missing module: ${key}`).toBe(true)
    })
  })
})
