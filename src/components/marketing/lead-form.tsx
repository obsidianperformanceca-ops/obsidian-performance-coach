"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Public lead-capture form for prospective clients requesting a
// consultation. This is NOT an account signup — there is no public
// self-serve registration in this app. Real client accounts are created
// manually via invite links from the coach dashboard, after an initial
// conversation with a lead captured here. See src/app/api/leads/route.ts.

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com"; // [confirm contact email]

type Status = "idle" | "loading" | "success" | "error" | "not_configured";

export function LeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [goals, setGoals] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, goals }),
      });

      if (res.status === 501) {
        setStatus("not_configured");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong — please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("Something went wrong — please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card className="p-6 text-center">
        <p className="font-medium text-foreground">Thanks{name ? `, ${name}` : ""} — we&apos;ve got your message.</p>
        <p className="mt-1 text-sm text-muted">We&apos;ll follow up by email to schedule your consultation.</p>
      </Card>
    );
  }

  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Consultation request"
  )}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nGoals: ${goals}`)}`;

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="lead-name">Name</Label>
          <Input
            id="lead-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <Label htmlFor="lead-email">Email</Label>
          <Input
            id="lead-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="lead-phone">Phone (optional)</Label>
          <Input
            id="lead-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-5555"
          />
        </div>
        <div>
          <Label htmlFor="lead-goals">What are your goals?</Label>
          <Textarea
            id="lead-goals"
            required
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Tell us a bit about what you're looking to achieve..."
          />
        </div>

        {status === "not_configured" && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            Online submission isn&apos;t set up yet.{" "}
            <a href={mailtoHref} className="underline">
              Email us directly
            </a>{" "}
            instead and we&apos;ll get back to you.
          </div>
        )}
        {status === "error" && error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Request Consultation"}
        </Button>
      </form>
    </Card>
  );
}
