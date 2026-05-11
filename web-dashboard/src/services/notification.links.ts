import type { NotificationItem } from '@/stores/notification.store'
import type { Perspective } from '@/types/perspective.types'

export interface NotificationTarget {
  link: string
  perspective: Perspective | undefined
}

const SAYA_KINDS = new Set([
  'task-assigned',
  'task-deadline-near',
  'task-approved',
  'task-rejected',
])

const TIM_KINDS = new Set(['task-review-requested'])

/**
 * Maps a notification to a route + perspective. Returns null when there is
 * no actionable destination (click should be a no-op navigation).
 *
 * TODO(notif-link-mapper-deprecation): once backend pushes `link` and
 * `perspective` on every actionable notification, the kind-based mapping
 * below becomes dead code. Delete this file when backend rollout is
 * complete. See docs/tech-debt/notification-link-mapper.md.
 */
export function resolveNotificationTarget(item: NotificationItem): NotificationTarget | null {
  if (item.link) {
    return { link: item.link, perspective: item.perspective }
  }

  if (item.kind && item.taskName) {
    if (TIM_KINDS.has(item.kind)) {
      return { link: `/leader-review?task=${item.taskName}`, perspective: 'tim' }
    }
    if (SAYA_KINDS.has(item.kind)) {
      return { link: `/my-work?task=${item.taskName}`, perspective: 'saya' }
    }
  }

  if (item.href) {
    return { link: item.href, perspective: undefined }
  }

  return null
}
