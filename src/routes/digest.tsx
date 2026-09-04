import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, Clock } from "lucide-react";
import { AppShell } from "@/components/pulse/AppShell";
import { SeverityMark } from "@/components/pulse/SeverityMark";
import { stocksApi } from "@/lib/api/stocks";

export const Route = createFileRoute("/digest")({
  head: () => ({
    meta: [
      { title: "Digest — What moved since you checked | Lens" },
      {
        name: "description",
        content:
          "A significance-sorted feed of what changed in your watchlist since you last checked, in plain English.",
      },
      { property: "og:title", content: "Digest — What moved since you checked | Lens" },
      {
        property: "og:description",
        content: "A significance-sorted feed of what changed in your watchlist.",
      },
    ],
  }),
  component: DigestPage,
});

function relative(ts: string) {
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function DigestPage() {
  const { data } = useQuery({ queryKey: ["digest"], queryFn: () => stocksApi.getDigest() });

  return (
    <AppShell>
      <div className="sticky top-[104px] z-10 -mx-5 flex items-center justify-between bg-background/95 px-5 py-3 backdrop-blur">
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[12px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Last checked:{" "}
          {data
            ? new Date(data.lastChecked).toLocaleString(undefined, {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[12px] font-medium text-primary"
        >
          Jump to now
          <ArrowDown className="h-3.5 w-3.5 rotate-180" />
        </button>
      </div>

      <h1 className="pt-4 text-lg font-semibold tracking-tight">Since you checked</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sorted by how meaningful the move was, not by time.
      </p>

      <ol className="relative mt-8 border-l border-border pl-6">
        {data?.entries.map((e) => (
          <li key={e.id} className="relative pb-9">
            <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Link
                to="/stock/$ticker"
                params={{ ticker: e.ticker }}
                className="text-[15px] font-semibold tracking-tight hover:text-primary"
              >
                {e.ticker}
              </Link>
              <span className="text-[13px] text-muted-foreground">{e.name}</span>
            </div>
            <p className="mt-1.5 text-[14px] leading-relaxed">{e.reason}</p>
            <div className="mt-2.5 flex items-center gap-4">
              <SeverityMark severity={e.severity} />
              <span className="text-[11px] text-muted-foreground">{relative(e.timestamp)}</span>
            </div>
          </li>
        ))}
      </ol>
    </AppShell>
  );
}
