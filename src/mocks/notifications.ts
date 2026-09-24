import { Notification } from '../types';

export const mockNotifications: Notification[] = [
  {
    id: 'notif_001',
    comic_id: 'comic_001',
    comic_title: 'Tiệm Tạp Hóa Thời Gian',
    comic_cover_url: '/src/assets/images/cottage_greenhouse_store_1790241469393.jpg',
    type: 'new_chapter',
    message: 'Chương 46 đã ra mắt: "Hương vị của buổi chiều trà hoa cúc dại". Mau tới đọc thôi!',
    is_read: false,
    created_at: '2024-09-24T08:15:00Z',
  },
  {
    id: 'notif_002',
    comic_id: 'comic_003',
    comic_title: 'Lữ Khách Phương Xa',
    comic_cover_url: '/src/assets/images/traveler_in_sunlit_meadow_1790241493617.jpg',
    type: 'new_chapter',
    message: 'Chương 113 đã được dịch trên BlogTruyen: "Qua cánh đồng hoa bồ công anh rực nắng".',
    is_read: false,
    created_at: '2024-09-24T06:40:00Z',
  },
  {
    id: 'notif_003',
    comic_id: '',
    comic_title: '',
    comic_cover_url: '',
    type: 'achievement',
    message: 'Chúc mừng bạn đã hoàn thành mục tiêu đọc 5 chương tuần này! Huy hiệu "Tiên Cỏ" đang đón chờ.',
    is_read: true,
    created_at: '2024-09-23T20:00:00Z',
  },
  {
    id: 'notif_004',
    comic_id: 'comic_007',
    comic_title: 'Thư Viện Những Vì Sao Đêm',
    comic_cover_url: '',
    type: 'new_chapter',
    message: 'Chương 93 mới cập nhật trên Bilibili.',
    is_read: true,
    created_at: '2024-09-22T14:20:00Z',
  },
];
