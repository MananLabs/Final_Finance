import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { MonthlyPoint } from "@/lib/finance";
import { formatCurrency } from "@/lib/finance";

interface Props {
  monthly: MonthlyPoint[];
  forecast: MonthlyPoint[];
}

export function TrendChart({ monthly, forecast }: Props) {
  const data = [
    ...monthly.map((m) => ({ ...m, isForecast: false })),
    ...forecast.map((m) => ({ ...m, isForecast: true })),
  ];
  const splitMonth = forecast[0]?.month;

  return (
    <Card className="p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h3 className="text-base font-semibold">Revenue vs Expenses</h3>
          <p className="text-xs text-muted-foreground">
            Monthly trend{forecast.length ? " · 3-month forecast (dashed)" : ""}
          </p>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(v) => formatCurrency(Number(v))}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(v: number) => formatCurrency(v)}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {splitMonth && (
              <ReferenceLine
                x={splitMonth}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="2 2"
                label={{ value: "forecast", fontSize: 10, fill: "var(--color-muted-foreground)" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="var(--color-chart-2)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="var(--color-chart-3)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="net"
              name="Net"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
