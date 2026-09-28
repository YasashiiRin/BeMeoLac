import { Notification, NotificationFilter, Paginated } from '../types';
import * as mock from '../mocks/api/notifications';
import { isMock, http } from './http';
import { emitNotificationsChanged } from './events';

const MOCK = isMock('notifications');

/* Notifications — docs/api-contract.md#notifications. Changes emit NOTIFICATIONS_CHANGED (services/events.ts). */

const typeParam = (filter: NotificationFilter) => (filter === 'all' ? undefined : filter);
const changed = async (p: Promise<void>) => {
  await p;
  emitNotificationsChanged();
};

/** GET /api/notifications?type=new_chapter|broken_link&page=&page_size= → Paginated<Notification> (newest first) */
export const listNotifications = (filter: NotificationFilter = 'all', page = 1, pageSize = 50): Promise<Paginated<Notification>> =>
  MOCK ? mock.list(filter, page, pageSize) : http.get('/api/notifications', { type: typeParam(filter), page, page_size: pageSize });

/** GET /api/notifications/unread-count?type= → { count } */
export const unreadCount = async (filter: NotificationFilter = 'all'): Promise<number> =>
  MOCK ? mock.unreadCount(filter) : (await http.get<{ count: number }>('/api/notifications/unread-count', { type: typeParam(filter) })).count;

/** POST /api/notifications/{id}/read → 204 */
export const markRead = (id: string): Promise<void> =>
  changed(MOCK ? mock.markRead(id) : http.post(`/api/notifications/${encodeURIComponent(id)}/read`));

/** POST /api/notifications/read-all → 204 */
export const markAllRead = (): Promise<void> => changed(MOCK ? mock.markAllRead() : http.post('/api/notifications/read-all'));

/** DELETE /api/notifications/{id} → 204 */
export const deleteNotification = (id: string): Promise<void> =>
  changed(MOCK ? mock.remove(id) : http.delete(`/api/notifications/${encodeURIComponent(id)}`));

export const notificationsService = {
  list: listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  delete: deleteNotification,
};
