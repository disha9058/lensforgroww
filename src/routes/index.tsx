import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { AppShell } from "@/components/pulse/AppShell";
import { StockRow } from "@/components/pulse/StockRow";
import { stocksApi } from "@/lib/api/stocks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Watchlist — Pulse Stock Tracker" },
      {
        name: "description",
        content:
          "Track your stocks in a clean dark watchlist with live prices, day change and sparklines.",
      },
      { property: "og:title", content: "Watchlist — Pulse Stock Tracker" },
      {
        property: "og:description",
        content: "Track your stocks with live prices, day change and sparklines.",
      },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => stocksApi.listWatchlist(),
  });

  const toggle = async (ticker: string) => {
    await stocksApi.toggleWatch(ticker);
    qc.invalidateQueries();
  };

  return (
    <AppShell>
      <h1 className="sr-only">Watchlist</h1>
      {isLoading && <p className="py-10 text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && data && data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <Bookmark className="h-6 w-6 text-primary" />
          </span>
          <p className="mt-5 text-base font-medium">Add stocks to build your Pulse</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll watch them and tell you what actually changed.
          </p>
          <Link
            to="/explore"
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Explore stocks
          </Link>
        </div>
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="pt-2">
          {data.map((s) => (
            <StockRow key={s.ticker} stock={s} onToggleWatch={toggle} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
