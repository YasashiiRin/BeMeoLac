import {
  Comic,
  ComicCreate,
  ComicListParams,
  ComicSearchParams,
  ComicStatus,
  ComicSummary,
  ComicUpdate,
  FacetOption,
  ImportResult,
  Paginated,
  SearchFacets,
  Source,
} from '../../types';
import { fold } from '../../utils/text';
import { simulateNetworkDelay } from '../../services/http';
import { db, findComic } from './store';

/* Mock implementation of /api/comics (see src/services/comicService.ts). */

const now = () => new Date().toISOString();

export async function list(params: ComicListParams = {}): Promise<Paginated<Comic>> {
  await simulateNetworkDelay(180);
  let filtered = [...db.comics];

  if (params.shelf && params.shelf !== 'all') filtered = filtered.filter((c) => c.shelf_ids.includes(params.shelf!));
  if (params.status && params.status !== 'all') filtered = filtered.filter((c) => c.status === params.status);
  if (params.source && params.source !== 'all') {
    const src = params.source.toLowerCase();
    filtered = filtered.filter((c) => c.sources.some((s) => s.site_name.toLowerCase() === src));
  }
  if (params.tag && params.tag !== 'all') {
    const tag = params.tag.toLowerCase();
    filtered = filtered.filter((c) => c.tags.some((t) => t.toLowerCase().includes(tag)));
  }
  if (params.has_new_chapter) filtered = filtered.filter((c) => c.has_new_chapter);
  if (params.is_favorite) filtered = filtered.filter((c) => c.is_favorite);
  if (params.q && params.q.trim()) {
    const q = params.q.trim().toLowerCase();
    filtered = filtered.filter(
      (c) => c.title.toLowerCase().includes(q) || c.author.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const order = params.shelf ? db.shelfOrders[params.shelf] : undefined;
  // "position" without a saved order falls back to the newest first
  const sort = params.sort === 'position' && !order?.length ? 'updated_at' : params.sort || 'updated_at';
  filtered.sort((a, b) => {
    if (sort === 'position') {
      const ia = order!.indexOf(a.id);
      const ib = order!.indexOf(b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      return ia !== -1 ? -1 : ib !== -1 ? 1 : 0;
    }
    if (sort === 'updated_at') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (sort === 'title') return a.title.localeCompare(b.title, 'vi');
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'progress') {
      const pa = a.total_chapters > 0 ? a.current_chapter / a.total_chapters : 0;
      const pb = b.total_chapters > 0 ? b.current_chapter / b.total_chapters : 0;
      return pb - pa;
    }
    return 0;
  });

  const page = params.page || 1;
  const pageSize = params.page_size || 10;
  return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, page_size: pageSize };
}

export async function get(id: string): Promise<Comic> {
  await simulateNetworkDelay(120);
  return db.comics[findComic(id)];
}

export async function create(data: ComicCreate): Promise<Comic> {
  await simulateNetworkDelay(200);
  const comic: Comic = { ...data, id: `comic_${Date.now()}`, created_at: now(), updated_at: now() };
  db.comics.unshift(comic);
  return comic;
}

export async function update(id: string, data: ComicUpdate): Promise<Comic> {
  await simulateNetworkDelay(100);
  const i = findComic(id);
  db.comics[i] = { ...db.comics[i], ...data, updated_at: now() };
  return db.comics[i];
}

export async function remove(id: string): Promise<void> {
  await simulateNetworkDelay(150);
  findComic(id);
  db.comics = db.comics.filter((c) => c.id !== id);
}

export async function setFavorite(id: string, isFavorite: boolean): Promise<Comic> {
  await simulateNetworkDelay(100);
  const i = findComic(id);
  db.comics[i] = { ...db.comics[i], is_favorite: isFavorite, updated_at: now() };
  return db.comics[i];
}

export async function setProgress(id: string, chapter: number): Promise<Comic> {
  await simulateNetworkDelay(100);
  const i = findComic(id);
  const comic = db.comics[i];
  const current = Math.min(Math.max(0, chapter), comic.total_chapters);
  db.comics[i] = {
    ...comic,
    current_chapter: current,
    status: current >= comic.total_chapters ? 'completed' : 'reading',
    last_read_at: now(),
    updated_at: now(),
  };
  return db.comics[i];
}

export async function findByTitle(title: string): Promise<Comic | null> {
  await simulateNetworkDelay(50);
  const t = title.trim().toLowerCase();
  if (!t) return null;
  return db.comics.find((c) => c.title.trim().toLowerCase() === t) || null;
}

export async function addSource(comicId: string, source: Source): Promise<Comic> {
  await simulateNetworkDelay(100);
  const i = findComic(comicId);
  db.comics[i] = { ...db.comics[i], sources: [...db.comics[i].sources, source], updated_at: now() };
  return db.comics[i];
}

export async function addToShelf(shelfId: string, comicId: string): Promise<Comic> {
  await simulateNetworkDelay(100);
  const i = findComic(comicId);
  const comic = db.comics[i];
  if (!comic.shelf_ids.includes(shelfId)) db.comics[i] = { ...comic, shelf_ids: [...comic.shelf_ids, shelfId], updated_at: now() };
  return db.comics[i];
}

export async function removeFromShelf(shelfId: string, comicId: string): Promise<Comic> {
  await simulateNetworkDelay(100);
  const i = findComic(comicId);
  const comic = db.comics[i];
  db.comics[i] = { ...comic, shelf_ids: comic.shelf_ids.filter((s) => s !== shelfId), updated_at: now() };
  return db.comics[i];
}

export async function summary(): Promise<ComicSummary> {
  await simulateNetworkDelay(80);
  const by = (st: ComicStatus) => db.comics.filter((c) => c.status === st).length;
  return {
    total: db.comics.length,
    by_status: { reading: by('reading'), completed: by('completed'), plan_to_read: by('plan_to_read'), on_hold: by('on_hold'), dropped: by('dropped') },
    new_chapters: db.comics.filter((c) => c.has_new_chapter).length,
  };
}

/* ── Advanced search (/search) ─────────────────────────────────────── */

const STATUS_LABELS: Record<ComicStatus, string> = {
  reading: 'Đang đọc',
  completed: 'Đã đọc xong',
  plan_to_read: 'Muốn đọc',
  on_hold: 'Tạm dừng',
  dropped: 'Bỏ dở',
};

const progressOf = (c: Comic) => (c.total_chapters > 0 ? Math.min(100, (c.current_chapter / c.total_chapters) * 100) : 0);

/** 0 when the comic doesn't match the text; higher = better match. */
function relevance(c: Comic, q: string): number {
  if (!q) return 1;
  let score = 0;
  const title = fold(c.title);
  if (title.includes(q)) score += title.startsWith(q) ? 6 : 4;
  if (fold(c.author).includes(q)) score += 3;
  if (c.tags.some((t) => fold(t).includes(q))) score += 2;
  if (fold(c.note || '').includes(q)) score += 1;
  return score;
}

export async function search(params: ComicSearchParams = {}): Promise<Paginated<Comic>> {
  await simulateNetworkDelay(160);
  const q = fold((params.q || '').trim());
  const pmin = params.progress_min ?? 0;
  const pmax = params.progress_max ?? 100;

  const scored = db.comics
    .map((c) => ({ c, score: relevance(c, q) }))
    .filter(({ c, score }) => {
      if (score === 0) return false;
      if (params.statuses?.length && !params.statuses.includes(c.status)) return false;
      if (params.genres?.length && !c.tags.some((t) => params.genres!.includes(t))) return false;
      if (params.sources?.length && !c.sources.some((s) => params.sources!.includes(s.site_name))) return false;
      if (params.shelves?.length && !c.shelf_ids.some((id) => params.shelves!.includes(id))) return false;
      if (params.min_rating && c.rating < params.min_rating) return false;
      const p = progressOf(c);
      if (p < pmin || p > pmax) return false;
      if (params.has_new_chapter && !c.has_new_chapter) return false;
      if (params.has_broken_link && !c.sources.some((s) => !s.is_alive)) return false;
      return true;
    });

  const sort = params.sort || (q ? 'relevance' : 'updated_at');
  scored.sort((a, b) => {
    switch (sort) {
      case 'relevance':
        return b.score - a.score || b.c.updated_at.localeCompare(a.c.updated_at);
      case 'title':
        return a.c.title.localeCompare(b.c.title, 'vi');
      case 'rating':
        return b.c.rating - a.c.rating;
      case 'progress':
        return progressOf(b.c) - progressOf(a.c);
      default:
        return b.c.updated_at.localeCompare(a.c.updated_at);
    }
  });

  const page = Math.max(1, params.page || 1);
  const pageSize = params.page_size || 12;
  return { items: scored.slice((page - 1) * pageSize, page * pageSize).map((x) => x.c), total: scored.length, page, page_size: pageSize };
}

export async function facets(): Promise<SearchFacets> {
  await simulateNetworkDelay(120);
  const count = <T,>(values: T[]) => values.reduce((m, v) => m.set(v, (m.get(v) || 0) + 1), new Map<T, number>());

  const statusCounts = count(db.comics.map((c) => c.status));
  const statuses: FacetOption[] = (Object.keys(STATUS_LABELS) as ComicStatus[]).map((st) => ({
    value: st,
    label: STATUS_LABELS[st],
    count: statusCounts.get(st) || 0,
  }));

  const genreCounts = count(db.comics.flatMap((c) => c.tags));
  const genres: FacetOption[] = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
    .map(([value, n]) => ({ value, label: value, count: n }));

  const sourceInfo = new Map<string, string>();
  db.comics.forEach((c) => c.sources.forEach((s) => sourceInfo.set(s.site_name, s.favicon_url)));
  const sourceCounts = count(db.comics.flatMap((c) => [...new Set(c.sources.map((s) => s.site_name))]));
  const sources: FacetOption[] = [...sourceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, n]) => ({ value, label: value, icon: sourceInfo.get(value), count: n }));

  const shelfCounts = count(db.comics.flatMap((c) => c.shelf_ids));
  const shelves: FacetOption[] = db.shelves
    .filter((sh) => sh.id !== 'all')
    .map((sh) => ({ value: sh.id, label: sh.name, icon: sh.icon, count: shelfCounts.get(sh.id) || 0 }));

  return { total: db.comics.length, statuses, genres, sources, shelves };
}

/** Adds comics from a backup; ids already in the library are skipped. */
export function importComics(comics: Comic[]): ImportResult {
  const known = new Set(db.comics.map((c) => c.id));
  const fresh = comics.filter((c) => !known.has(c.id));
  db.comics = [...fresh, ...db.comics];
  return { added: fresh.length, skipped: comics.length - fresh.length };
}

/** Everything, unpaginated (other mock modules). */
export const all = () => db.comics;
