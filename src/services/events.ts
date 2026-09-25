import { Comic, Shelf } from '../types';

/*
 * App-wide change events (window CustomEvents), sent by the services after a
 * successful change in both mock and real mode, so open pages stay in sync.
 */

export const COMIC_UPDATED = 'comic-updated';
export const SHELVES_UPDATED = 'shelves-updated';
export const NOTIFICATIONS_CHANGED = 'notifications-changed';

export interface ShelvesUpdatedDetail {
  action: 'create' | 'update' | 'delete';
  shelf?: Shelf;
  shelfId: string;
}

const emit = (name: string, detail?: unknown) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name, { detail }));
};

export const emitComicUpdated = (comic: Comic) => emit(COMIC_UPDATED, comic);
export const emitShelvesUpdated = (detail: ShelvesUpdatedDetail) => emit(SHELVES_UPDATED, detail);
export const emitNotificationsChanged = () => emit(NOTIFICATIONS_CHANGED);
