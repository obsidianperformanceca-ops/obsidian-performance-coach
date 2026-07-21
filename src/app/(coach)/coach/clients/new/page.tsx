"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Mail, MessageSquareText, Check } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "unavailable" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

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

    setClientId(data.client.id);
    setInviteUrl(`${window.location.origin}${data.inviteUrl}`);
  }

  function copyLink() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function copySms() {
    if (!inviteUrl) return;
    const message = `Hi ${fullName.split(" ")[0]}, here's your link to set up your Obsidian Performance Coach account: ${inviteUrl}`;
    navigator.clipboard.writeText(message);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2000);
  }

  async function sendEmail() {
    if (!clientId) return;
    setEmailState("sending");
    setEmailError(null);

    const res = await fetch("/api/clients/send-invite-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, email }),
    });
    const data = await res.json();

    if (res.status === 501) {
      setEmailState("unavailable");
      return;
    }
    if (!res.ok) {
      setEmailState("error");
      setEmailError(data.error ?? "Could not send email");
      return;
    }
    setEmailState("sent");
  }

  return (
    <div>
      <PageHeader title="Add client" description="Send them a link to complete their onboarding questionnaire." />

      <Card className="max-w-lg">
        {inviteUrl ? (
          <div>
            <p className="text-sm text-foreground">
              Client created. Send <strong>{fullName}</strong> their onboarding link:
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Input readOnly value={inviteUrl} onFocus={(e) => e.currentTarget.select()} />
                <Button type="button" variant="secondary" onClick={copyLink}>
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? "Copied" : "Copy"}
                </Button>
              </div>

              <Button type="button" variant="secondary" className="w-full" onClick={copySms}>
                {copiedSms ? <Check size={14} /> : <MessageSquareText size={14} />}
                {copiedSms ? "Copied SMS message" : "Copy SMS message"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={emailState === "sending" || emailState === "sent"}
                onClick={sendEmail}
              >
                <Mail size={14} />
                {emailState === "sending"
                  ? "Sending…"
                  : emailState === "sent"
                    ? "Email sent"
                    : `Email it to ${email}`}
              </Button>
              {emailState === "unavailable" && (
                <p className="text-xs text-subtle">
                  Email sending isn&apos;t set up yet — use copy link or copy SMS message for now.
                </p>
              )}
              {emailState === "error" && <p className="text-xs text-danger">{emailError}</p>}
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
