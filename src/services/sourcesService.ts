import { ComicPreview, SourceCheckResult } from '../types';
import * as mock from '../mocks/api/sources';
import { isMock, http } from './http';

const MOCK = isMock('sources');

/* Sources — docs/api-contract.md#sources */

/** POST /api/sources/preview body { url } → ComicPreview (reads title, cover, author, tags, chapters from a comic page) */
export const previewFromUrl = (url: string): Promise<ComicPreview> =>
  MOCK ? mock.preview(url) : http.post('/api/sources/preview', { url });

/** POST /api/sources/check → SourceCheckResult (re-checks every source link of the library) */
export const checkAll = (): Promise<SourceCheckResult> => (MOCK ? mock.checkAll() : http.post('/api/sources/check'));

export const sourcesService = { preview: previewFromUrl, checkAll };
