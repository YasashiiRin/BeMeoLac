import type { ComicSearchParams, ComicStatus, SearchSort } from '../../types';

/*
 * Search text + filters <-> URL query string, so refresh and sharing keep them.
 *   q, status*, genre*, source*, shelf*, rating, pmin, pmax, new=1, broken=1, sort, page
 * (* = repeatable key)
 */

export type SearchFilters = Required<Pick<ComicSearchParams, 'statuses' | 'genres' | 'sources' | 'shelves'>> &
  Omit<ComicSearchParams, 'statuses' | 'genres' | 'sources' | 'shelves' | 'page_size'> & { q: string; page: number };

const STATUSES: ComicStatus[] = ['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped'];
const SORTS: SearchSort[] = ['relevance', 'updated_at', 'title', 'rating', 'progress'];

const clampPct = (v: string | null, fallback: number) => {
  const n = Number(v);
  return v !== null && Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : fallback;
};

export function parseSearch(p: URLSearchParams): SearchFilters {
  const rating = Number(p.get('rating'));
  const sort = p.get('sort') as SearchSort | null;
  let pmin = clampPct(p.get('pmin'), 0);
  let pmax = clampPct(p.get('pmax'), 100);
  if (pmin > pmax) [pmin, pmax] = [pmax, pmin];
  return {
    q: p.get('q') ?? '',
    statuses: p.getAll('status').filter((s): s is ComicStatus => STATUSES.includes(s as ComicStatus)),
    genres: p.getAll('genre').filter(Boolean),
    sources: p.getAll('source').filter(Boolean),
    shelves: p.getAll('shelf').filter(Boolean),
    min_rating: rating >= 1 && rating <= 5 ? Math.round(rating) : undefined,
    progress_min: pmin,
    progress_max: pmax,
    has_new_chapter: p.get('new') === '1',
    has_broken_link: p.get('broken') === '1',
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: Math.max(1, Math.floor(Number(p.get('page')) || 1)),
  };
}

export function serializeSearch(f: SearchFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q);
  f.statuses.forEach((v) => p.append('status', v));
  f.genres.forEach((v) => p.append('genre', v));
  f.sources.forEach((v) => p.append('source', v));
  f.shelves.forEach((v) => p.append('shelf', v));
  if (f.min_rating) p.set('rating', String(f.min_rating));
  if ((f.progress_min ?? 0) > 0) p.set('pmin', String(f.progress_min));
  if ((f.progress_max ?? 100) < 100) p.set('pmax', String(f.progress_max));
  if (f.has_new_chapter) p.set('new', '1');
  if (f.has_broken_link) p.set('broken', '1');
  if (f.sort) p.set('sort', f.sort);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
}

export const EMPTY_FILTERS: Omit<SearchFilters, 'q' | 'sort'> = {
  statuses: [],
  genres: [],
  sources: [],
  shelves: [],
  min_rating: undefined,
  progress_min: 0,
  progress_max: 100,
  has_new_chapter: false,
  has_broken_link: false,
  page: 1,
};

/** Number of active filters (the search text is not counted). */
export function countActiveFilters(f: SearchFilters): number {
  return (
    f.statuses.length +
    f.genres.length +
    f.sources.length +
    f.shelves.length +
    (f.min_rating ? 1 : 0) +
    ((f.progress_min ?? 0) > 0 || (f.progress_max ?? 100) < 100 ? 1 : 0) +
    (f.has_new_chapter ? 1 : 0) +
    (f.has_broken_link ? 1 : 0)
  );
}

export function toSearchParams(f: SearchFilters, pageSize: number): ComicSearchParams {
  return { ...f, q: f.q.trim(), page_size: pageSize };
}

/* ── last typed text, so the "Tìm kiếm" tab reopens it ─────────────── */

const LAST_KEY = 'tutruyen-last-search';

export function rememberLastSearch(q: string) {
  try {
    sessionStorage.setItem(LAST_KEY, q);
  } catch {
    // storage blocked: the tab simply opens an empty search
  }
}

export function lastSearchHref(): string {
  let q = '';
  try {
    q = sessionStorage.getItem(LAST_KEY) ?? '';
  } catch {
    // ignore
  }
  return q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search';
}
