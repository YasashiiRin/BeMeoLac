import { Shelf, ShelfInput } from '../../types';
import { simulateNetworkDelay } from '../../services/http';
import { db, shelfNotFound } from './store';

/* Mock implementation of /api/shelves (see src/services/shelfService.ts). */

const DEFAULT_SHELF_COLOR = '#FEB2C0'; // "Hồng phấn" in ShelfFormModal's SHELF_COLORS

export async function list(): Promise<Shelf[]> {
  await simulateNetworkDelay(100);
  return db.shelves.map((shelf) => ({ ...shelf }));
}

export async function get(id: string): Promise<Shelf> {
  await simulateNetworkDelay(100);
  const found = db.shelves.find((s) => s.id === id);
  if (!found) throw shelfNotFound();
  return { ...found };
}

export async function create(data: ShelfInput): Promise<Shelf> {
  await simulateNetworkDelay(150);
  const shelf: Shelf = {
    id: `shelf_${Date.now()}`,
    name: data.name,
    description: data.description || '',
    icon: data.icon || '🌸',
    color: data.color || DEFAULT_SHELF_COLOR,
    position: db.shelves.length + 1,
    comic_count: 0,
    cover_urls: [],
  };
  db.shelves.push(shelf);
  return { ...shelf };
}

export async function update(id: string, data: Partial<ShelfInput>): Promise<Shelf> {
  await simulateNetworkDelay(120);
  const i = db.shelves.findIndex((s) => s.id === id);
  if (i === -1) throw shelfNotFound();
  db.shelves[i] = { ...db.shelves[i], ...data };
  return { ...db.shelves[i] };
}

export async function remove(id: string): Promise<void> {
  await simulateNetworkDelay(120);
  if (!db.shelves.some((s) => s.id === id)) throw shelfNotFound();
  db.shelves = db.shelves.filter((s) => s.id !== id);
}

export async function reorder(id: string, comicIds: string[]): Promise<void> {
  await simulateNetworkDelay(100);
  db.shelfOrders[id] = [...comicIds];
}
