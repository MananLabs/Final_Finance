import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Kpis } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority, reason }: { priority: Kpis["priority"]; reason: string }) {
  const cfg = {
    CRITICAL: {
      icon: AlertCircle,
      label: "Critical",
      classes: "bg-destructive/10 text-destructive border-destructive/30",
    },
    WARNING: {
      icon: AlertTriangle,
      label: "Warning",
      classes: "bg-warning/15 text-warning-foreground border-warning/40",
    },
    NORMAL: {
      icon: CheckCircle2,
      label: "Normal",
      classes: "bg-success/10 text-success border-success/30",
    },
  }[priority];
  const Icon = cfg.icon;
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium", cfg.classes)}>
      <Icon className="h-4 w-4" />
      <span>{cfg.label}</span>
      <span className="hidden text-xs opacity-80 sm:inline">· {reason}</span>
    </div>
  );
}
