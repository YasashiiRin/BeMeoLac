import { User } from '../types';

export const mockCurrentUser: User = {
  id: 'usr_elf_001',
  email: 'tiennu@tutruyennho.vn',
  display_name: 'Tiên Nữ Nhỏ',
  bio: 'Người trông coi khu vườn chữ và những trang truyện thơm mùi thảo mộc. 🌸📖',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'user',
  created_at: '2024-01-15T08:00:00Z',
  settings: {
    theme: 'day',
    font_size: 15,
    sparkle_enabled: true,
    notify_new_chapter: true,
    notify_broken_link: true,
    daily_reminder_time: '20:30',
  },
};
