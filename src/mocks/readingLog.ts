import { Comic } from '../types';
import { mockComics } from './comics';

/*
 * Mock reading history, derived from the mock comics so the numbers agree:
 * each comic's current_chapter is spread over reading sessions between its
 * created_at and last_read_at (deterministic, seeded by the comic id).
 * Sessions lean toward recent days, and the last one lands on last_read_at.
 */

export type DayKey = string; // "YYYY-MM-DD" (UTC)

export const dayKey = (iso: string | Date): DayKey => new Date(iso).toISOString().slice(0, 10);

const DAY_MS = 86_400_000;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function buildLog(comic: Comic): Map<DayKey, number> {
  const log = new Map<DayKey, number>();
  let remaining = comic.current_chapter;
  if (remaining <= 0) return log;

  const rng = mulberry32(hash(comic.id));
  const end = Date.parse(dayKey(comic.last_read_at));
  const start = Math.min(end, Date.parse(dayKey(comic.created_at)));
  const span = Math.round((end - start) / DAY_MS);
  const add = (t: number, n: number) => {
    const k = dayKey(new Date(t));
    log.set(k, (log.get(k) ?? 0) + n);
    remaining -= n;
  };

  add(end, Math.min(remaining, 1 + Math.floor(rng() * 4)));
  while (remaining > 0) {
    const back = Math.floor(span * rng() ** 1.7); // most sessions are recent
    const size = Math.min(remaining, 1 + Math.floor(rng() ** 2 * 6));
    add(end - back * DAY_MS, size);
  }
  return log;
}

const baseComics = new Map(mockComics.map((c) => [c.id, c]));
const baseLogs = new Map<string, Map<DayKey, number>>();

/** The mock library's "today": the most recent reading day in the mock data. */
export const MOCK_TODAY: DayKey = mockComics.reduce(
  (max, c) => (dayKey(c.last_read_at) > max ? dayKey(c.last_read_at) : max),
  '0000-00-00'
);

/** Clamp a date into the mock timeline (edits made "now" land on MOCK_TODAY). */
export const mockDay = (iso: string): DayKey => {
  const k = dayKey(iso);
  return k > MOCK_TODAY ? MOCK_TODAY : k;
};

/**
 * Chapters read per day for one comic. Progress added after the mock data
 * (e.g. "Đọc tiếp" in this session) is counted on the day it was saved.
 */
export function readingLogFor(comic: Comic): Map<DayKey, number> {
  const base = baseComics.get(comic.id);
  let log = baseLogs.get(comic.id);
  if (!log) {
    log = buildLog(base ?? { ...comic, last_read_at: mockDay(comic.last_read_at), created_at: mockDay(comic.created_at) });
    baseLogs.set(comic.id, log);
  }
  const extra = base ? comic.current_chapter - base.current_chapter : 0;
  if (extra <= 0) return log;
  const merged = new Map(log);
  const k = mockDay(comic.last_read_at);
  merged.set(k, (merged.get(k) ?? 0) + extra);
  return merged;
}

/** Yearly reading goals (target number of comics to finish). */
export const mockReadingGoals: Record<number, number> = {
  2024: 8,
};
