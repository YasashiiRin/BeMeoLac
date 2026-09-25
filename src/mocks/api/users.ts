import { Comic, DeviceSession, ExportFormat, ImportResult, LoginResult, User, UserSettings } from '../../types';
import { mockAccount, mockCurrentUser, mockOtherSessions } from '../user';
import { ApiError, simulateNetworkDelay } from '../../services/http';
import { all as allComics, importComics } from './comics';
import { db } from './store';

/* Mock implementation of /api/auth and /api/users/me (see authService.ts, userService.ts). */

let me: User = { ...mockCurrentUser, settings: { ...mockCurrentUser.settings } };
let otherSessions: DeviceSession[] = [...mockOtherSessions];

/* ── auth ── */

/** Only the default account in src/mocks/user.ts (username or email) is accepted. */
export async function login(identifier: string, password: string): Promise<LoginResult> {
  await simulateNetworkDelay(450);
  const id = identifier.trim().toLowerCase();
  const matchesUser = id === mockAccount.username || id === me.email.toLowerCase();
  if (!matchesUser || password !== mockAccount.password) {
    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu chưa đúng', 'invalid_credentials');
  }
  const stamp = Date.now();
  return {
    access_token: `mock-access-${mockAccount.userId}-${stamp}`,
    refresh_token: `mock-refresh-${mockAccount.userId}-${stamp}`,
    token_type: 'bearer',
    user: { ...me },
  };
}

/* ── users/me ── */

export async function getMe(): Promise<User> {
  await simulateNetworkDelay(100);
  return { ...me };
}

export async function updateProfile(updates: Partial<Pick<User, 'display_name' | 'bio'>>): Promise<User> {
  await simulateNetworkDelay(150);
  me = { ...me, ...updates };
  return { ...me };
}

/** Keeps the picture as a data URL (the real API stores the file and returns its URL). */
export async function uploadAvatar(file: File): Promise<User> {
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError(400, 'Chưa đọc được ảnh này', 'invalid_file'));
    reader.readAsDataURL(file);
  });
  await simulateNetworkDelay(150);
  me = { ...me, avatar_url: url };
  return { ...me };
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<User> {
  await simulateNetworkDelay(120);
  me = { ...me, settings: { ...me.settings, ...patch } };
  return { ...me };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await simulateNetworkDelay(400);
  if (currentPassword !== mockAccount.password) {
    throw new ApiError(400, 'Mật khẩu hiện tại chưa đúng', 'wrong_password');
  }
  mockAccount.password = newPassword; // mock login accepts the new password
}

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

export async function getSessions(): Promise<DeviceSession[]> {
  await simulateNetworkDelay(180);
  const current: DeviceSession = {
    id: 'ses_current',
    ...describeThisDevice(),
    location: 'Hà Nội, Việt Nam',
    last_active_at: new Date().toISOString(),
    is_current: true,
  };
  return [current, ...otherSessions];
}

export async function logoutOthers(): Promise<{ revoked: number }> {
  await simulateNetworkDelay(300);
  const revoked = otherSessions.length;
  otherSessions = [];
  return { revoked };
}

const csvCell = (v: unknown) => {
  const s = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const CSV_COLUMNS: (keyof Comic)[] = [
  'id', 'title', 'author', 'status', 'current_chapter', 'total_chapters', 'rating',
  'is_favorite', 'tags', 'note', 'last_read_at', 'created_at',
];

export async function exportData(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
  await simulateNetworkDelay(250);
  const comics = allComics();
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);
  me = { ...me, last_backup_at: now.toISOString() };

  if (format === 'csv') {
    const rows = [CSV_COLUMNS.join(','), ...comics.map((c) => CSV_COLUMNS.map((k) => csvCell(c[k])).join(','))];
    // BOM so spreadsheet apps read Vietnamese correctly
    return { blob: new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' }), filename: `uyen-thu-cac-${stamp}.csv` };
  }
  const { settings, display_name, bio } = me;
  const payload = { app: 'uyen-thu-cac', version: 1, exported_at: now.toISOString(), profile: { display_name, bio, settings }, shelves: db.shelves, comics };
  return { blob: new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), filename: `uyen-thu-cac-${stamp}.json` };
}

export async function importData(file: File): Promise<ImportResult> {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new ApiError(400, 'Tệp này không phải bản sao lưu JSON hợp lệ', 'invalid_file');
  }
  const comics = (data as { comics?: unknown })?.comics;
  if (!Array.isArray(comics) || comics.some((c) => typeof c?.id !== 'string' || typeof c?.title !== 'string')) {
    throw new ApiError(400, 'Không tìm thấy danh sách truyện trong tệp này', 'invalid_file');
  }
  await simulateNetworkDelay(300);
  return importComics(comics as Comic[]);
}

export async function deleteAccount(): Promise<void> {
  await simulateNetworkDelay(400);
  // Mock mode keeps the demo account so nàng can log in again.
}
