import { describe, it, expect } from 'vitest'
import { sekolahRoutes } from './routes.sekolah'

describe('sekolahRoutes', () => {
  it('exports an array', () => {
    expect(Array.isArray(sekolahRoutes)).toBe(true)
  })
  it('has exactly one root entry at path /sekolah', () => {
    expect(sekolahRoutes).toHaveLength(1)
    expect(sekolahRoutes[0].path).toBe('/sekolah')
  })
  it('has a child route for dashboard', () => {
    const children = sekolahRoutes[0].children ?? []
    expect(children.some((c) => c.path === 'dashboard')).toBe(true)
  })
  it('has child routes for all 5 nav1 modules', () => {
    const children = sekolahRoutes[0].children ?? []
    const nav1Keys = ['siswa', 'guru', 'akademik', 'perpustakaan', 'pengaturan']
    nav1Keys.forEach((key) => {
      expect(children.some((c) => c.path === key)).toBe(true)
    })
  })
})
