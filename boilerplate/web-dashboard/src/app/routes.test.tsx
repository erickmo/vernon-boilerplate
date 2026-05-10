import { describe, it, expect } from 'vitest'
import { sekolahRoutes } from './routes.sekolah'
import { koperasiRoutes } from './routes.koperasi'

describe('routes composition', () => {
  it('sekolahRoutes is importable', () => {
    expect(sekolahRoutes).toBeDefined()
    expect(Array.isArray(sekolahRoutes)).toBe(true)
  })
  it('koperasiRoutes is importable', () => {
    expect(koperasiRoutes).toBeDefined()
    expect(Array.isArray(koperasiRoutes)).toBe(true)
  })
  it('combined routes cover /sekolah and /koperasi', () => {
    const combined = [...sekolahRoutes, ...koperasiRoutes]
    expect(combined.some((r) => r.path === '/sekolah')).toBe(true)
    expect(combined.some((r) => r.path === '/koperasi')).toBe(true)
  })
})
