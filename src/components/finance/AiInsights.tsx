import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Kpis } from "@/lib/finance";
import { toast } from "sonner";

interface Insights {
  summary: string;
  risks: string[];
  opportunities: string[];
  recommendations: string[];
}

export function AiInsights({ kpis }: { kpis: Kpis }) {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setData(null);
    try {
      const { data: res, error } = await supabase.functions.invoke("finance-insights", {
        body: {
          revenue: kpis.totalRevenue,
          expenses: kpis.totalExpenses,
          profit: kpis.profit,
          monthlyBurn: kpis.monthlyBurn,
          runwayMonths: kpis.runwayMonths,
          trendSummary: kpis.trendSummary,
        },
      });
      if (error) throw error;
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setData(res as Insights);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpis.totalRevenue, kpis.totalExpenses]);

  return (
    <Card className="p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">AI CFO Insights</h3>
            <p className="text-xs text-muted-foreground">Risks, opportunities & actions</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!loading && data && (
        <div className="space-y-5">
          <p className="rounded-lg bg-accent/40 p-3 text-sm leading-relaxed text-foreground">
            {data.summary}
          </p>

          <Section icon={AlertTriangle} title="Risks" tone="destructive" items={data.risks} />
          <Section icon={TrendingUp} title="Opportunities" tone="success" items={data.opportunities} />
          <Section icon={Lightbulb} title="Recommendations" tone="primary" items={data.recommendations} />
        </div>
      )}
    </Card>
  );
}

function Section({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof AlertTriangle;
  title: string;
  items: string[];
  tone: "destructive" | "success" | "primary";
}) {
  const toneClass = {
    destructive: "text-destructive",
    success: "text-success",
    primary: "text-primary",
  }[tone];
  return (
    <div>
      <div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${toneClass}`}>
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
            <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current ${toneClass}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
