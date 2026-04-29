export type TxType = "Revenue" | "Expense";

export interface Transaction {
  date: string; // ISO yyyy-mm-dd
  type: TxType;
  amount: number;
  category: string;
}

export interface MonthlyPoint {
  month: string; // yyyy-mm
  revenue: number;
  expenses: number;
  net: number;
}

export interface Kpis {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  monthlyBurn: number; // avg monthly net loss (positive number = burning cash)
  runwayMonths: number | null; // null = infinite (profitable) or N/A
  cashOnHand: number; // running net = profit
  monthly: MonthlyPoint[];
  forecast: MonthlyPoint[];
  priority: "CRITICAL" | "WARNING" | "NORMAL";
  priorityReason: string;
  trendSummary: string;
}

export function parseAmount(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return NaN;
  const cleaned = v.replace(/[^0-9.\-]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

export function normalizeType(v: unknown): TxType | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (["revenue", "income", "sales", "credit"].includes(s)) return "Revenue";
  if (["expense", "expenses", "cost", "debit", "spend"].includes(s)) return "Expense";
  return null;
}

export function normalizeDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  // try direct
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  // try dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [_, dd, mm, yy] = m;
    if (yy.length === 2) yy = "20" + yy;
    const d2 = new Date(Number(yy), Number(mm) - 1, Number(dd));
    if (!isNaN(d2.getTime())) return d2.toISOString().slice(0, 10);
  }
  return null;
}

export function cleanRows(rows: Record<string, unknown>[]): {
  txns: Transaction[];
  skipped: number;
} {
  const lower = (k: string) => k.trim().toLowerCase();
  const findKey = (row: Record<string, unknown>, candidates: string[]) => {
    const keys = Object.keys(row);
    for (const c of candidates) {
      const found = keys.find((k) => lower(k) === c);
      if (found) return found;
    }
    return null;
  };

  const txns: Transaction[] = [];
  let skipped = 0;
  for (const row of rows) {
    const dateK = findKey(row, ["date", "transaction date", "txn date"]);
    const typeK = findKey(row, ["type", "category type", "kind"]);
    const amtK = findKey(row, ["amount", "value", "total"]);
    const catK = findKey(row, ["category", "description", "label"]);
    if (!dateK || !typeK || !amtK) {
      skipped++;
      continue;
    }
    const date = normalizeDate(row[dateK]);
    const type = normalizeType(row[typeK]);
    const amount = Math.abs(parseAmount(row[amtK]));
    const category = catK ? String(row[catK] ?? "Uncategorized") : "Uncategorized";
    if (!date || !type || !isFinite(amount)) {
      skipped++;
      continue;
    }
    txns.push({ date, type, amount, category });
  }
  return { txns, skipped };
}

export function computeKpis(txns: Transaction[]): Kpis {
  const totalRevenue = txns.filter((t) => t.type === "Revenue").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = txns.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
  const profit = totalRevenue - totalExpenses;

  // group by month
  const map = new Map<string, MonthlyPoint>();
  for (const t of txns) {
    const m = t.date.slice(0, 7);
    const cur = map.get(m) ?? { month: m, revenue: 0, expenses: 0, net: 0 };
    if (t.type === "Revenue") cur.revenue += t.amount;
    else cur.expenses += t.amount;
    cur.net = cur.revenue - cur.expenses;
    map.set(m, cur);
  }
  const monthly = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));

  // burn = average monthly net loss across last up to 3 months (positive value means burning)
  const recent = monthly.slice(-3);
  const avgNet = recent.length ? recent.reduce((s, m) => s + m.net, 0) / recent.length : 0;
  const monthlyBurn = avgNet < 0 ? Math.abs(avgNet) : 0;

  const cashOnHand = profit;
  const runwayMonths = monthlyBurn > 0 ? Math.max(0, cashOnHand / monthlyBurn) : null;

  // forecast: linear regression on net per month for 3 months ahead
  const forecast: MonthlyPoint[] = [];
  if (monthly.length >= 2) {
    const n = monthly.length;
    const xs = monthly.map((_, i) => i);
    const ysR = monthly.map((m) => m.revenue);
    const ysE = monthly.map((m) => m.expenses);
    const lin = (ys: number[]) => {
      const xMean = xs.reduce((a, b) => a + b, 0) / n;
      const yMean = ys.reduce((a, b) => a + b, 0) / n;
      let num = 0,
        den = 0;
      for (let i = 0; i < n; i++) {
        num += (xs[i] - xMean) * (ys[i] - yMean);
        den += (xs[i] - xMean) ** 2;
      }
      const slope = den === 0 ? 0 : num / den;
      const intercept = yMean - slope * xMean;
      return (x: number) => Math.max(0, intercept + slope * x);
    };
    const fR = lin(ysR);
    const fE = lin(ysE);
    const lastMonth = monthly[monthly.length - 1].month;
    const [y, mo] = lastMonth.split("-").map(Number);
    for (let i = 1; i <= 3; i++) {
      const d = new Date(y, mo - 1 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const r = fR(n - 1 + i);
      const e = fE(n - 1 + i);
      forecast.push({ month: key, revenue: r, expenses: e, net: r - e });
    }
  }

  // priority
  let priority: Kpis["priority"] = "NORMAL";
  let priorityReason = "Financials are stable.";
  const lossThreshold = totalRevenue * 0.2; // > 20% loss vs revenue is critical
  if (profit < 0 && Math.abs(profit) > lossThreshold && totalRevenue > 0) {
    priority = "CRITICAL";
    priorityReason = "Net loss exceeds 20% of revenue.";
  } else if (runwayMonths !== null && runwayMonths < 6) {
    priority = "CRITICAL";
    priorityReason = `Runway under 6 months (${runwayMonths.toFixed(1)}).`;
  } else if (monthlyBurn > 0 && (runwayMonths === null || runwayMonths < 12)) {
    priority = "WARNING";
    priorityReason = "High burn rate detected.";
  } else if (profit < 0) {
    priority = "WARNING";
    priorityReason = "Operating at a net loss.";
  }

  // trend summary
  let trendSummary = "Insufficient data for trend.";
  if (monthly.length >= 2) {
    const first = monthly[0];
    const last = monthly[monthly.length - 1];
    const revGrowth = first.revenue ? ((last.revenue - first.revenue) / first.revenue) * 100 : 0;
    const expGrowth = first.expenses ? ((last.expenses - first.expenses) / first.expenses) * 100 : 0;
    trendSummary = `Across ${monthly.length} months: revenue ${revGrowth >= 0 ? "+" : ""}${revGrowth.toFixed(1)}%, expenses ${expGrowth >= 0 ? "+" : ""}${expGrowth.toFixed(1)}%.`;
  }

  return {
    totalRevenue,
    totalExpenses,
    profit,
    monthlyBurn,
    runwayMonths,
    cashOnHand,
    monthly,
    forecast,
    priority,
    priorityReason,
    trendSummary,
  };
}

export function formatCurrency(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}₹${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}
