import { DeviceSession, ExportFormat, ImportResult, User, UserSettings } from '../types';
import * as mock from '../mocks/api/users';
import { isMock, http, requestRaw } from './http';

const MOCK = isMock('users');

/* Current user — docs/api-contract.md#users */

/** GET /api/users/me → User */
export const getCurrentUser = (): Promise<User> => (MOCK ? mock.getMe() : http.get('/api/users/me'));

/** PATCH /api/users/me body { display_name?, bio? } → User */
export const updateUserProfile = (updates: Partial<Pick<User, 'display_name' | 'bio'>>): Promise<User> =>
  MOCK ? mock.updateProfile(updates) : http.patch('/api/users/me', updates);

/** PUT /api/users/me/avatar multipart { file } (image, ≤ 2 MB) → User */
export const uploadAvatar = (file: File): Promise<User> => {
  if (MOCK) return mock.uploadAvatar(file);
  const form = new FormData();
  form.append('file', file);
  return http.put('/api/users/me/avatar', form);
};

/** PATCH /api/users/me/settings body Partial<UserSettings> → User */
export const updateUserSettings = (patch: Partial<UserSettings>): Promise<User> =>
  MOCK ? mock.updateSettings(patch) : http.patch('/api/users/me/settings', patch);

/** POST /api/users/me/password body { current_password, new_password } → 204; 400 wrong_password */
export const changePassword = (currentPassword: string, newPassword: string): Promise<void> =>
  MOCK
    ? mock.changePassword(currentPassword, newPassword)
    : http.post('/api/users/me/password', { current_password: currentPassword, new_password: newPassword });

/** GET /api/users/me/sessions → DeviceSession[] (current first) */
export const getSessions = (): Promise<DeviceSession[]> => (MOCK ? mock.getSessions() : http.get('/api/users/me/sessions'));

/** DELETE /api/users/me/sessions → { revoked } (signs out every other device; this one stays) */
export const logoutAll = async (): Promise<number> =>
  (MOCK ? await mock.logoutOthers() : await http.delete<{ revoked: number }>('/api/users/me/sessions')).revoked;

/** GET /api/users/me/export?format=json|csv → file download (Content-Disposition filename); sets last_backup_at */
export const exportData = async (format: ExportFormat): Promise<{ blob: Blob; filename: string }> => {
  if (MOCK) return mock.exportData(format);
  const res = await requestRaw('GET', '/api/users/me/export', { query: { format } });
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const filename = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1] ?? `uyen-thu-cac.${format}`;
  return { blob: await res.blob(), filename: decodeURIComponent(filename) };
};

/** POST /api/users/me/import multipart { file } (JSON from exportData) → ImportResult; 400 invalid_file */
export const importData = (file: File): Promise<ImportResult> => {
  if (MOCK) return mock.importData(file);
  const form = new FormData();
  form.append('file', file);
  return http.post('/api/users/me/import', form);
};

/** DELETE /api/users/me → 204 (deletes the account and all its data) */
export const deleteAccount = (): Promise<void> => (MOCK ? mock.deleteAccount() : http.delete('/api/users/me'));

export const userService = {
  getCurrentUser,
  updateProfile: updateUserProfile,
  uploadAvatar,
  updateSettings: updateUserSettings,
  changePassword,
  getSessions,
  logoutAll,
  exportData,
  importData,
  deleteAccount,
};
