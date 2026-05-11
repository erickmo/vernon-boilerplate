import { describe, it, expect } from 'vitest'
import { NAV_REGISTRY, getNavItemsFor, routeToPerspective } from './nav.registry'

describe('NAV_REGISTRY', () => {
  it('contains the five core VT items', () => {
    const keys = NAV_REGISTRY.map((i) => i.key)
    expect(keys).toEqual([
      'my-work',
      'my-dashboard',
      'leader-dashboard',
      'leader-review',
      'audit-log',
    ])
  })
})

describe('getNavItemsFor', () => {
  it('pure Member in saya perspective sees personal items only', () => {
    const items = getNavItemsFor('saya', ['VT Member'])
    expect(items.map((i) => i.key)).toEqual(['my-work', 'my-dashboard'])
  })

  it('Leader in tim perspective sees team items', () => {
    const items = getNavItemsFor('tim', ['VT Member', 'VT Leader'])
    expect(items.map((i) => i.key)).toEqual(['leader-dashboard', 'leader-review'])
  })

  it('Member in tim perspective sees nothing (no leader roles)', () => {
    const items = getNavItemsFor('tim', ['VT Member'])
    expect(items).toEqual([])
  })

  it('Manager in admin perspective sees audit-log', () => {
    const items = getNavItemsFor('admin', ['VT Manager'])
    expect(items.map((i) => i.key)).toEqual(['audit-log'])
  })

  it('Administrator in admin perspective sees audit-log', () => {
    const items = getNavItemsFor('admin', ['Administrator'])
    expect(items.map((i) => i.key)).toEqual(['audit-log'])
  })
})

describe('routeToPerspective', () => {
  it('maps /my-work to saya', () => {
    expect(routeToPerspective('/my-work')).toBe('saya')
  })

  it('maps /leader-review to tim', () => {
    expect(routeToPerspective('/leader-review')).toBe('tim')
  })

  it('maps /audit-log to admin', () => {
    expect(routeToPerspective('/audit-log')).toBe('admin')
  })

  it('returns null for unknown routes', () => {
    expect(routeToPerspective('/profile')).toBeNull()
  })

  it('matches sub-paths under a known item (e.g. /my-work/123)', () => {
    expect(routeToPerspective('/my-work/123')).toBe('saya')
  })
})
