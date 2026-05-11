import { useQuery } from '@tanstack/react-query'
import { useNotificationStore } from '@/stores/notification.store'
import { apiClient } from '@/services/api.client'

const REVIEW_QUEUE_PATH =
  '/api/method/vernon_tasks.task.page.leader_review.leader_review.get_review_queue'

interface ReviewQueueResponse {
  message?: { items?: unknown[] } | unknown[]
}

export function useSayaBadgeCount(): number {
  return useNotificationStore((s) => s.unreadCount)
}

export function useTimBadgeCount(): number {
  const { data } = useQuery({
    queryKey: ['perspective-badge', 'tim'],
    queryFn: async () => {
      const res = await apiClient.get<ReviewQueueResponse>(REVIEW_QUEUE_PATH)
      const payload = (res as ReviewQueueResponse).message ?? res
      if (Array.isArray(payload)) return payload.length
      if (
        payload &&
        typeof payload === 'object' &&
        Array.isArray((payload as { items?: unknown[] }).items)
      ) {
        return (payload as { items: unknown[] }).items.length
      }
      return 0
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
    throwOnError: false,
  })
  return typeof data === 'number' ? data : 0
}
