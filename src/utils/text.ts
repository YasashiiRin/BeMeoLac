/**
 * Accent-insensitive text helpers for Vietnamese search.
 * `fold` keeps a 1:1 character mapping with the input, so match positions in
 * the folded string are also positions in the original (used for highlighting).
 */

const foldChar = (ch: string) => {
  if (ch === 'đ' || ch === 'Đ') return 'd';
  return ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().charAt(0) || ch.toLowerCase();
};

/** Lowercase, remove diacritics (ư → u, đ → d), same length as the input. */
export function fold(text: string): string {
  let out = '';
  for (const ch of text) out += foldChar(ch);
  return out;
}

/** Ranges [start, end) of every occurrence of `query` in `text`, accent-insensitive. */
export function findMatches(text: string, query: string): [number, number][] {
  const q = fold(query.trim());
  if (!q) return [];
  const chars = Array.from(text);
  const folded = chars.map(foldChar).join('');
  const ranges: [number, number][] = [];
  let from = 0;
  while (from <= folded.length - q.length) {
    const i = folded.indexOf(q, from);
    if (i < 0) break;
    ranges.push([i, i + q.length]);
    from = i + q.length;
  }
  return ranges;
}
