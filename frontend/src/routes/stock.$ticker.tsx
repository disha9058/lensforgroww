import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/pulse/AppShell";
import { SeverityMark } from "@/components/pulse/SeverityMark";
import { stocksApi } from "@/lib/api/stocks";
import type { Range } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stock/$ticker")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.ticker} — Price & detected events | Lens` },
      {
        name: "description",
        content: `Price history and the chronological log of detected events for ${params.ticker} on Lens.`,
      },
      { property: "og:title", content: `${params.ticker} — Price & detected events | Lens` },
      {
        property: "og:description",
        content: `Price history and detected events for ${params.ticker}.`,
      },
    ],
  }),
  component: StockDetail,
});

const RANGES: Range[] = ["7d", "1m", "3m"];

function StockDetail() {
  const { ticker } = Route.useParams();
  const [range, setRange] = useState<Range>("1m");

  const { data: stock } = useQuery({
    queryKey: ["stock", ticker],
    queryFn: () => stocksApi.getStock(ticker),
  });
  const { data: history } = useQuery({
    queryKey: ["history", ticker, range],
    queryFn: () => stocksApi.getPriceHistory(ticker, range),
  });

  const up = (stock?.dayChangePct ?? 0) >= 0;

  return (
    <AppShell>
      <div className="pt-7">
        <h1 className="text-2xl font-semibold tracking-tight">{stock?.ticker ?? ticker}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{stock?.name}</p>

        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-[32px] font-semibold tabular-nums tracking-tight">
            {stock?.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span
            className={cn("text-sm font-medium tabular-nums", up ? "text-gain" : "text-loss")}
          >
            {up ? "+" : ""}
            {stock?.dayChangePct.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="mt-6 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history ?? []} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="t"
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              domain={["dataMin", "dataMax"]}
              width={52}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
                color: "var(--foreground)",
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={up ? "var(--gain)" : "var(--loss)"}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              r === range
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <h2 className="mt-12 text-sm font-medium text-muted-foreground">Detected events</h2>
      <div className="mt-2">
        {stock?.events.length === 0 && (
          <p className="py-6 text-sm text-muted-foreground">
            Nothing unusual detected for this stock yet.
          </p>
        )}
        {[...(stock?.events ?? [])]
          .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
          .map((e) => (
            <div key={e.id} className="border-b border-border py-4">
              <p className="text-[14px] leading-relaxed">{e.reason}</p>
              <div className="mt-2.5 flex items-center gap-4">
                <SeverityMark severity={e.severity} />
                <span className="text-[11px] text-muted-foreground">
                  {new Date(e.timestamp).toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
      </div>
    </AppShell>
  );
}
