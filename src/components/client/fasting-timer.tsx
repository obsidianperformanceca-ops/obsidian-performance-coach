"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import type { Database } from "@/types/database";

type FastRow = Database["public"]["Tables"]["fasts"]["Row"];

function formatElapsed(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function FastingTimer({ activeFast, lastFast }: { activeFast: FastRow | null; lastFast: FastRow | null }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);

  // Tick every 30s while a fast is running so the elapsed display stays
  // fresh without a per-second re-render.
  useEffect(() => {
    if (!activeFast) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [activeFast]);

  async function toggle() {
    setLoading(true);
    await fetch("/api/fasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: activeFast ? "end" : "start" }),
    });
    setLoading(false);
    router.refresh();
  }

  const elapsed = activeFast ? now - new Date(activeFast.started_at).getTime() : 0;
  const lastDuration =
    lastFast?.ended_at != null
      ? new Date(lastFast.ended_at).getTime() - new Date(lastFast.started_at).getTime()
      : null;

  return (
    <Card>
      <CardHeader><CardTitle>Fasting</CardTitle></CardHeader>
      {activeFast ? (
        <div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{formatElapsed(elapsed)}</p>
          <p className="mt-1 text-xs text-subtle">
            Fasting since{" "}
            {new Date(activeFast.started_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">
          {lastDuration != null
            ? `Last fast: ${formatElapsed(lastDuration)}. Not currently fasting.`
            : "Track your fasting windows — start a fast after your last meal of the day."}
        </p>
      )}
      <Button
        type="button"
        size="sm"
        variant={activeFast ? "secondary" : "primary"}
        disabled={loading}
        onClick={toggle}
        className="mt-4 w-full"
      >
        <Timer size={14} /> {loading ? "…" : activeFast ? "End fast" : "Start fasting"}
      </Button>
    </Card>
  );
}
