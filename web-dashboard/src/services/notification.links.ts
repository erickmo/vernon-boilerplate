import type { NotificationItem } from '@/stores/notification.store'
import type { Perspective } from '@/types/perspective.types'

export interface NotificationTarget {
  link: string
  perspective: Perspective | undefined
}

export function resolveNotificationTarget(item: NotificationItem): NotificationTarget | null {
  if (item.link) {
    return { link: item.link, perspective: item.perspective }
  }
  if (item.href) {
    return { link: item.href, perspective: undefined }
  }
  return null
}
