import { DiscoverPage, LibraryAddRequest, LibraryAddResult, Comic } from '../types';
import * as mock from '../mocks/api/discover';
import { isMock, http, requestWithStatus } from './http';
import { emitComicUpdated } from './events';

const MOCK = isMock('discover');

/* Discover and Library — docs/api-contract.md#discover, #library */

/** Query length the API accepts (q: 2–100 characters). */
export const DISCOVER_MIN_QUERY = 2;
export const DISCOVER_MAX_QUERY = 100;

/**
 * GET /api/discover/search?q=&page= → DiscoverPage
 * (providers asked in parallel; the slow or failing ones are listed in providers_failed)
 */
export const searchDiscover = (q: string, page = 1): Promise<DiscoverPage> =>
  MOCK ? mock.search(q, page) : http.get('/api/discover/search', { q, page });

/**
 * POST /api/library body LibraryAddRequest → 201 Comic (saved) | 200 Comic (already in the library)
 * Errors: 404 work_not_found | shelf_not_found; 422 unknown_provider | link_not_supported; 503 provider_unavailable
 */
export const addToLibrary = async (data: LibraryAddRequest): Promise<LibraryAddResult> => {
  const result = MOCK
    ? await mock.add(data)
    : await requestWithStatus<Comic>('POST', '/api/library', { body: data }).then(({ data: comic, status }) => ({
        comic,
        created: status === 201,
      }));
  if (result.created) emitComicUpdated(result.comic);
  return result;
};

export const discoverService = {
  search: searchDiscover,
  addToLibrary,
};
