import {
  Comic,
  ComicCreate,
  ComicListParams,
  ComicSearchParams,
  ComicSummary,
  ComicUpdate,
  Paginated,
  SearchFacets,
  Source,
} from '../types';
import * as mock from '../mocks/api/comics';
import { USE_MOCK, http, orNull } from './http';
import { emitComicUpdated } from './events';

/* Comics — docs/api-contract.md#comics */

const withEvent = async (p: Promise<Comic>): Promise<Comic> => {
  const comic = await p;
  emitComicUpdated(comic);
  return comic;
};

/** GET /api/comics?q=&status=&tag=&source=&shelf=&has_new_chapter=&is_favorite=&sort=&page=&page_size= → Paginated<Comic> */
export const getComics = (params: ComicListParams = {}): Promise<Paginated<Comic>> =>
  USE_MOCK
    ? mock.list(params)
    : http.get('/api/comics', {
        ...params,
        status: params.status === 'all' ? undefined : params.status,
        shelf: params.shelf === 'all' ? undefined : params.shelf,
      });

/**
 * Advanced search, same endpoint with repeatable filters:
 * GET /api/comics?q=&status=&tag=&source=&shelf=&min_rating=&progress_min=&progress_max=&has_new_chapter=&has_broken_link=&sort=&page=&page_size=
 * → Paginated<Comic>
 */
export const searchComics = (params: ComicSearchParams = {}): Promise<Paginated<Comic>> =>
  USE_MOCK
    ? mock.search(params)
    : http.get('/api/comics', {
        q: params.q,
        status: params.statuses,
        tag: params.genres,
        source: params.sources,
        shelf: params.shelves,
        min_rating: params.min_rating,
        progress_min: params.progress_min,
        progress_max: params.progress_max,
        has_new_chapter: params.has_new_chapter,
        has_broken_link: params.has_broken_link,
        sort: params.sort,
        page: params.page,
        page_size: params.page_size,
      });

/** GET /api/comics/facets → SearchFacets (filter options with counts over the whole library) */
export const getSearchFacets = (): Promise<SearchFacets> => (USE_MOCK ? mock.facets() : http.get('/api/comics/facets'));

/** GET /api/comics/summary → ComicSummary */
export const getSummary = (): Promise<ComicSummary> => (USE_MOCK ? mock.summary() : http.get('/api/comics/summary'));

/** GET /api/comics/{id} → Comic; null when 404 comic_not_found */
export const getComicById = (id: string): Promise<Comic | null> =>
  orNull(USE_MOCK ? mock.get(id) : http.get<Comic>(`/api/comics/${encodeURIComponent(id)}`));

/** GET /api/comics/lookup?title= → { comic: Comic | null } (exact title, case-insensitive) */
export const findExistingByTitle = async (title: string): Promise<Comic | null> =>
  USE_MOCK ? mock.findByTitle(title) : (await http.get<{ comic: Comic | null }>('/api/comics/lookup', { title })).comic;

/** POST /api/comics body ComicCreate → 201 Comic */
export const createComic = (data: ComicCreate): Promise<Comic> =>
  withEvent(USE_MOCK ? mock.create(data) : http.post<Comic>('/api/comics', data));

/** PATCH /api/comics/{id} body ComicUpdate → Comic (sources are replaced when given) */
export const updateComic = (id: string, data: ComicUpdate): Promise<Comic> =>
  withEvent(USE_MOCK ? mock.update(id, data) : http.patch<Comic>(`/api/comics/${encodeURIComponent(id)}`, data));

/** DELETE /api/comics/{id} → 204 */
export const deleteComic = (id: string): Promise<void> =>
  USE_MOCK ? mock.remove(id) : http.delete(`/api/comics/${encodeURIComponent(id)}`);

/** POST /api/comics/{id}/favorite/toggle → Comic */
export const toggleFavorite = (id: string): Promise<Comic> =>
  USE_MOCK ? mock.toggleFavorite(id) : http.post<Comic>(`/api/comics/${encodeURIComponent(id)}/favorite/toggle`);

/**
 * PUT /api/comics/{id}/progress body { current_chapter } → Comic
 * (server clamps to 0..total_chapters, sets status "completed" at the end, updates last_read_at, logs the reading)
 */
export const updateComicProgress = (id: string, chapter: number): Promise<Comic> =>
  withEvent(
    USE_MOCK ? mock.setProgress(id, chapter) : http.put<Comic>(`/api/comics/${encodeURIComponent(id)}/progress`, { current_chapter: chapter })
  );

/** POST /api/comics/{id}/sources body Source → 201 Comic */
export const addSourceToComic = (comicId: string, source: Source): Promise<Comic> =>
  withEvent(USE_MOCK ? mock.addSource(comicId, source) : http.post<Comic>(`/api/comics/${encodeURIComponent(comicId)}/sources`, source));

/** POST /api/shelves/{shelf_id}/comics body { comic_id } → Comic */
export const addComicToShelf = (shelfId: string, comicId: string): Promise<Comic> =>
  USE_MOCK ? mock.addToShelf(shelfId, comicId) : http.post<Comic>(`/api/shelves/${encodeURIComponent(shelfId)}/comics`, { comic_id: comicId });

/** DELETE /api/shelves/{shelf_id}/comics/{comic_id} → Comic */
export const removeComicFromShelf = (shelfId: string, comicId: string): Promise<Comic> =>
  USE_MOCK
    ? mock.removeFromShelf(shelfId, comicId)
    : http.delete<Comic>(`/api/shelves/${encodeURIComponent(shelfId)}/comics/${encodeURIComponent(comicId)}`);

export const comicsService = {
  list: getComics,
  search: searchComics,
  getFacets: getSearchFacets,
  getSummary,
  getComicById,
  findExistingByTitle,
  create: createComic,
  update: updateComic,
  delete: deleteComic,
  toggleFavorite,
  updateProgress: updateComicProgress,
  addSourceToComic,
  addComicToShelf,
  removeComicFromShelf,
};
