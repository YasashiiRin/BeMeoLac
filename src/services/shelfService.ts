import { Shelf } from '../types';
import { mockShelves } from '../mocks/shelves';
import { mockComics } from '../mocks/comics';
import { simulateNetworkDelay } from './apiClient';

let shelvesDatabase: Shelf[] = mockShelves.map((shelf) => {
  // If cover_urls is empty, populate from comics belonging to this shelf
  const shelfComics = mockComics.filter((c) =>
    shelf.id === 'all' ? true : c.shelf_ids.includes(shelf.id)
  );
  const covers = shelfComics.map((c) => c.cover_url).filter(Boolean).slice(0, 4);
  return {
    ...shelf,
    comic_count: shelf.id === 'all' ? mockComics.length : shelfComics.length,
    cover_urls: covers.length > 0 ? covers : [
      '/src/assets/images/cottage_greenhouse_store_1790241469393.jpg',
      '/src/assets/images/secret_fairy_garden_1790241482673.jpg',
      '/src/assets/images/traveler_in_sunlit_meadow_1790241493617.jpg',
    ],
  };
});

// In-memory record of custom drag-and-drop order for comics in shelves
const shelfComicOrders: Record<string, string[]> = {};

export const list = async (): Promise<Shelf[]> => {
  await simulateNetworkDelay(100);
  return shelvesDatabase.map((shelf) => ({ ...shelf }));
};

export const getShelves = async (): Promise<Shelf[]> => {
  return list();
};

export const getShelfById = async (id: string): Promise<Shelf | null> => {
  await simulateNetworkDelay(100);
  const found = shelvesDatabase.find((s) => s.id === id);
  if (!found) return null;
  return { ...found };
};

export const createShelf = async (data: { name: string; description?: string; icon?: string; color?: string }): Promise<Shelf> => {
  await simulateNetworkDelay(150);
  const newShelf: Shelf = {
    id: `shelf_${Date.now()}`,
    name: data.name,
    description: data.description || '',
    icon: data.icon || '🌸',
    color: data.color || '#F2A7B5',
    position: shelvesDatabase.length + 1,
    comic_count: 0,
    cover_urls: [],
  };
  shelvesDatabase.push(newShelf);
  return newShelf;
};

export const deleteShelf = async (id: string): Promise<void> => {
  await simulateNetworkDelay(120);
  shelvesDatabase = shelvesDatabase.filter((s) => s.id !== id);
};

export const reorder = async (shelfId: string, comicIds: string[]): Promise<void> => {
  await simulateNetworkDelay(100);
  shelfComicOrders[shelfId] = [...comicIds];
};

export const getShelfComicOrder = (shelfId: string): string[] | undefined => {
  return shelfComicOrders[shelfId];
};

export const shelvesService = {
  list,
  getShelves: list,
  getShelfById,
  createShelf,
  deleteShelf,
  reorder,
  getShelfComicOrder,
};


