import { HomeOut, StarterOption, User } from '../types';
import * as mock from '../mocks/api/home';
import { isMock, http } from './http';

const MOCK = isMock('home');

/* Home "Thế giới" — docs/api-contract.md#home. Saving a suggestion: discoverService.addToLibrary. */

/**
 * GET /api/home → HomeOut: today's suggestions for her taste (never her own comics).
 * The first visit of the day may wait a few seconds while the feed is built; feed_status "building"
 * means some suggestions come on the next request.
 */
export const getHome = (): Promise<HomeOut> => (MOCK ? mock.getHome() : http.get('/api/home'));

/** POST /api/home/dismiss body { provider, external_id } → 204 ("Không quan tâm"; idempotent) */
export const dismissFeedItem = (provider: string, externalId: string): Promise<void> =>
  MOCK ? mock.dismiss(provider, externalId) : http.post('/api/home/dismiss', { provider, external_id: externalId });

/**
 * PUT /api/users/me/starter-tastes body { starter_tastes } → User (today's feed is built again).
 * Needs "users" and "home" on the same side (both mock or both real): the tastes live in the user's settings.
 */
export const setStarterTastes = (tastes: string[]): Promise<User> =>
  MOCK ? mock.setStarterTastes(tastes) : http.put('/api/users/me/starter-tastes', { starter_tastes: tastes });

/** The moods, as GET /api/home starter_options lists them (for pages that don't load the home feed). */
export const STARTER_OPTIONS: StarterOption[] = mock.STARTER_OPTIONS;

export const homeService = {
  get: getHome,
  dismiss: dismissFeedItem,
  setStarterTastes,
};
