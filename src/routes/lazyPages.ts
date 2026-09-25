import { ComponentType, createElement, lazy } from 'react';
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

/**
 * Like React.lazy, but once the chunk has been preloaded the page renders
 * synchronously — no Suspense fallback flash (React.lazy always suspends on
 * its first render, even when the module is already cached).
 */
function lazyPage<P extends object>(key: keyof typeof loaders, pick: (m: any) => ComponentType<P>) {
  let loaded: ComponentType<P> | null = null;
  const load = () =>
    loaders[key]().then((m) => {
      loaded = pick(m);
      return { default: loaded };
    });
  const Lazy = lazy(load);
  const Page = (props: P) => createElement(loaded ?? Lazy, props);
  preloaders[key] = () => (loaded ? Promise.resolve() : load());
  return Page;
}

const preloaders: Partial<Record<keyof typeof loaders, () => Promise<unknown>>> = {};

export const BookshelfPage = lazyPage('bookshelf', (m) => m.BookshelfPage);
export const ComicDetailPage = lazyPage('comic', (m) => m.ComicDetailPage);
export const AddComicPage = lazyPage('add', (m) => m.AddComicPage);
export const ShelfDetailPage = lazyPage('shelf', (m) => m.ShelfDetailPage);
export const SearchPage = lazyPage('search', (m) => m.SearchPage);
export const StatsPage = lazyPage('stats', (m) => m.StatsPage);
export const NotificationsPage = lazyPage('notifications', (m) => m.NotificationsPage);
export const AccountPage = lazyPage('account', (m) => m.AccountPage);

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
  const key = hit ? hit[1] : 'bookshelf';
  return (preloaders[key] ?? loaders[key])().catch(() => undefined);
}
