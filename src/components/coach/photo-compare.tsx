"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

type Photo = { id: string; taken_at: string };

/**
 * Side-by-side "first vs. selected" progress-photo comparison. Defaults to
 * earliest vs. latest; the coach can change the right-hand photo to any
 * later one via the date picker.
 */
export function PhotoCompare({ photos, urls }: { photos: Photo[]; urls: Record<string, string> }) {
  // Photos arrive newest-first from the DB; oldest is the baseline.
  const chrono = [...photos].sort((a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime());
  const baseline = chrono[0];
  const [rightId, setRightId] = useState(chrono[chrono.length - 1]?.id ?? "");

  if (photos.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Progress Photos</CardTitle></CardHeader>
        <p className="text-sm text-muted">No photos uploaded by this client yet.</p>
      </Card>
    );
  }

  const right = chrono.find((p) => p.id === rightId) ?? baseline;
  const laterOptions = chrono.filter((p) => new Date(p.taken_at) >= new Date(baseline.taken_at));

  return (
    <Card>
      <CardHeader><CardTitle>Progress Photos</CardTitle></CardHeader>

      {photos.length > 1 ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Figure label="Baseline" photo={baseline} url={urls[baseline.id]} />
            <div>
              <div className="overflow-hidden rounded-lg bg-surface-2">
                {urls[right.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[right.id]} alt="Progress" className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <div className="aspect-[3/4]" />
                )}
              </div>
              <select
                value={rightId}
                onChange={(e) => setRightId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface-2 px-2 py-1 text-center text-[11px] text-subtle"
              >
                {laterOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {format(new Date(p.taken_at), "MMM d, yyyy")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs text-subtle">
            {daysBetween(baseline.taken_at, right.taken_at)} days between these photos.
          </p>
        </>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Figure label={format(new Date(baseline.taken_at), "MMM d")} photo={baseline} url={urls[baseline.id]} />
        </div>
      )}
    </Card>
  );
}

function Figure({ label, photo, url }: { label: string; photo: Photo; url?: string }) {
  return (
    <div>
      <div className="overflow-hidden rounded-lg bg-surface-2">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Progress" className="aspect-[3/4] w-full object-cover" />
        ) : (
          <div className="aspect-[3/4]" />
        )}
      </div>
      <p className="mt-1 text-center text-[11px] text-subtle">
        {label} · {format(new Date(photo.taken_at), "MMM d, yyyy")}
      </p>
    </div>
  );
}

function daysBetween(a: string, b: string): number {
  return Math.abs(Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}
