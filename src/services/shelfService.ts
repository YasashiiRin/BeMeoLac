import { Shelf, ShelfInput } from '../types';
import * as mock from '../mocks/api/shelves';
import { isMock, http, orNull } from './http';
import { emitShelvesUpdated } from './events';

const MOCK = isMock('shelves');

/* Shelves — docs/api-contract.md#shelves. Comic membership: comicService.addComicToShelf / removeComicFromShelf. */

/** GET /api/shelves → Shelf[] (ordered by position; includes the virtual "all" shelf) */
export const listShelves = (): Promise<Shelf[]> => (MOCK ? mock.list() : http.get('/api/shelves'));

/** GET /api/shelves/{id} → Shelf; null when 404 shelf_not_found */
export const getShelfById = (id: string): Promise<Shelf | null> =>
  orNull(MOCK ? mock.get(id) : http.get<Shelf>(`/api/shelves/${encodeURIComponent(id)}`));

/** POST /api/shelves body ShelfInput → 201 Shelf */
export const createShelf = async (data: ShelfInput): Promise<Shelf> => {
  const shelf = await (MOCK ? mock.create(data) : http.post<Shelf>('/api/shelves', data));
  emitShelvesUpdated({ action: 'create', shelf, shelfId: shelf.id });
  return shelf;
};

/** PATCH /api/shelves/{id} body Partial<ShelfInput> → Shelf */
export const updateShelf = async (id: string, data: Partial<ShelfInput>): Promise<Shelf> => {
  const shelf = await (MOCK ? mock.update(id, data) : http.patch<Shelf>(`/api/shelves/${encodeURIComponent(id)}`, data));
  emitShelvesUpdated({ action: 'update', shelf, shelfId: id });
  return shelf;
};

/** DELETE /api/shelves/{id} → 204 (comics stay in the library) */
export const deleteShelf = async (id: string): Promise<void> => {
  await (MOCK ? mock.remove(id) : http.delete(`/api/shelves/${encodeURIComponent(id)}`));
  emitShelvesUpdated({ action: 'delete', shelfId: id });
};

/** PUT /api/shelves/{id}/order body { comic_ids: string[] } → 204. Read back with GET /api/comics?shelf={id}&sort=position */
export const reorderShelf = (id: string, comicIds: string[]): Promise<void> =>
  MOCK ? mock.reorder(id, comicIds) : http.put(`/api/shelves/${encodeURIComponent(id)}/order`, { comic_ids: comicIds });

export const shelvesService = {
  list: listShelves,
  getShelfById,
  create: createShelf,
  update: updateShelf,
  delete: deleteShelf,
  reorder: reorderShelf,
};
