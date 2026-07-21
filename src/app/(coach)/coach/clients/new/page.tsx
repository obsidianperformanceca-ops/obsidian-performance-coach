"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function NewClientPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error?.formErrors?.[0] ?? data.error ?? "Something went wrong");
      return;
    }

    setInviteUrl(`${window.location.origin}${data.inviteUrl}`);
  }

  return (
    <div>
      <PageHeader title="Add client" description="Send them a link to complete their onboarding questionnaire." />

      <Card className="max-w-lg">
        {inviteUrl ? (
          <div>
            <p className="text-sm text-foreground">
              Client created. Share this onboarding link with <strong>{fullName}</strong>:
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Input readOnly value={inviteUrl} onFocus={(e) => e.currentTarget.select()} />
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
              >
                Copy
              </Button>
            </div>
            <Button className="mt-6" onClick={() => router.push("/coach/clients")}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="mt-1 text-xs text-subtle">
                Used for reference only — the client sets their own login during onboarding.
              </p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create invite link"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
