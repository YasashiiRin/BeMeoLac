import { TagCount } from '../types';
import { USE_MOCK, http, simulateNetworkDelay } from './http';
import { all } from '../mocks/api/comics';

/* Tags — docs/api-contract.md#tags */

async function mockList(): Promise<TagCount[]> {
  await simulateNetworkDelay(80);
  const counts = new Map<string, number>();
  all().forEach((c) => c.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
}

/** GET /api/tags → TagCount[] (every tag in the library, most used first) */
export const listTags = (): Promise<TagCount[]> => (USE_MOCK ? mockList() : http.get('/api/tags'));

export const tagsService = { list: listTags };
