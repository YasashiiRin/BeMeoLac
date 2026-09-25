import { lazy } from 'react';
import { matchPath } from 'react-router-dom';

/*
 * App pages are code-split. `preloadRoute(path)` starts fetching a page's
 * chunk ahead of time (e.g. during the login entrance) so navigation is instant.
 */

const loaders = {
  bookshelf: () => import('../pages/BookshelfPage'),
  comic: () => import('../pages/ComicDetailPage'),
  add: () => import('../pages/AddComicPage'),
  shelf: () => import('../pages/ShelfDetailPage'),
  search: () => import('../pages/SearchPage'),
  stats: () => import('../pages/StatsPage'),
  notifications: () => import('../pages/NotificationsPage'),
  account: () => import('../pages/AccountPage'),
};

export const BookshelfPage = lazy(() => loaders.bookshelf().then((m) => ({ default: m.BookshelfPage })));
export const ComicDetailPage = lazy(() => loaders.comic().then((m) => ({ default: m.ComicDetailPage })));
export const AddComicPage = lazy(() => loaders.add().then((m) => ({ default: m.AddComicPage })));
export const ShelfDetailPage = lazy(() => loaders.shelf().then((m) => ({ default: m.ShelfDetailPage })));
export const SearchPage = lazy(() => loaders.search().then((m) => ({ default: m.SearchPage })));
export const StatsPage = lazy(() => loaders.stats().then((m) => ({ default: m.StatsPage })));
export const NotificationsPage = lazy(() => loaders.notifications().then((m) => ({ default: m.NotificationsPage })));
export const AccountPage = lazy(() => loaders.account().then((m) => ({ default: m.AccountPage })));

const ROUTES: [string, keyof typeof loaders][] = [
  ['/', 'bookshelf'],
  ['/comics/:id', 'comic'],
  ['/add', 'add'],
  ['/shelves/:id', 'shelf'],
  ['/search', 'search'],
  ['/stats', 'stats'],
  ['/notifications', 'notifications'],
  ['/account/*', 'account'],
];

/** Start loading the page for `path` (pathname, may include ?query/#hash). */
export function preloadRoute(path: string): Promise<unknown> {
  const pathname = path.split(/[?#]/)[0] || '/';
  const hit = ROUTES.find(([pattern]) => matchPath(pattern, pathname));
  return (hit ? loaders[hit[1]] : loaders.bookshelf)().catch(() => undefined);
}
