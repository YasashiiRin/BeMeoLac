import type { StarterOption } from '../../types';

/** Vietnamese names for the providers' genres (as the backend's reasons name them); others stay as they are. */
const GENRE_LABELS: Record<string, string> = {
  Action: 'Hành động',
  Adventure: 'Phiêu lưu',
  Comedy: 'Hài hước',
  Cooking: 'Ẩm thực',
  Drama: 'Chính kịch',
  Fantasy: 'Kỳ ảo',
  "Girls' Love": 'Bách hợp',
  "Boys' Love": 'Đam mỹ',
  Historical: 'Lịch sử',
  Horror: 'Kinh dị',
  Magic: 'Phép thuật',
  Music: 'Âm nhạc',
  Mystery: 'Bí ẩn',
  Psychological: 'Tâm lý',
  Romance: 'Lãng mạn',
  'School Life': 'Học đường',
  'Sci-Fi': 'Khoa học viễn tưởng',
  'Slice of Life': 'Đời thường',
  Sports: 'Thể thao',
  Supernatural: 'Siêu nhiên',
  Thriller: 'Giật gân',
};

export const genreLabel = (genre: string): string => GENRE_LABELS[genre] ?? genre;

/** The moods shown first in the picker; the rest keep the API's order. */
const FIRST_MOODS = ['Bách hợp (GL)', 'Đam mỹ (BL)'];

export const orderMoods = (options: StarterOption[]): StarterOption[] => [
  ...FIRST_MOODS.map((v) => options.find((o) => o.value === v)).filter((o): o is StarterOption => !!o),
  ...options.filter((o) => !FIRST_MOODS.includes(o.value)),
];
