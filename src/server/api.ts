import {
  getSummary,
  getLast7DaysDailySpend,
  getLast30DaysDailySpend,
  getModelBreakdown,
  getSessionBreakdown,
  getTriggerBreakdown,
  getHourlySpend,
  getYesterdaySpend,
} from "../storage/queries.js";
import { generateRecommendations } from "../recommendations/engine.js";
import { getWatcherStats } from "../ingest/watcher.js";

export interface ApiRoute {
  method: string;
  path: string;
  handler: () => unknown;
}

export function getRoutes(): ApiRoute[] {
  return [
    {
      method: "GET",
      path: "/api/summary",
      handler: () => getSummary(),
    },
    {
      method: "GET",
      path: "/api/trend",
      handler: () => getLast7DaysDailySpend(),
    },
    {
      method: "GET",
      path: "/api/models",
      handler: () => getModelBreakdown(),
    },
    {
      method: "GET",
      path: "/api/sessions",
      handler: () => getSessionBreakdown(20),
    },
    {
      method: "GET",
      path: "/api/triggers",
      handler: () => getTriggerBreakdown(),
    },
    {
      method: "GET",
      path: "/api/recommendations",
      handler: () => generateRecommendations(),
    },
    {
      method: "GET",
      path: "/api/hourly",
      handler: () => getHourlySpend(),
    },
    {
      method: "GET",
      path: "/api/yesterday",
      handler: () => getYesterdaySpend(),
    },
    {
      method: "GET",
      path: "/api/trend30",
      handler: () => getLast30DaysDailySpend(),
    },
    {
      method: "GET",
      path: "/api/health",
      handler: () => {
        const stats = getWatcherStats();
        return {
          status: "ok",
          watcherActive: true,
          parseErrors: stats.parseErrors,
          lastEventTs: stats.lastEventTs,
        };
      },
    },
  ];
}
