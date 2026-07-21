import { differenceInCalendarDays, startOfWeek, subDays } from "date-fns";

export interface WeightPoint {
  weightKg: number;
  recordedAt: string | Date;
}

/** Average of all weigh-ins within the last 7 days (inclusive of today). */
export function weeklyAverageWeight(weights: WeightPoint[], today = new Date()): number | null {
  const cutoff = subDays(today, 6);
  const inWindow = weights.filter((w) => new Date(w.recordedAt) >= cutoff);
  if (inWindow.length === 0) return null;
  const sum = inWindow.reduce((acc, w) => acc + w.weightKg, 0);
  return round1(sum / inWindow.length);
}

/** This week's average minus last week's average (7–13 days ago). */
export function weeklyWeightChange(weights: WeightPoint[], today = new Date()): number | null {
  const thisWeek = weeklyAverageWeight(weights, today);
  const lastWeekWindowStart = subDays(today, 13);
  const lastWeekWindowEnd = subDays(today, 7);
  const lastWeekPoints = weights.filter((w) => {
    const d = new Date(w.recordedAt);
    return d >= lastWeekWindowStart && d <= lastWeekWindowEnd;
  });
  if (thisWeek === null || lastWeekPoints.length === 0) return null;
  const lastWeekAvg =
    lastWeekPoints.reduce((acc, w) => acc + w.weightKg, 0) / lastWeekPoints.length;
  return round1(thisWeek - lastWeekAvg);
}

/** Change over the trailing 30 days, comparing average of first 7 vs last 7 days in range. */
export function monthlyWeightChange(weights: WeightPoint[], today = new Date()): number | null {
  const cutoff = subDays(today, 30);
  const inRange = weights
    .filter((w) => new Date(w.recordedAt) >= cutoff)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  if (inRange.length < 2) return null;
  const earliest = inRange.slice(0, Math.max(1, Math.ceil(inRange.length * 0.2)));
  const latest = inRange.slice(-Math.max(1, Math.ceil(inRange.length * 0.2)));
  const avg = (arr: WeightPoint[]) => arr.reduce((a, w) => a + w.weightKg, 0) / arr.length;
  return round1(avg(latest) - avg(earliest));
}

export interface ComplianceInput {
  totalDays: number;
  completedDays: number;
}

export function compliancePercent({ totalDays, completedDays }: ComplianceInput): number {
  if (totalDays <= 0) return 0;
  return Math.round((completedDays / totalDays) * 100);
}

/** Days since a given date, used for "hasn't checked in" flags. */
export function daysSince(date: string | Date | null, today = new Date()): number | null {
  if (!date) return null;
  return differenceInCalendarDays(today, new Date(date));
}

export function currentWeekStart(today = new Date()) {
  return startOfWeek(today, { weekStartsOn: 1 });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export interface StreakLogInput {
  logDate: string | Date;
  hasActivity: boolean; // true if the client actually logged something that day
}

/** Consecutive days (ending today or yesterday) with an actual check-in. */
export function computeStreak(logs: StreakLogInput[], today = new Date()): number {
  const loggedDates = new Set(
    logs.filter((l) => l.hasActivity).map((l) => new Date(l.logDate).toDateString())
  );

  let streak = 0;
  let cursor = new Date(today);

  // Allow "today not logged yet" to not break the streak.
  if (!loggedDates.has(cursor.toDateString())) {
    cursor = subDays(cursor, 1);
  }

  while (loggedDates.has(cursor.toDateString())) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
}

export interface ComplianceLogInput {
  status: string;
  workoutCompleted: boolean | null;
  steps: number | null;
}

export interface ComplianceBreakdown {
  workout: number;
  nutrition: number;
  steps: number;
  cardio: number;
}

/**
 * Percentage breakdowns over the given window.
 * Note: cardio compliance currently reuses workout_completed as a proxy —
 * add a dedicated `cardio_minutes` column to daily_logs if you want to
 * track cardio separately from strength sessions.
 */
export function complianceBreakdown(
  logs: ComplianceLogInput[],
  stepGoal: number | null,
  totalDays: number
): ComplianceBreakdown {
  const workoutDays = logs.filter((l) => l.workoutCompleted).length;
  const nutritionDays = logs.filter((l) => l.status !== "PENDING").length;
  const stepDays = stepGoal ? logs.filter((l) => (l.steps ?? 0) >= stepGoal).length : 0;

  return {
    workout: compliancePercent({ totalDays, completedDays: workoutDays }),
    nutrition: compliancePercent({ totalDays, completedDays: nutritionDays }),
    steps: stepGoal ? compliancePercent({ totalDays, completedDays: stepDays }) : 0,
    cardio: compliancePercent({ totalDays, completedDays: workoutDays }),
  };
}
