import { User, UserSettings } from '../types';
import { mockCurrentUser } from '../mocks/user';
import { simulateNetworkDelay } from './apiClient';

let userDatabase: User = { ...mockCurrentUser };

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

export const updateUserProfile = async (updates: Partial<User>): Promise<User> => {
  await simulateNetworkDelay(150);
  userDatabase = {
    ...userDatabase,
    ...updates,
  };
  return { ...userDatabase };
};

export const userService = {
  getCurrentUser,
  updateSettings: updateUserSettings,
  updateProfile: updateUserProfile,
};
