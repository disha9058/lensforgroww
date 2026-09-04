export type Severity = 1 | 2 | 3;

export interface StockEvent {
  id: string;
  reason: string;
  severity: Severity;
  timestamp: string; // ISO
}

export interface Stock {
  ticker: string;
  name: string;
  price: number;
  dayChangePct: number;
  sparklineData: number[];
  events: StockEvent[];
  watched: boolean;
  unreadCount: number;
}

export type Range = "7d" | "1m" | "3m";

export interface PricePoint {
  t: string;
  price: number;
}

export interface DigestEntry extends StockEvent {
  ticker: string;
  name: string;
}
