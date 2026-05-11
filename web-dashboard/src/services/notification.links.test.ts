import { describe, it, expect } from 'vitest'
import { resolveNotificationTarget } from './notification.links'
import type { NotificationItem } from '@/stores/notification.store'

function n(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: '1',
    title: 't',
    message: 'm',
    type: 'info',
    isRead: false,
    createdAt: '',
    ...overrides,
  }
}

describe('resolveNotificationTarget', () => {
  it('returns link directly when item.link already set', () => {
    const result = resolveNotificationTarget(n({ link: '/custom?x=1', perspective: 'admin' }))
    expect(result).toEqual({ link: '/custom?x=1', perspective: 'admin' })
  })

  it('maps task-review-requested with taskName → /leader-review + tim', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-review-requested', taskName: 'VT-123' }))
    expect(result).toEqual({ link: '/leader-review?task=VT-123', perspective: 'tim' })
  })

  it('maps task-assigned with taskName → /my-work + saya', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-assigned', taskName: 'VT-9' }))
    expect(result).toEqual({ link: '/my-work?task=VT-9', perspective: 'saya' })
  })

  it('maps task-deadline-near → /my-work + saya', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-deadline-near', taskName: 'VT-1' }))
    expect(result).toEqual({ link: '/my-work?task=VT-1', perspective: 'saya' })
  })

  it('maps task-approved → /my-work + saya', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-approved', taskName: 'VT-2' }))
    expect(result).toEqual({ link: '/my-work?task=VT-2', perspective: 'saya' })
  })

  it('maps task-rejected → /my-work + saya', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-rejected', taskName: 'VT-3' }))
    expect(result).toEqual({ link: '/my-work?task=VT-3', perspective: 'saya' })
  })

  it('returns null for system kind', () => {
    const result = resolveNotificationTarget(n({ kind: 'system' }))
    expect(result).toBeNull()
  })

  it('returns null when kind needs taskName but missing', () => {
    const result = resolveNotificationTarget(n({ kind: 'task-assigned' }))
    expect(result).toBeNull()
  })

  it('falls back to legacy href when no link/kind', () => {
    const result = resolveNotificationTarget(n({ href: '/legacy' }))
    expect(result).toEqual({ link: '/legacy', perspective: undefined })
  })

  it('returns null when no link, no href, no kind', () => {
    const result = resolveNotificationTarget(n({}))
    expect(result).toBeNull()
  })

  it('returns null for unknown kind', () => {
    const result = resolveNotificationTarget(n({ kind: 'mystery-event', taskName: 'X' }))
    expect(result).toBeNull()
  })
})
