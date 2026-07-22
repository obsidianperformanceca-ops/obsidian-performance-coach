"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";

export interface CaloriePoint {
  date: string;
  calories: number;
  proteinG: number;
}

/**
 * Daily calories-eaten bar chart with the target as a dashed reference
 * line — the "am I consistently around my number?" view that MFP users
 * check weekly. Bars are summed from per-meal estimates.
 */
export function CalorieChart({
  data,
  targetCalories,
}: {
  data: CaloriePoint[];
  targetCalories?: number | null;
}) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(`${d.date}T00:00:00`), "MMM d"),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232329" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#6b6b75"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis stroke="#6b6b75" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "#1a1a1f" }}
          contentStyle={{
            background: "#111114",
            border: "1px solid #232329",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#9a9aa4" }}
          formatter={(value, name) =>
            name === "calories" ? [`${value} kcal`, "Calories"] : [`${value} g`, "Protein"]
          }
        />
        <Bar dataKey="calories" fill="#4f7cff" radius={[4, 4, 0, 0]} maxBarSize={22} />
        {targetCalories != null && (
          <ReferenceLine
            y={targetCalories}
            stroke="#6b6b75"
            strokeDasharray="4 4"
            label={{ value: "target", position: "insideTopRight", fill: "#6b6b75", fontSize: 11 }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
