import { Notification } from '../../types';

/** Where a notification leads: its comic, or the stats garden for achievements. */
export const notificationTarget = (n: Notification) => (n.comic_id ? `/comics/${n.comic_id}` : '/stats');
