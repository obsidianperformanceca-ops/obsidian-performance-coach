"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";

export interface WeightChartPoint {
  date: string;
  weightKg: number;
}

export function WeightChart({
  data,
  goalWeightKg,
}: {
  data: WeightChartPoint[];
  goalWeightKg?: number | null;
}) {
  const formatted = data.map((d) => ({ ...d, label: format(new Date(d.date), "MMM d") }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formatted} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232329" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#6b6b75"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          stroke="#6b6b75"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={["dataMin - 2", "dataMax + 2"]}
        />
        <Tooltip
          contentStyle={{
            background: "#111114",
            border: "1px solid #232329",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#9a9aa4" }}
        />
        <Line
          type="monotone"
          dataKey="weightKg"
          stroke="#4f7cff"
          strokeWidth={2}
          dot={{ r: 3, fill: "#4f7cff", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        {goalWeightKg && (
          <Line
            type="monotone"
            dataKey={() => goalWeightKg}
            stroke="#6b6b75"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
