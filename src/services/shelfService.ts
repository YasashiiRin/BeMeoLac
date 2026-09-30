import { Shelf, ShelfDetail, ShelfInput } from '../types';
import * as mock from '../mocks/api/shelves';
import { isApiError, isMock, http, orNull } from './http';
import { emitShelvesUpdated } from './events';

const MOCK = isMock('shelves');

/* Shelves — docs/api-contract.md#shelves. Comic membership: comicService.addComicToShelf / removeComicFromShelf. */

/** GET /api/shelves → Shelf[] (ordered by position; includes the virtual "all" shelf) */
export const listShelves = (): Promise<Shelf[]> => (MOCK ? mock.list() : http.get('/api/shelves'));

/** GET /api/shelves/{id} → ShelfDetail (the Shelf + completed_count, last_updated_at; "all" too); null when 404 shelf_not_found */
export const getShelfById = (id: string): Promise<ShelfDetail | null> =>
  orNull(MOCK ? mock.get(id) : http.get<ShelfDetail>(`/api/shelves/${encodeURIComponent(id)}`));

/** POST /api/shelves body ShelfInput → 201 Shelf */
export const createShelf = async (data: ShelfInput): Promise<Shelf> => {
  const shelf = await (MOCK ? mock.create(data) : http.post<Shelf>('/api/shelves', data));
  emitShelvesUpdated({ action: 'create', shelf, shelfId: shelf.id });
  return shelf;
};

/** PATCH /api/shelves/{id} body Partial<ShelfInput> → ShelfDetail; 422 for "all" */
export const updateShelf = async (id: string, data: Partial<ShelfInput>): Promise<ShelfDetail> => {
  const shelf = await (MOCK ? mock.update(id, data) : http.patch<ShelfDetail>(`/api/shelves/${encodeURIComponent(id)}`, data));
  emitShelvesUpdated({ action: 'update', shelf, shelfId: id });
  return shelf;
};

/** DELETE /api/shelves/{id} → 204 (comics stay in the library; only their membership goes); 404 shelf_not_found */
export const deleteShelf = async (id: string): Promise<void> => {
  await (MOCK ? mock.remove(id) : http.delete(`/api/shelves/${encodeURIComponent(id)}`));
  emitShelvesUpdated({ action: 'delete', shelfId: id });
};

/** What to tell her when deleting a shelf failed (the API's own Vietnamese detail when it has one). */
export const deleteShelfErrorMessage = (err: unknown): string => {
  if (isApiError(err, 'shelf_not_found')) return 'Kệ này không còn nữa, có lẽ nàng đã xóa nó ở nơi khác rồi 🌿';
  if (isApiError(err)) return err.detail || 'Chưa xóa được kệ sách, nàng thử lại nhé';
  return 'Chưa xóa được kệ sách, nàng thử lại nhé';
};

/** PUT /api/shelves/{id}/order body { comic_ids: string[] } → 204. Read back with GET /api/comics?shelf={id}&sort=position */
export const reorderShelf = (id: string, comicIds: string[]): Promise<void> =>
  MOCK ? mock.reorder(id, comicIds) : http.put(`/api/shelves/${encodeURIComponent(id)}/order`, { comic_ids: comicIds });

/** PUT /api/shelves/order body { shelf_ids } (every one of her shelves; "all" stays first) → Shelf[] in the new order */
export const reorderShelves = async (shelfIds: string[]): Promise<Shelf[]> => {
  const shelves = await (MOCK ? mock.reorderShelves(shelfIds) : http.put<Shelf[]>('/api/shelves/order', { shelf_ids: shelfIds }));
  emitShelvesUpdated({ action: 'update', shelfId: 'all' });
  return shelves;
};

export const shelvesService = {
  list: listShelves,
  getShelfById,
  create: createShelf,
  update: updateShelf,
  delete: deleteShelf,
  reorder: reorderShelf,
  reorderShelves,
};
