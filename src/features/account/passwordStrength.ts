export interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const LABELS = ['Chưa gieo hạt', 'Mầm yếu ớt', 'Chồi non', 'Cây vững vàng', 'Mạnh như rễ cổ thụ'];

/** 0–4: one point each for 8+ chars, upper+lower case, a digit, a symbol; 12+ chars adds one (max 4). */
export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: LABELS[0] };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-zà-ỹ]/.test(pw) && /[A-ZÀ-Ỹ]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^\p{L}\d]/u.test(pw)) s++;
  if (pw.length >= 12) s++;
  if (pw.length < 8) s = Math.min(s, 1);
  const score = Math.max(1, Math.min(4, s)) as Strength['score'];
  return { score, label: LABELS[score] };
}
