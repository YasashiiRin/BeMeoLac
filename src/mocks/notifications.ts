import { Comic, Notification, NotificationType } from '../types';
import { mockComics } from './comics';

/*
 * Mock notifications, built from the mock comics so titles, covers and
 * chapter numbers match the bookshelf. Times are relative to when the app
 * loads, so "5 phút trước" reads naturally in the demo.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const comic = (id: string): Comic => {
  const c = mockComics.find((x) => x.id === id);
  if (!c) throw new Error(`mock comic ${id} missing`);
  return c;
};

const make = (
  id: string,
  type: NotificationType,
  ago: number,
  is_read: boolean,
  message: (c: Comic | null) => string,
  comicId?: string
): Notification => {
  const c = comicId ? comic(comicId) : null;
  return {
    id,
    comic_id: c?.id ?? '',
    comic_title: c?.title ?? '',
    comic_cover_url: c?.cover_url ?? '',
    type,
    message: message(c),
    is_read,
    created_at: new Date(Date.now() - ago).toISOString(),
  };
};

const brokenSite = (c: Comic | null) => c?.sources.find((s) => !s.is_alive)?.site_name ?? 'nguồn đọc';

export const mockNotifications: Notification[] = [
  make('notif_001', 'new_chapter', 5 * MIN, false, (c) => `Vừa có chồi biếc Chương ${(c?.current_chapter ?? 0) + 1} ✨ Nàng ghé đọc ngay nhé!`, 'comic_001'),
  make('notif_002', 'broken_link', 2 * HOUR, false, (c) => `Link nguồn ${brokenSite(c)} không còn mở được. Nàng cập nhật đường dẫn giúp truyện nhé.`, 'comic_006'),
  make('notif_003', 'new_chapter', 3 * HOUR, false, (c) => `Chương ${(c?.current_chapter ?? 0) + 1} vừa ra lò, thơm mùi bánh tart dâu 🍓`, 'comic_020'),
  make('notif_004', 'achievement', 26 * HOUR, false, () => 'Nàng đã siêng năng đọc liền 7 ngày, khu vườn nở thêm một bông hoa mẫu đơn 🌸'),
  make('notif_005', 'new_chapter', 2 * DAY, true, (c) => `Chương ${(c?.current_chapter ?? 0) + 1} mới cập nhật trên Bilibili.`, 'comic_007'),
  make('notif_006', 'broken_link', 3 * DAY, true, (c) => `Link nguồn ${brokenSite(c)} báo lỗi khi mở chương mới nhất.`, 'comic_019'),
  make('notif_007', 'new_chapter', 5 * DAY, true, (c) => `Chương ${(c?.current_chapter ?? 0) + 1} đã được dịch: "Qua cánh đồng hoa bồ công anh rực nắng".`, 'comic_003'),
];
