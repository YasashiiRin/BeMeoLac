import { useCallback, useState } from 'react';
import { fold } from '../../utils/text';

const KEY = 'tutruyen-recent-searches';
const MAX = 10;

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage blocked: recents only live for this visit
  }
}

/** Recent search texts (newest first, max 10, no duplicates ignoring accents/case). */
export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>(read);

  const add = useCallback((text: string) => {
    const q = text.trim();
    if (q.length < 2) return;
    setRecents((prev) => {
      const next = [q, ...prev.filter((r) => fold(r) !== fold(q))].slice(0, MAX);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((text: string) => {
    setRecents((prev) => {
      const next = prev.filter((r) => r !== text);
      write(next);
      return next;
    });
  }, []);

  return { recents, add, remove };
}
