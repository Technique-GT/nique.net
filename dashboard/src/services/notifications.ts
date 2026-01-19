import { apiClient } from '@/lib/api-client'
import { Pagination } from './articles'

export type NotificationType = 'review_requested' | 'changes_requested' | 'published' | 'comment' | 'system'

export type Notification = {
  _id: string
  recipientId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  data?: Record<string, any>
  read: boolean
  createdAt: string
}

export type NotificationsResponse = {
  data: Notification[]
  pagination: Pagination
  metadata: {
    unreadCount: number
  }
}

export async function getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
  const res = await apiClient.get('/notifications', {
    params: { page, limit },
  })
  return res as unknown as NotificationsResponse
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const res = await apiClient.patch(`/notifications/${id}/read`)
  return res as unknown as Notification
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.post('/notifications/read-all')
}
