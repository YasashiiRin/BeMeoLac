import { Comic, Shelf } from '../../types';
import { ApiError } from '../../services/http';
import { mockComics } from '../comics';
import { mockShelves } from '../shelves';

/*
 * In-memory "database" for mock mode (VITE_USE_MOCK=true). Every mock API
 * module reads and writes here, so the pages stay consistent with each other.
 * It resets on reload.
 */

export const db = {
  comics: [...mockComics] as Comic[],
  shelves: mockShelves.map((shelf) => {
    const shelfComics = mockComics.filter((c) => (shelf.id === 'all' ? true : c.shelf_ids.includes(shelf.id)));
    const covers = shelfComics.map((c) => c.cover_url).filter(Boolean).slice(0, 4);
    return {
      ...shelf,
      comic_count: shelf.id === 'all' ? mockComics.length : shelfComics.length,
      cover_urls: covers,
    };
  }) as Shelf[],
  /** custom drag-and-drop order per shelf */
  shelfOrders: {} as Record<string, string[]>,
};

export const comicNotFound = () => new ApiError(404, 'Không tìm thấy truyện', 'comic_not_found');
export const shelfNotFound = () => new ApiError(404, 'Không tìm thấy kệ sách', 'shelf_not_found');

export const findComic = (id: string): number => {
  const index = db.comics.findIndex((c) => c.id === id);
  if (index === -1) throw comicNotFound();
  return index;
};
