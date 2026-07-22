"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pill } from "lucide-react";
import type { SupplementProtocolRow } from "@/lib/db/supplements";

export function SupplementsCard({
  supplements,
  addAction,
  deleteAction,
}: {
  supplements: SupplementProtocolRow[];
  addAction: (formData: FormData) => void;
  deleteAction: (supplementId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplement Protocol</CardTitle>
        <span className="text-xs text-subtle">Naturopathic — visible to the client</span>
      </CardHeader>

      <form action={addAction} className="mb-4 space-y-2">
        <Input name="supplement" placeholder="Supplement (e.g. Magnesium glycinate)" required />
        <div className="grid grid-cols-2 gap-2">
          <Input name="dose" placeholder="Dose (e.g. 400mg)" />
          <Input name="timing" placeholder="Timing (e.g. before bed)" />
        </div>
        <Input name="notes" placeholder="Notes (optional)" />
        <Button type="submit" size="sm" variant="secondary">
          <Pill size={14} /> Add supplement
        </Button>
      </form>

      <div className="space-y-2">
        {supplements.length === 0 && <p className="text-sm text-muted">No supplements added yet.</p>}
        {supplements.map((s) => (
          <div key={s.id} className="flex items-start justify-between rounded-lg bg-surface-2 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {s.supplement}
                {s.dose && <span className="font-normal text-muted"> · {s.dose}</span>}
              </p>
              {s.timing && <p className="text-xs text-subtle">{s.timing}</p>}
              {s.notes && <p className="mt-1 text-xs text-muted">{s.notes}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2 pl-2">
              {!s.is_active && <Badge tone="neutral">Inactive</Badge>}
              <button
                type="button"
                onClick={() => deleteAction(s.id)}
                className="text-subtle hover:text-danger"
                aria-label="Remove supplement"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
