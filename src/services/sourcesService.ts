import { ComicPreview, SourceCheckResult } from '../types';
import * as mock from '../mocks/api/sources';
import { USE_MOCK, http } from './http';

/* Sources — docs/api-contract.md#sources */

/** POST /api/sources/preview body { url } → ComicPreview (reads title, cover, author, tags, chapters from a comic page) */
export const previewFromUrl = (url: string): Promise<ComicPreview> =>
  USE_MOCK ? mock.preview(url) : http.post('/api/sources/preview', { url });

/** POST /api/sources/check → SourceCheckResult (re-checks every source link of the library) */
export const checkAll = (): Promise<SourceCheckResult> => (USE_MOCK ? mock.checkAll() : http.post('/api/sources/check'));

export const sourcesService = { preview: previewFromUrl, checkAll };
