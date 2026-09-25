import { StatsPeriod } from '../../types';

export const PERIODS: { value: StatsPeriod; label: string; phrase: string }[] = [
  { value: 'week', label: 'Tuần này', phrase: 'tuần này' },
  { value: 'month', label: 'Tháng này', phrase: 'tháng này' },
  { value: 'year', label: 'Năm nay', phrase: 'năm nay' },
  { value: 'all', label: 'Tất cả', phrase: 'từ ngày đầu' },
];

export const isPeriod = (v: string | null): v is StatsPeriod => PERIODS.some((p) => p.value === v);
export const periodPhrase = (p: StatsPeriod) => PERIODS.find((x) => x.value === p)!.phrase;

export const formatNumber = (n: number) => n.toLocaleString('vi-VN');

/** "2024-09" → "T9" (or "T9/24" when the range spans several years) */
export const monthLabel = (m: string, withYear = false) => {
  const [y, mo] = m.split('-');
  return `T${Number(mo)}${withYear ? `/${y.slice(2)}` : ''}`;
};
export const monthLong = (m: string) => {
  const [y, mo] = m.split('-');
  return `Tháng ${Number(mo)}/${y}`;
};

/** "2024-09-24" → "24/09" */
export const dayLabel = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

export const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Calendar bloom level from chapters read that day. */
export const bloomLevel = (count: number): 0 | 1 | 2 | 3 | 4 =>
  count <= 0 ? 0 : count <= 3 ? 1 : count <= 8 ? 2 : count <= 15 ? 3 : 4;

export const BLOOM_LEVELS = [
  { label: 'Nghỉ ngơi', range: '0' },
  { label: 'Nảy mầm', range: '1–3' },
  { label: 'Đơm nụ', range: '4–8' },
  { label: 'Hé nở', range: '9–15' },
  { label: 'Nở rộ', range: '16+' },
] as const;
