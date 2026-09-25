import { Notification, NotificationFilter, Paginated } from '../../types';
import { mockNotifications } from '../notifications';
import { simulateNetworkDelay } from '../../services/http';

/* Mock implementation of /api/notifications (see src/services/notificationService.ts). */

let notificationsDatabase: Notification[] = mockNotifications.map((n) => ({ ...n }));

const matches = (n: Notification, filter: NotificationFilter) => filter === 'all' || n.type === filter;
const countUnread = (filter: NotificationFilter = 'all') =>
  notificationsDatabase.filter((n) => !n.is_read && matches(n, filter)).length;

/** Newest first. */
export const list = async (filter: NotificationFilter = 'all', page = 1, pageSize = 50): Promise<Paginated<Notification>> => {
  await simulateNetworkDelay(120);
  const all = notificationsDatabase
    .filter((n) => matches(n, filter))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((n) => ({ ...n }));
  return { items: all.slice((page - 1) * pageSize, page * pageSize), total: all.length, page, page_size: pageSize };
};

export const markRead = async (id: string): Promise<void> => {
  await simulateNetworkDelay(60);
  notificationsDatabase = notificationsDatabase.map((n) => (n.id === id ? { ...n, is_read: true } : n));
};

export const markAllRead = async (): Promise<void> => {
  await simulateNetworkDelay(100);
  notificationsDatabase = notificationsDatabase.map((n) => ({ ...n, is_read: true }));
};

export const remove = async (id: string): Promise<void> => {
  await simulateNetworkDelay(80);
  notificationsDatabase = notificationsDatabase.filter((n) => n.id !== id);
};

export const unreadCount = async (filter: NotificationFilter = 'all'): Promise<number> => {
  await simulateNetworkDelay(40);
  return countUnread(filter);
};

