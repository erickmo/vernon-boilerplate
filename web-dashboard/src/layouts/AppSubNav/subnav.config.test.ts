import { describe, it, expect } from 'vitest'
import { SUBNAV_CONFIG } from './subnav.config'

describe('SUBNAV_CONFIG', () => {
  it('has sekolah and koperasi top-level keys', () => {
    expect(SUBNAV_CONFIG).toHaveProperty('sekolah')
    expect(SUBNAV_CONFIG).toHaveProperty('koperasi')
  })

  it('sekolah.siswa has 5 items with required fields', () => {
    const items = SUBNAV_CONFIG.sekolah.siswa
    expect(items).toHaveLength(5)
    items.forEach((item) => {
      expect(item).toHaveProperty('key')
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('path')
      expect(item.path).toMatch(/^\/sekolah\/siswa/)
    })
  })

  it('sekolah.akademik has 7 items', () => {
    expect(SUBNAV_CONFIG.sekolah.akademik).toHaveLength(7)
  })

  it('koperasi.anggota has 3 items', () => {
    expect(SUBNAV_CONFIG.koperasi.anggota).toHaveLength(3)
  })

  it('every item path is a non-empty string starting with /', () => {
    const allItems = [
      ...Object.values(SUBNAV_CONFIG.sekolah).flat(),
      ...Object.values(SUBNAV_CONFIG.koperasi).flat(),
    ]
    allItems.forEach((item) => {
      expect(typeof item.path).toBe('string')
      expect(item.path.startsWith('/')).toBe(true)
    })
  })
})
