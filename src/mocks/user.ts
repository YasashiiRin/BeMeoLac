import { DeviceSession, User } from '../types';

export const mockCurrentUser: User = {
  id: 'usr_elf_001',
  username: 'lacbeo',
  email: 'tiennu@tutruyennho.vn',
  display_name: 'Uyên',
  bio: 'Người trông coi khu vườn chữ và những trang truyện thơm mùi thảo mộc. 🌸📖',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'user',
  created_at: '2024-01-15T08:00:00Z',
  last_backup_at: '2024-09-20T15:15:00Z',
  settings: {
    theme: 'day',
    font_size: 16,
    sparkle_enabled: true,
    notify_new_chapter: true,
    notify_broken_link: true,
    daily_reminder_enabled: true,
    daily_reminder_time: '20:30',
  },
};

/**
 * Default mock login, checked only by authService while using mock data.
 * Never render these values in the UI.
 */
export const mockAccount = {
  username: mockCurrentUser.username,
  password: '12012007',
  userId: mockCurrentUser.id,
};

/** Signed-in devices; the current browser is added by userService.getSessions. */
export const mockOtherSessions: DeviceSession[] = [
  {
    id: 'ses_ipad_01',
    device_name: 'iPad Vườn Hồng',
    device_type: 'tablet',
    browser: 'Safari',
    location: 'Hà Nội, Việt Nam',
    last_active_at: '2024-09-23T13:40:00Z',
    is_current: false,
  },
  {
    id: 'ses_phone_01',
    device_name: 'Điện thoại của Uyên',
    device_type: 'phone',
    browser: 'Chrome Android',
    location: 'Hà Nội, Việt Nam',
    last_active_at: '2024-09-24T01:10:00Z',
    is_current: false,
  },
];
