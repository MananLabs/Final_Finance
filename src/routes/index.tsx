import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Flame,
  Clock,
  LineChart as LineIcon,
  RotateCcw,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/finance/FileUpload";
import { KpiCard } from "@/components/finance/KpiCard";
import { TrendChart } from "@/components/finance/TrendChart";
import { AiInsights } from "@/components/finance/AiInsights";
import { PriorityBadge } from "@/components/finance/PriorityBadge";
import { computeKpis, formatCurrency, type Transaction } from "@/lib/finance";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Finance AI · CFO Dashboard" },
      {
        name: "description",
        content:
          "Upload financial data and get instant AI-powered KPIs, forecasts, and CFO-grade recommendations.",
      },
    ],
  }),
});

function Index() {
  const [txns, setTxns] = useState<Transaction[] | null>(null);
  const [filename, setFilename] = useState<string>("");

  const kpis = useMemo(() => (txns ? computeKpis(txns) : null), [txns]);

  return (
    <div className="min-h-screen">
      <Toaster richColors position="top-right" />
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              <LineIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Finance AI</h1>
              <p className="text-xs text-muted-foreground">AI-powered CFO dashboard</p>
            </div>
          </div>
          {txns && (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">{filename}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTxns(null);
                  setFilename("");
                }}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                New upload
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {!kpis && (
          <section className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Turn raw financials into{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "var(--gradient-hero)" }}
                >
                  CFO-grade insights
                </span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Upload a CSV or Excel of transactions. We compute KPIs, forecast trends, and let an AI
                CFO surface risks, opportunities, and concrete actions.
              </p>
            </div>
            <FileUpload
              onLoaded={(t, f) => {
                setTxns(t);
                setFilename(f);
              }}
            />
          </section>
        )}

        {kpis && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Financial overview</h2>
                <p className="text-sm text-muted-foreground">{kpis.trendSummary}</p>
              </div>
              <PriorityBadge priority={kpis.priority} reason={kpis.priorityReason} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard
                label="Total Revenue"
                value={formatCurrency(kpis.totalRevenue)}
                icon={TrendingUp}
                tone="success"
              />
              <KpiCard
                label="Total Expenses"
                value={formatCurrency(kpis.totalExpenses)}
                icon={TrendingDown}
                tone="destructive"
              />
              <KpiCard
                label="Net Profit"
                value={formatCurrency(kpis.profit)}
                icon={Wallet}
                tone={kpis.profit >= 0 ? "success" : "destructive"}
                hint={kpis.profit >= 0 ? "Profitable" : "Operating at a loss"}
              />
              <KpiCard
                label="Monthly Burn"
                value={kpis.monthlyBurn > 0 ? formatCurrency(kpis.monthlyBurn) : "—"}
                icon={Flame}
                tone={kpis.monthlyBurn > 0 ? "warning" : "default"}
                hint={kpis.monthlyBurn > 0 ? "Avg last 3 months" : "No burn"}
              />
              <KpiCard
                label="Runway"
                value={
                  kpis.runwayMonths === null
                    ? "∞"
                    : `${kpis.runwayMonths.toFixed(1)} mo`
                }
                icon={Clock}
                tone={
                  kpis.runwayMonths !== null && kpis.runwayMonths < 6
                    ? "destructive"
                    : kpis.runwayMonths !== null && kpis.runwayMonths < 12
                      ? "warning"
                      : "default"
                }
                hint={kpis.runwayMonths === null ? "Profitable" : "Months left"}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <TrendChart monthly={kpis.monthly} forecast={kpis.forecast} />
              </div>
              <div className="lg:col-span-2">
                <AiInsights kpis={kpis} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
