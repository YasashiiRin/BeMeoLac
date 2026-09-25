import { SourceCheckResult } from '../types';
import { getComics } from './comicService';
import { simulateNetworkDelay } from './apiClient';

/**
 * Source links. Real API: POST /sources/check re-fetches every link.
 * Mock mode reports the sources marked is_alive: false in src/mocks/comics.ts.
 */
export const checkAll = async (): Promise<SourceCheckResult> => {
  const { items } = await getComics({ page_size: 10_000 });
  await simulateNetworkDelay(900);
  const broken = items.flatMap((c) =>
    c.sources.filter((s) => !s.is_alive).map((s) => ({ comic_id: c.id, comic_title: c.title, site_name: s.site_name }))
  );
  return {
    checked: items.reduce((n, c) => n + c.sources.length, 0),
    comics: items.length,
    broken,
    checked_at: new Date().toISOString(),
  };
};

export const sourcesService = { checkAll };
