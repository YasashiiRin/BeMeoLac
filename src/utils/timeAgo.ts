const MIN = 60_000;
const HOUR = 60 * MIN;

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "Vừa xong", "5 phút trước", "2 giờ trước", "Hôm qua", "3 ngày trước", then the date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  const diff = Math.max(0, now - t);
  if (diff < MIN) return 'Vừa xong';
  if (diff < HOUR) return `${Math.floor(diff / MIN)} phút trước`;
  const days = Math.round((startOfDay(now) - startOfDay(t)) / (24 * HOUR));
  if (days === 0) return `${Math.floor(diff / HOUR)} giờ trước`;
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
