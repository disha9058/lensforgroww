import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/pulse/AppShell";
import { StockRow } from "@/components/pulse/StockRow";
import { stocksApi } from "@/lib/api/stocks";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Stocks — Lens" },
      {
        name: "description",
        content: "Browse stocks and bookmark them to your Lens watchlist.",
      },
      { property: "og:title", content: "Explore Stocks — Lens" },
      {
        property: "og:description",
        content: "Browse stocks and bookmark them to your Lens watchlist.",
      },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["stocks"], queryFn: () => stocksApi.listAll() });

  const toggle = async (ticker: string) => {
    await stocksApi.toggleWatch(ticker);
    qc.invalidateQueries();
  };

  return (
    <AppShell>
      <h1 className="pt-6 pb-2 text-sm font-medium text-muted-foreground">All instruments</h1>
      {data?.map((s) => <StockRow key={s.ticker} stock={s} onToggleWatch={toggle} />)}
    </AppShell>
  );
}
