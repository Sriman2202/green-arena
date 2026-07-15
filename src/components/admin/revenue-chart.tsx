"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export interface DailyStat {
  date: string;
  revenue: number;
  bookings: number;
}

export function RevenueChart({ data }: { data: DailyStat[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: string) => value.slice(5)}
          />
          <YAxis yAxisId="revenue" orientation="left" tick={{ fontSize: 12 }} width={48} />
          <YAxis
            yAxisId="bookings"
            orientation="right"
            tick={{ fontSize: 12 }}
            allowDecimals={false}
            width={36}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "Revenue" ? [`${CURRENCY_SYMBOL}${value}`, name] : [String(value), String(name)]
            }
          />
          <Legend />
          <Bar
            yAxisId="bookings"
            dataKey="bookings"
            name="Bookings"
            fill="var(--color-chart-2)"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
