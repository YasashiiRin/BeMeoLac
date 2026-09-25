import { ReadingGoal, Stats, StatsPeriod } from '../types';
import * as mock from '../mocks/api/stats';
import { USE_MOCK, http } from './http';

/* Stats — docs/api-contract.md#stats */

/** GET /api/stats?period=week|month|year|all → Stats */
export const getStats = (period: StatsPeriod): Promise<Stats> => (USE_MOCK ? mock.get(period) : http.get('/api/stats', { period }));

/** PUT /api/stats/goals/{year} body { target } → ReadingGoal */
export const updateGoal = (year: number, target: number): Promise<ReadingGoal> =>
  USE_MOCK ? mock.updateGoal(year, target) : http.put(`/api/stats/goals/${year}`, { target });

export const statsService = { get: getStats, updateGoal };
