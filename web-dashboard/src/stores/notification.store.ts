import { create } from 'zustand'
import type { Perspective } from '@/types/perspective.types'

export type NotificationKind =
  | 'task-assigned'
  | 'task-review-requested'
  | 'task-approved'
  | 'task-rejected'
  | 'task-deadline-near'
  | 'system'
  | (string & {})

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  /** Legacy: free-form href. Prefer `link` for new code. */
  href?: string
  /** Preferred internal route (router path), e.g. '/leader-review?task=VT-123'. */
  link?: string
  /** Hint for which perspective the destination belongs to. */
  perspective?: Perspective
  /** Optional task identifier used by the frontend link mapper. */
  taskName?: string
  /** Semantic event type — used by the frontend mapper until backend pushes link. */
  kind?: NotificationKind
}

interface NotificationState {
  items: NotificationItem[]
  unreadCount: number
}

interface NotificationActions {
  add: (item: NotificationItem) => void
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
}

export const useNotificationStore = create<NotificationState & NotificationActions>()((set) => ({
  items: [],
  unreadCount: 0,

  add: (item: NotificationItem) =>
    set((s) => ({
      items: [item, ...s.items],
      unreadCount: s.unreadCount + (item.isRead ? 0 : 1),
    })),

  markRead: (id: string) =>
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - (s.items.find((n) => n.id === id)?.isRead ? 0 : 1)),
    })),

  markAllRead: () =>
    set((s) => ({
      items: s.items.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  remove: (id: string) =>
    set((s) => {
      const item = s.items.find((n) => n.id === id)
      return {
        items: s.items.filter((n) => n.id !== id),
        unreadCount: Math.max(0, s.unreadCount - (item?.isRead ? 0 : 1)),
      }
    }),
}))
