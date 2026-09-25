import { Comic, DeviceSession, ExportFormat, User, UserSettings } from '../types';
import { mockAccount, mockCurrentUser, mockOtherSessions } from '../mocks/user';
import { simulateNetworkDelay } from './apiClient';
import { getComics, importComics } from './comicService';
import { getShelves } from './shelfService';

let userDatabase: User = { ...mockCurrentUser, settings: { ...mockCurrentUser.settings } };
let otherSessions: DeviceSession[] = [...mockOtherSessions];

export type UserErrorCode = 'wrong_password' | 'invalid_file';

export class UserServiceError extends Error {
  code: UserErrorCode;
  constructor(code: UserErrorCode, message: string) {
    super(message);
    this.name = 'UserServiceError';
    this.code = code;
  }
}

export const getCurrentUser = async (): Promise<User> => {
  await simulateNetworkDelay(100);
  return { ...userDatabase };
};

export const updateUserSettings = async (newSettings: Partial<UserSettings>): Promise<User> => {
  await simulateNetworkDelay(120);
  userDatabase = {
    ...userDatabase,
    settings: {
      ...userDatabase.settings,
      ...newSettings,
    },
  };
  return { ...userDatabase };
};

/** display_name, bio and avatar_url (a data URL from the upload preview in mock mode). */
export const updateUserProfile = async (
  updates: Partial<Pick<User, 'display_name' | 'bio' | 'avatar_url'>>
): Promise<User> => {
  await simulateNetworkDelay(150);
  userDatabase = {
    ...userDatabase,
    ...updates,
  };
  return { ...userDatabase };
};

/** Throws UserServiceError('wrong_password') when the current password is wrong. */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await simulateNetworkDelay(400);
  if (currentPassword !== mockAccount.password) {
    throw new UserServiceError('wrong_password', 'Mật khẩu hiện tại chưa đúng');
  }
  mockAccount.password = newPassword; // mock login accepts the new password
};

const describeThisDevice = (): Pick<DeviceSession, 'device_name' | 'device_type' | 'browser'> => {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const device_type = /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'phone' : 'desktop';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
      ? 'Firefox'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Trình duyệt';
  const device_name = device_type === 'desktop' ? 'Máy tính này' : device_type === 'tablet' ? 'Máy tính bảng này' : 'Điện thoại này';
  return { device_name, device_type, browser };
};

/** Signed-in devices, the current one first. */
export const getSessions = async (): Promise<DeviceSession[]> => {
  await simulateNetworkDelay(180);
  const current: DeviceSession = {
    id: 'ses_current',
    ...describeThisDevice(),
    location: 'Hà Nội, Việt Nam',
    last_active_at: new Date().toISOString(),
    is_current: true,
  };
  return [current, ...otherSessions];
};

/** Signs out every other device; this one stays signed in. Returns how many were signed out. */
export const logoutAll = async (): Promise<number> => {
  await simulateNetworkDelay(300);
  const n = otherSessions.length;
  otherSessions = [];
  return n;
};

const csvCell = (v: unknown) => {
  const s = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const CSV_COLUMNS: (keyof Comic)[] = [
  'id', 'title', 'author', 'status', 'current_chapter', 'total_chapters', 'rating',
  'is_favorite', 'tags', 'note', 'last_read_at', 'created_at',
];

/** The whole library as a file; also records the backup time. */
export const exportData = async (format: ExportFormat): Promise<{ blob: Blob; filename: string }> => {
  const [{ items: comics }, shelves] = await Promise.all([getComics({ page_size: 10_000 }), getShelves()]);
  await simulateNetworkDelay(250);
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);
  userDatabase = { ...userDatabase, last_backup_at: now.toISOString() };

  if (format === 'csv') {
    const rows = [CSV_COLUMNS.join(','), ...comics.map((c) => CSV_COLUMNS.map((k) => csvCell(c[k])).join(','))];
    // BOM so spreadsheet apps read Vietnamese correctly
    return { blob: new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' }), filename: `uyen-thu-cac-${stamp}.csv` };
  }
  const { settings, display_name, bio } = userDatabase;
  const payload = { app: 'uyen-thu-cac', version: 1, exported_at: now.toISOString(), profile: { display_name, bio, settings }, shelves, comics };
  return {
    blob: new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    filename: `uyen-thu-cac-${stamp}.json`,
  };
};

/** Restores comics from a JSON backup made by exportData. Existing comics are kept. */
export const importData = async (file: File): Promise<{ added: number; skipped: number }> => {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new UserServiceError('invalid_file', 'Tệp này không phải bản sao lưu JSON hợp lệ');
  }
  const comics = (data as { comics?: unknown })?.comics;
  if (!Array.isArray(comics) || comics.some((c) => typeof c?.id !== 'string' || typeof c?.title !== 'string')) {
    throw new UserServiceError('invalid_file', 'Không tìm thấy danh sách truyện trong tệp này');
  }
  await simulateNetworkDelay(300);
  return importComics(comics as Comic[]);
};

export const deleteAccount = async (): Promise<void> => {
  await simulateNetworkDelay(400);
  // Real API: DELETE /me. Mock mode keeps the demo account so nàng can log in again.
};

export const userService = {
  getCurrentUser,
  updateSettings: updateUserSettings,
  updateProfile: updateUserProfile,
  changePassword,
  getSessions,
  logoutAll,
  exportData,
  importData,
  deleteAccount,
};
