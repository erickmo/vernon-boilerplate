import { useNotificationStore } from '@/stores/notification.store'

export function useSayaBadgeCount(): number {
  return useNotificationStore((s) => s.unreadCount)
}
