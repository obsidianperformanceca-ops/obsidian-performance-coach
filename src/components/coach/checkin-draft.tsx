"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check } from "lucide-react";

/**
 * Generates a weekly check-in draft from the client's recent data, then
 * lets the coach edit it and copy it into the message thread. Never sends
 * on its own — the coach stays in control of what actually goes out.
 */
export function CheckinDraft({ clientId }: { clientId: string }) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/checkin-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Couldn't generate a draft.");
      } else {
        setDraft(data.draft);
      }
    } catch {
      setError("Couldn't generate a draft.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Check-in Draft</CardTitle>
        <span className="text-xs text-subtle">Reads the last 14 days · edit before sending</span>
      </CardHeader>

      <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={generate}>
        <Sparkles size={14} /> {loading ? "Writing…" : draft ? "Regenerate" : "Draft check-in"}
      </Button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {draft && (
        <div className="mt-3">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-40" />
          <div className="mt-2 flex items-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
            </Button>
            <Link href={`/coach/messages/${clientId}`}>
              <Button type="button" size="sm" variant="ghost">Open messages</Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
