import { Notification } from '../types';
import { mockNotifications } from '../mocks/notifications';
import { simulateNetworkDelay } from './apiClient';

let notificationsDatabase: Notification[] = [...mockNotifications];

export const getNotifications = async (): Promise<Notification[]> => {
  await simulateNetworkDelay(120);
  return [...notificationsDatabase];
};

export const markAsRead = async (id: string): Promise<void> => {
  await simulateNetworkDelay(80);
  const notif = notificationsDatabase.find((n) => n.id === id);
  if (notif) {
    notif.is_read = true;
  }
};

export const markAllAsRead = async (): Promise<void> => {
  await simulateNetworkDelay(100);
  notificationsDatabase = notificationsDatabase.map((n) => ({ ...n, is_read: true }));
};
