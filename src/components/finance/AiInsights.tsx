import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, BrainCircuit, RefreshCw, Sparkles, TimerReset } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Kpis } from "@/lib/finance";

type BotKey =
  | "research"
  | "planning"
  | "accounting"
  | "treasury"
  | "compliance"
  | "reporting"
  | "decision"
  | "final";

interface BotPayload {
  bot: string;
  output: Record<string, unknown> | string;
  meta?: {
    duration_ms?: number;
  };
}

interface MultiAgentResponse {
  execution_flow: string[];
  bot_outputs?: Partial<Record<BotKey, BotPayload>>;
  research?: BotPayload;
  planning?: BotPayload;
  accounting?: BotPayload;
  treasury?: BotPayload;
  compliance?: BotPayload;
  reporting?: BotPayload;
  decision?: BotPayload;
  final?: BotPayload;
  latency_seconds?: number;
  validation?: {
    bot_failure_test_enabled?: boolean;
    debug_mode?: boolean;
    output_dependency_check?: string;
  };
}

const BOT_RESPONSE_KEYS: Record<BotKey, string[]> = {
  research: ["research", "research_ai"],
  planning: ["planning", "planning_ai"],
  accounting: ["accounting", "accounting_ai"],
  treasury: ["treasury", "treasury_ai"],
  compliance: ["compliance", "compliance_ai"],
  reporting: ["reporting", "reporting_ai"],
  decision: ["decision", "decision_ai"],
  final: ["final", "chief_command_ai"],
};

const BOT_ORDER: Array<{ key: BotKey; title: string; flowLabel: string; icon: typeof BrainCircuit }> = [
  { key: "research", title: "Research AI Output", flowLabel: "Research AI", icon: Sparkles },
  { key: "planning", title: "Planning AI Output", flowLabel: "Planning AI", icon: BrainCircuit },
  { key: "accounting", title: "Accounting AI Output", flowLabel: "Accounting AI", icon: CheckCircle2 },
  { key: "treasury", title: "Treasury AI Output", flowLabel: "Treasury AI", icon: TimerReset },
  { key: "compliance", title: "Compliance AI Output", flowLabel: "Compliance AI", icon: AlertTriangle },
  { key: "reporting", title: "Reporting AI Output", flowLabel: "Reporting AI", icon: BrainCircuit },
  { key: "decision", title: "Decision AI Output", flowLabel: "Decision AI", icon: BrainCircuit },
  { key: "final", title: "Final Decision", flowLabel: "Chief Command AI", icon: Sparkles },
];

export function AiInsights({ kpis }: { kpis: Kpis }) {
  const [data, setData] = useState<MultiAgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [simulateTreasuryFailure, setSimulateTreasuryFailure] = useState(false);
  const [researchOverride, setResearchOverride] = useState("");

  const apiBaseUrl = useMemo(() => {
    return import.meta.env.VITE_FINANCE_AI_API_URL || "http://localhost:8000";
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setData(null);
    try {
      const response = await fetch(`${apiBaseUrl}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          revenue: kpis.totalRevenue,
          expenses: kpis.totalExpenses,
          profit: kpis.profit,
          monthlyBurn: kpis.monthlyBurn,
          runwayMonths: kpis.runwayMonths,
          trendSummary: kpis.trendSummary,
          transaction_count: kpis.monthly.length,
          debug_mode: debugMode,
          simulate_treasury_failure: simulateTreasuryFailure,
          research_override: researchOverride.trim() ? { note: researchOverride.trim() } : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as MultiAgentResponse;
      setData(payload);
    } catch (error) {
      console.error(error);
      toast.error("Failed to run multi-agent pipeline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpis.totalRevenue, kpis.totalExpenses, debugMode, simulateTreasuryFailure]);

  const executionFlow = data?.execution_flow ?? [];
  const finalDecision = data?.final ?? data?.bot_outputs?.final;

  return (
    <div className="space-y-6">
      <Card className="p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Multi-Agent Finance Console</h3>
              <p className="text-xs text-muted-foreground">Each bot runs independently and surfaces its own output</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
                <Switch checked={debugMode} onCheckedChange={setDebugMode} />
                <Label className="text-xs font-medium">Debug mode</Label>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
                <Switch checked={simulateTreasuryFailure} onCheckedChange={setSimulateTreasuryFailure} />
                <Label className="text-xs font-medium">Treasury failure test</Label>
              </div>
              {data?.latency_seconds !== undefined && (
                <Badge variant="secondary">Latency: {data.latency_seconds}s</Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="research-override" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Research override for dependency check
              </Label>
              <Textarea
                id="research-override"
                value={researchOverride}
                onChange={(event) => setResearchOverride(event.target.value)}
                placeholder="Optional manual note to force a different research input and verify planning changes"
                className="min-h-24"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Execution Flow Tracker
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {BOT_ORDER.map((bot) => {
                const active = executionFlow.includes(bot.flowLabel);
                return (
                  <div
                    key={bot.key}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${active ? "border-success/40 bg-success/10" : "border-border bg-background"}`}
                  >
                    <span>{bot.flowLabel}</span>
                    <span className={active ? "text-success" : "text-muted-foreground"}>{active ? "✅" : "…"}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Validation note: the planning bot consumes research output directly, and the treasury failure toggle should visibly change downstream output.
            </div>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {BOT_ORDER.map((bot) => (
            <Card key={bot.key} className="p-5 shadow-[var(--shadow-card)]">
              <Skeleton className="mb-3 h-5 w-44" />
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      )}

      {!loading && data && (
        <div className="grid gap-4 lg:grid-cols-2">
          {BOT_ORDER.map((bot) => {
            const payload = getBotPayload(data, bot.key);
            return <BotPanel key={bot.key} title={bot.title} icon={bot.icon} payload={payload} debugMode={debugMode} />;
          })}
        </div>
      )}

      {!loading && finalDecision && (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Final Decision</h3>
              <p className="text-xs text-muted-foreground">Centralized summary from Chief Command AI</p>
            </div>
          </div>
          <pre className="overflow-auto rounded-lg bg-muted/40 p-4 text-xs leading-relaxed text-foreground">
            {JSON.stringify(finalDecision, null, debugMode ? 2 : 0)}
          </pre>
          {data?.validation && (
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <div>Failure test: {data.validation.bot_failure_test_enabled ? "enabled" : "disabled"}</div>
              <div>Debug mode: {data.validation.debug_mode ? "on" : "off"}</div>
              <div>{data.validation.output_dependency_check}</div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function getBotPayload(data: MultiAgentResponse, key: BotKey): BotPayload | undefined {
  for (const candidate of BOT_RESPONSE_KEYS[key]) {
    const botOutputs = data.bot_outputs as Record<string, BotPayload | undefined> | undefined;
    const payloadFromMap = botOutputs?.[candidate];
    if (payloadFromMap) return payloadFromMap;

    const payloadFromTopLevel = data[candidate as keyof MultiAgentResponse];
    if (payloadFromTopLevel) return payloadFromTopLevel as BotPayload;
  }

  return undefined;
}

function BotPanel({
  title,
  icon: Icon,
  payload,
  debugMode,
}: {
  title: string;
  icon: typeof BrainCircuit;
  payload?: BotPayload;
  debugMode: boolean;
}) {
  return (
    <Card className="p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{payload?.bot ?? "Waiting for agent output"}</p>
          </div>
        </div>
        {payload?.meta?.duration_ms !== undefined && <Badge variant="outline">{payload.meta.duration_ms} ms</Badge>}
      </div>

      {payload ? (
        debugMode ? (
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-xs leading-relaxed">
            {JSON.stringify(payload, null, 2)}
          </pre>
        ) : (
          <div className="space-y-2 text-sm leading-relaxed text-foreground">
            <div className="rounded-lg bg-muted/40 p-3 whitespace-pre-wrap">{renderCleanValue(payload.output)}</div>
          </div>
        )
      ) : (
        <div className="text-sm text-muted-foreground">No output yet.</div>
      )}
    </Card>
  );
}

function renderCleanValue(value: Record<string, unknown> | string) {
  if (typeof value === "string") return value;

  const entries = Object.entries(value);
  if (entries.length === 0) return "No structured output returned.";

  return entries
    .map(([key, current]) => {
      if (Array.isArray(current)) {
        return `${prettyKey(key)}: ${current.length ? current.map((item) => stringifyValue(item)).join(" | ") : "None"}`;
      }
      if (typeof current === "object" && current !== null) {
        return `${prettyKey(key)}: ${stringifyValue(current)}`;
      }
      return `${prettyKey(key)}: ${stringifyValue(current)}`;
    })
    .join("\n");
}

function prettyKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) return "None";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
