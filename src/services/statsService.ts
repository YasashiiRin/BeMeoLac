import { Comic, ReadingGoal, Stats, StatsPeriod } from '../types';
import { getComics } from './comicService';
import { simulateNetworkDelay } from './apiClient';
import { DayKey, MOCK_TODAY, dayKey, mockDay, mockReadingGoals, readingLogFor } from '../mocks/readingLog';

/*
 * Reading statistics. In mock mode everything is computed from the comic
 * library plus the mock reading log (src/mocks/readingLog.ts), so the page
 * agrees with the bookshelf. The real API returns the same Stats shape from
 * GET /stats?period=… and PUT /stats/goals/{year}.
 */

const DAY_MS = 86_400_000;
const goals: Record<number, number> = { ...mockReadingGoals };
const DEFAULT_GOAL = 12;

const addDays = (k: DayKey, n: number): DayKey => dayKey(new Date(Date.parse(k) + n * DAY_MS));
const monthKey = (k: DayKey) => k.slice(0, 7);
const addMonths = (m: string, n: number): string => {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};

/** First day of the period (inclusive); the period always ends today. */
function periodStart(period: StatsPeriod, today: DayKey, firstDay: DayKey): DayKey {
  if (period === 'week') {
    const weekday = (new Date(today).getUTCDay() + 6) % 7; // Monday = 0
    return addDays(today, -weekday);
  }
  if (period === 'month') return `${today.slice(0, 7)}-01`;
  if (period === 'year') return `${today.slice(0, 4)}-01-01`;
  return firstDay;
}

const inRange = (k: DayKey, from: DayKey, to: DayKey) => k >= from && k <= to;

function topCounts<T extends string>(items: T[]): { key: T; count: number }[] {
  const map = new Map<T, number>();
  items.forEach((k) => map.set(k, (map.get(k) ?? 0) + 1));
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key, 'vi'));
}

function streakEnding(daily: Map<DayKey, number>, today: DayKey): number {
  // today still counts as "on streak" before nàng has read anything today
  let day = daily.get(today) ? today : addDays(today, -1);
  let streak = 0;
  while (daily.get(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

async function allComics(): Promise<Comic[]> {
  const res = await getComics({ page_size: 10_000 });
  return res.items;
}

function goalFor(year: number, comics: Comic[]): ReadingGoal {
  const completed = comics.filter(
    (c) => c.status === 'completed' && mockDay(c.last_read_at).startsWith(String(year))
  ).length;
  return { year, target: goals[year] ?? DEFAULT_GOAL, completed };
}

export const get = async (period: StatsPeriod): Promise<Stats> => {
  const comics = await allComics();
  await simulateNetworkDelay(220);

  const today = MOCK_TODAY;
  const logs = new Map(comics.map((c) => [c.id, readingLogFor(c)]));
  const daily = new Map<DayKey, number>();
  logs.forEach((log) => log.forEach((n, k) => daily.set(k, (daily.get(k) ?? 0) + n)));
  const firstDay = [...daily.keys(), ...comics.map((c) => mockDay(c.created_at))].sort()[0] ?? today;

  const from = periodStart(period, today, firstDay);
  const readIn = comics.filter((c) => [...(logs.get(c.id)?.keys() ?? [])].some((k) => inRange(k, from, today)));
  const completedIn = comics
    .filter((c) => c.status === 'completed' && inRange(mockDay(c.last_read_at), from, today))
    .sort((a, b) => b.last_read_at.localeCompare(a.last_read_at));

  let chapters_read = 0;
  daily.forEach((n, k) => {
    if (inRange(k, from, today)) chapters_read += n;
  });

  // Months: the period's months, or the last 6 for week/month so bars compare
  const lastMonth = monthKey(today);
  const firstMonth =
    period === 'week' || period === 'month' ? addMonths(lastMonth, -5) : monthKey(from);
  const chapters_by_month: Stats['chapters_by_month'] = [];
  for (let m = firstMonth; m <= lastMonth; m = addMonths(m, 1)) {
    let count = 0;
    daily.forEach((n, k) => {
      if (monthKey(k) === m) count += n;
    });
    chapters_by_month.push({ month: m, count });
  }

  // Calendar: every day of the period (the last 12 months for "all")
  const calFrom = period === 'all' ? addDays(today, -364) : from;
  const reading_calendar: Stats['reading_calendar'] = [];
  for (let k = calFrom; k <= today; k = addDays(k, 1)) {
    reading_calendar.push({ date: k, count: daily.get(k) ?? 0 });
  }

  const sourceOf = (c: Comic) => c.sources.find((s) => s.id === c.primary_source_id) ?? c.sources[0];
  const favicons = new Map<string, string>();
  readIn.forEach((c) => {
    const s = sourceOf(c);
    if (s && !favicons.has(s.site_name)) favicons.set(s.site_name, s.favicon_url);
  });
  const top_sources = topCounts(readIn.map((c) => sourceOf(c)?.site_name).filter((n): n is string => !!n))
    .slice(0, 5)
    .map(({ key, count }) => ({ site_name: key, favicon_url: favicons.get(key) ?? '', count }));

  const genres = topCounts(readIn.flatMap((c) => c.tags)).map(({ key, count }) => ({ name: key, count }));

  return {
    period,
    total_comics: comics.length,
    new_comics: comics.filter((c) => inRange(mockDay(c.created_at), from, today)).length,
    comics_read: readIn.length,
    completed_count: completedIn.length,
    chapters_read,
    streak_days: streakEnding(daily, today),
    chapters_by_month,
    genres,
    reading_calendar,
    top_sources,
    goal: goalFor(Number(today.slice(0, 4)), comics),
    recently_completed: completedIn.slice(0, 10),
  };
};

export const updateGoal = async (year: number, target: number): Promise<ReadingGoal> => {
  const comics = await allComics();
  await simulateNetworkDelay(160);
  goals[year] = Math.max(1, Math.round(target));
  return goalFor(year, comics);
};

export const statsService = {
  get,
  updateGoal,
};
