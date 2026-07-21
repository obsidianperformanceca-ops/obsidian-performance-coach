"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import type { MessageRow } from "@/lib/db/messages";

export function MessageThread({
  clientId,
  messages,
  currentRole,
}: {
  clientId: string;
  messages: MessageRow[];
  currentRole: "COACH" | "CLIENT";
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!body.trim()) return;
    setLoading(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, body }),
    });
    setBody("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && <p className="text-sm text-muted">No messages yet — say hello.</p>}
        {messages.map((m) => {
          const mine = m.sender_role === currentRole;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-sm rounded-2xl px-4 py-2 text-sm",
                  mine ? "bg-accent text-white" : "bg-surface-2 text-foreground"
                )}
              >
                <p>{m.body}</p>
                <p className={cn("mt-1 text-[10px]", mine ? "text-white/70" : "text-subtle")}>
                  {format(new Date(m.created_at), "MMM d, h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2 border-t border-border pt-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="min-h-10 flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button type="button" disabled={loading} onClick={handleSend}>
          Send
        </Button>
      </div>
    </div>
  );
}
