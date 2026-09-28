import { useCallback, useEffect, useRef, useState } from 'react';
import { Notification, NotificationFilter } from '../../types';
import { notificationsService } from '../../services/notificationService';
import { NOTIFICATIONS_CHANGED } from '../../services/events';

/** Unread count for the bell badge; updates as soon as anything is read or deleted. */
export function useUnreadCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    notificationsService.unreadCount().then((n) => alive && setCount(n)).catch(() => {});
    const onChange = () => notificationsService.unreadCount().then((n) => alive && setCount(n)).catch(() => {});
    window.addEventListener(NOTIFICATIONS_CHANGED, onChange);
    return () => {
      alive = false;
      window.removeEventListener(NOTIFICATIONS_CHANGED, onChange);
    };
  }, []);
  return count;
}

export type UnreadByFilter = Record<NotificationFilter, number>;

/**
 * One filtered list plus unread counts per chip. Actions update the list at
 * once; every open list and badge refreshes from the service's change event.
 */
export function useNotifications(filter: NotificationFilter, enabled = true) {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [unread, setUnread] = useState<UnreadByFilter>({ all: 0, new_chapter: 0, broken_link: 0 });
  const [error, setError] = useState<unknown>(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    const id = ++request.current;
    try {
      const [list, all, newChapter, broken] = await Promise.all([
        notificationsService.list(filter),
        notificationsService.unreadCount('all'),
        notificationsService.unreadCount('new_chapter'),
        notificationsService.unreadCount('broken_link'),
      ]);
      if (id !== request.current) return;
      setItems(list.items);
      setUnread({ all, new_chapter: newChapter, broken_link: broken });
      setError(null);
    } catch (err) {
      if (id === request.current) setError(err);
    }
  }, [filter]);

  useEffect(() => {
    if (!enabled) return;
    load();
    window.addEventListener(NOTIFICATIONS_CHANGED, load);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, load);
  }, [enabled, load]);

  const markRead = useCallback(async (id: string) => {
    setItems((list) => list?.map((n) => (n.id === id ? { ...n, is_read: true } : n)) ?? list);
    await notificationsService.markRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((list) => list?.map((n) => ({ ...n, is_read: true })) ?? list);
    await notificationsService.markAllRead();
  }, []);

  const remove = useCallback(async (id: string) => {
    setItems((list) => list?.filter((n) => n.id !== id) ?? list);
    await notificationsService.delete(id);
  }, []);

  return { items, unread, error, reload: load, markRead, markAllRead, remove };
}
