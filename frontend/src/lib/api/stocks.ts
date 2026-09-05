import { request, USER_ID } from "./client";
import type { DigestEntry, PricePoint, Range, Severity, Stock, StockStats } from "./types";

interface WatchlistRow {
  id: string;
  user_id: string;
  ticker: string;
  added_at: string;
}

interface DigestRow {
  ticker: string;
  reason: string;
  severity: "significant" | "notable" | "minor";
  zscore: number;
}

export interface SearchHit {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

/** Live ticker/company search backed by the FastAPI /search endpoint. */
export async function searchStocks(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  return request<SearchHit[]>(`/search?q=${encodeURIComponent(q)}`);
}

const EMPTY_STATS: StockStats = {
  open: 0,
  high: 0,
  low: 0,
  volume: "—",
  marketCap: "—",
  week52Low: 0,
  week52High: 0,
};

const SEVERITY_RANK: Record<DigestRow["severity"], Severity> = {
  minor: 1,
  notable: 2,
  significant: 3,
};

const DEFAULT_EXPLORE_QUERY = "inc";

function toStock(partial: { ticker: string; name?: string; watched?: boolean }): Stock {
  return {
    ticker: partial.ticker,
    name: partial.name || partial.ticker,
    price: 0,
    dayChangePct: 0,
    weekChangePct: 0,
    monthChangePct: 0,
    category: "",
    stats: EMPTY_STATS,
    sparklineData: [],
    events: [],
    watched: partial.watched ?? false,
    unreadCount: 0,
  };
}

async function fetchWatchlistRows(): Promise<WatchlistRow[]> {
  return request<WatchlistRow[]>(`/watchlist/${USER_ID}`);
}

async function searchHits(q: string): Promise<SearchHit[]> {
  const query = q.trim();
  if (!query) return [];
  return request<SearchHit[]>(`/search?q=${encodeURIComponent(query)}`);
}

async function resolveName(ticker: string): Promise<string> {
  try {
    const hits = await searchHits(ticker);
    const match = hits.find((h) => h.ticker.toUpperCase() === ticker.toUpperCase());
    return match?.name || hits[0]?.name || ticker;
  } catch {
    return ticker;
  }
}

function syntheticHistory(range: Range | string, endPrice = 100): PricePoint[] {
  const points =
    range === "7d" ? 7 : range === "1m" || range === "1M" ? 30 : range === "6M" ? 126 : range === "1Y" ? 252 : 90;
  const values: number[] = [endPrice];
  let v = endPrice;
  for (let i = 1; i < points; i++) {
    const seed = Math.sin(i * 12.9898 + points) * 43758.5453;
    const r = seed - Math.floor(seed) - 0.5;
    v = v / (1 + 0.0018 + r * 0.014);
    values.unshift(Number(v.toFixed(2)));
  }
  return values.map((price, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (points - 1 - i));
    return { t: d.toISOString().slice(0, 10), price };
  });
}

export const stocksApi = {
  async listWatchlist(): Promise<Stock[]> {
    const rows = await fetchWatchlistRows();
    return Promise.all(
      rows.map(async (row) =>
        toStock({
          ticker: row.ticker,
          name: await resolveName(row.ticker),
          watched: true,
        }),
      ),
    );
  },

  async search(q: string): Promise<Stock[]> {
    const [hits, rows] = await Promise.all([searchHits(q), fetchWatchlistRows()]);
    const watched = new Set(rows.map((r) => r.ticker.toUpperCase()));
    return hits.map((hit) =>
      toStock({
        ticker: hit.ticker,
        name: hit.name,
        watched: watched.has(hit.ticker.toUpperCase()),
      }),
    );
  },

  async listAll(): Promise<Stock[]> {
    return stocksApi.search(DEFAULT_EXPLORE_QUERY);
  },

  async getStock(ticker: string): Promise<Stock | undefined> {
    const [name, rows] = await Promise.all([resolveName(ticker), fetchWatchlistRows()]);
    const watched = rows.some((r) => r.ticker.toUpperCase() === ticker.toUpperCase());
    return toStock({ ticker, name, watched });
  },

  async getPriceHistory(_ticker: string, range: Range): Promise<PricePoint[]> {
    // No history endpoint on the backend yet.
    return syntheticHistory(range);
  },

  async getDigest(): Promise<{ lastChecked: string; entries: DigestEntry[] }> {
    const rows = await request<DigestRow[]>(`/digest/${USER_ID}`);
    const now = new Date().toISOString();
    const entries: DigestEntry[] = await Promise.all(
      rows.map(async (row, i) => ({
        id: `${row.ticker}-${i}`,
        ticker: row.ticker,
        name: await resolveName(row.ticker),
        reason: row.reason,
        severity: SEVERITY_RANK[row.severity] ?? 1,
        timestamp: now,
      })),
    );
    return { lastChecked: now, entries };
  },

  async toggleWatch(ticker: string): Promise<Stock[]> {
    const rows = await fetchWatchlistRows();
    const alreadyWatched = rows.some((r) => r.ticker.toUpperCase() === ticker.toUpperCase());
    // Backend can add to the watchlist but has no remove endpoint yet.
    if (!alreadyWatched) {
      await request(`/watchlist/${USER_ID}?ticker=${encodeURIComponent(ticker)}`, {
        method: "POST",
      });
    }
    return stocksApi.listWatchlist();
  },
};
