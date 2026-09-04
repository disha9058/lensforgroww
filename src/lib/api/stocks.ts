import { LAST_CHECKED, MOCK_STOCKS } from "./mockData";
import { request, USE_MOCK } from "./client";
import type { DigestEntry, PricePoint, Range, Stock } from "./types";

/** In-memory store standing in for the backend while mocking. */
let store: Stock[] = MOCK_STOCKS.map((s) => ({ ...s }));

const delay = <T>(value: T, ms = 180) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

export const stocksApi = {
  async listWatchlist(): Promise<Stock[]> {
    if (!USE_MOCK) return request<Stock[]>("/watchlist");
    return delay(store.filter((s) => s.watched));
  },

  async listAll(): Promise<Stock[]> {
    if (!USE_MOCK) return request<Stock[]>("/stocks");
    return delay(store);
  },

  async getStock(ticker: string): Promise<Stock | undefined> {
    if (!USE_MOCK) return request<Stock>(`/stocks/${ticker}`);
    return delay(store.find((s) => s.ticker === ticker));
  },

  async getPriceHistory(ticker: string, range: Range): Promise<PricePoint[]> {
    if (!USE_MOCK)
      return request<PricePoint[]>(`/stocks/${ticker}/history?range=${range}`);
    const stock = store.find((s) => s.ticker === ticker);
    const points = range === "7d" ? 7 : range === "1m" ? 30 : 90;
    const base = stock?.sparklineData ?? [100];
    const out: PricePoint[] = [];
    let v = (stock?.price ?? 100) * 0.9;
    for (let i = 0; i < points; i++) {
      const seed = Math.sin(i * 12.9898 + points) * 43758.5453;
      const r = seed - Math.floor(seed) - 0.5;
      v = v * (1 + 0.0022 + r * 0.02);
      const d = new Date();
      d.setDate(d.getDate() - (points - i));
      out.push({
        t: d.toISOString().slice(0, 10),
        price: Number(v.toFixed(2)),
      });
    }
    if (out.length) out[out.length - 1]!.price = stock?.price ?? base[base.length - 1]!;
    return delay(out);
  },

  async getDigest(): Promise<{ lastChecked: string; entries: DigestEntry[] }> {
    if (!USE_MOCK)
      return request<{ lastChecked: string; entries: DigestEntry[] }>("/digest");
    const entries: DigestEntry[] = store
      .filter((s) => s.watched)
      .flatMap((s) => s.events.map((e) => ({ ...e, ticker: s.ticker, name: s.name })))
      .sort(
        (a, b) =>
          b.severity - a.severity ||
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    return delay({ lastChecked: LAST_CHECKED, entries });
  },

  async toggleWatch(ticker: string): Promise<Stock[]> {
    if (!USE_MOCK) return request<Stock[]>(`/watchlist/${ticker}/toggle`, { method: "POST" });
    store = store.map((s) => (s.ticker === ticker ? { ...s, watched: !s.watched } : s));
    return delay(store, 60);
  },
};
