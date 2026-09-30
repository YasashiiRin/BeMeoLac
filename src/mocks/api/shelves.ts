import { Comic, Shelf, ShelfDetail, ShelfInput } from '../../types';
import { ApiError, simulateNetworkDelay } from '../../services/http';
import { db, shelfNotFound } from './store';

/*
 * Mock implementation of /api/shelves (see src/services/shelfService.ts), as the API answers:
 * counts and covers come from the comics each time, "all" is first and can't be changed, and
 * deleting a shelf takes it off its comics (they stay in the library).
 */

const DEFAULT_SHELF_COLOR = '#FEB2C0'; // "Hồng phấn" in ShelfFormModal's SHELF_COLORS
const ALL = 'all';
const COVERS = 4;

const allNotEditable = () => new ApiError(422, 'Kệ “Tất cả truyện” luôn có mọi truyện, nàng không cần sửa nó đâu', 'validation_error');

/** The shelf's comics in its order (a saved drag-and-drop order first, then the most recently updated). */
const comicsOn = (id: string): Comic[] => {
  const on = db.comics.filter((c) => id === ALL || c.shelf_ids.includes(id));
  const order = db.shelfOrders[id] ?? [];
  const rank = (c: Comic) => (order.includes(c.id) ? order.indexOf(c.id) : Infinity);
  return [...on].sort((a, b) => rank(a) - rank(b) || b.updated_at.localeCompare(a.updated_at));
};

const withCounts = (shelf: Shelf, position: number): Shelf => {
  const on = comicsOn(shelf.id);
  return { ...shelf, position, comic_count: on.length, cover_urls: on.map((c) => c.cover_url).filter(Boolean).slice(0, COVERS) };
};

// "all" first (position 1), hers after in their order
const ordered = (): Shelf[] => {
  const all = db.shelves.find((s) => s.id === ALL);
  const mine = db.shelves.filter((s) => s.id !== ALL).sort((a, b) => a.position - b.position);
  return [...(all ? [all] : []), ...mine].map((s, i) => withCounts(s, i + 1));
};

const mustOwn = (id: string): number => {
  if (id === ALL) throw allNotEditable();
  const i = db.shelves.findIndex((s) => s.id === id);
  if (i === -1) throw shelfNotFound();
  return i;
};

export async function list(): Promise<Shelf[]> {
  await simulateNetworkDelay(100);
  return ordered();
}

export async function get(id: string): Promise<ShelfDetail> {
  await simulateNetworkDelay(100);
  const shelf = ordered().find((s) => s.id === id);
  if (!shelf) throw shelfNotFound();
  const on = comicsOn(id);
  return {
    ...shelf,
    completed_count: on.filter((c) => c.status === 'completed').length,
    last_updated_at: on.reduce<string | null>((max, c) => (!max || c.updated_at > max ? c.updated_at : max), null),
  };
}

export async function create(data: ShelfInput): Promise<Shelf> {
  await simulateNetworkDelay(150);
  const shelf: Shelf = {
    id: `shelf_${Date.now()}`,
    name: data.name.trim(),
    description: data.description?.trim() || '',
    icon: data.icon || '🌸',
    color: data.color || DEFAULT_SHELF_COLOR,
    position: Math.max(1, ...db.shelves.map((s) => s.position)) + 1,
    comic_count: 0,
    cover_urls: [],
  };
  db.shelves.push(shelf);
  return ordered().find((s) => s.id === shelf.id)!;
}

export async function update(id: string, data: Partial<ShelfInput>): Promise<ShelfDetail> {
  await simulateNetworkDelay(120);
  const i = mustOwn(id);
  db.shelves[i] = { ...db.shelves[i], ...data };
  return get(id);
}

export async function remove(id: string): Promise<void> {
  await simulateNetworkDelay(120);
  mustOwn(id);
  db.shelves = db.shelves.filter((s) => s.id !== id);
  delete db.shelfOrders[id];
  // only the membership goes: the comics stay in the library
  db.comics = db.comics.map((c) => (c.shelf_ids.includes(id) ? { ...c, shelf_ids: c.shelf_ids.filter((s) => s !== id) } : c));
}

export async function reorderShelves(shelfIds: string[]): Promise<Shelf[]> {
  await simulateNetworkDelay(120);
  const ids = shelfIds.filter((s) => s !== ALL);
  const mine = db.shelves.filter((s) => s.id !== ALL).map((s) => s.id);
  if (ids.length !== mine.length || new Set(ids).size !== ids.length || ids.some((s) => !mine.includes(s))) {
    throw new ApiError(422, 'Nàng gửi lại đủ mọi kệ của mình theo thứ tự mới nhé', 'validation_error');
  }
  db.shelves = db.shelves.map((s) => (s.id === ALL ? s : { ...s, position: ids.indexOf(s.id) + 2 }));
  return ordered();
}

export async function reorder(id: string, comicIds: string[]): Promise<void> {
  await simulateNetworkDelay(100);
  mustOwn(id);
  const on = new Set(comicsOn(id).map((c) => c.id));
  if (new Set(comicIds).size !== comicIds.length || comicIds.some((c) => !on.has(c))) {
    throw new ApiError(422, 'Có truyện không nằm trên kệ này', 'validation_error');
  }
  db.shelfOrders[id] = [...comicIds];
}
