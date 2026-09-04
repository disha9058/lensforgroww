export type Severity = 1 | 2 | 3;

export interface StockEvent {
  id: string;
  reason: string;
  severity: Severity;
  timestamp: string; // ISO
}

export interface StockStats {
  open: number;
  high: number;
  low: number;
  volume: string;
  marketCap: string;
  week52Low: number;
  week52High: number;
}

export interface Stock {
  ticker: string;
  name: string;
  price: number;
  dayChangePct: number;
  weekChangePct: number;
  monthChangePct: number;
  category: string;
  stats: StockStats;
  sparklineData: number[];
  events: StockEvent[];
  watched: boolean;
  unreadCount: number;
}

export type Range = "1M" | "6M" | "1Y" | "3Y" | "ALL";

export type MetricPeriod = "1D" | "1W" | "1M";

export interface PricePoint {
  t: string;
  price: number;
}

export interface DigestEntry extends StockEvent {
  ticker: string;
  name: string;
}
