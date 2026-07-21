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
import { displayWeight } from "@/lib/utils/units";
import type { UnitPreference } from "@/types/database";

export interface WeightChartPoint {
  date: string;
  weightKg: number;
}

export function WeightChart({
  data,
  goalWeightKg,
  unit = "METRIC",
}: {
  data: WeightChartPoint[];
  goalWeightKg?: number | null;
  unit?: UnitPreference;
}) {
  const unitLabel = unit === "IMPERIAL" ? "lb" : "kg";
  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "MMM d"),
    weightDisplay: displayWeight(d.weightKg, unit),
  }));
  const goalDisplay = goalWeightKg != null ? displayWeight(goalWeightKg, unit) : null;

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
          unit={` ${unitLabel}`}
        />
        <Tooltip
          contentStyle={{
            background: "#111114",
            border: "1px solid #232329",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#9a9aa4" }}
          formatter={(value) => [`${value} ${unitLabel}`, "Weight"]}
        />
        <Line
          type="monotone"
          dataKey="weightDisplay"
          stroke="#4f7cff"
          strokeWidth={2}
          dot={{ r: 3, fill: "#4f7cff", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        {goalDisplay && (
          <Line
            type="monotone"
            dataKey={() => goalDisplay}
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
