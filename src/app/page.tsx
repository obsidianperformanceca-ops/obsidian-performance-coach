import Link from "next/link";
import { Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeadForm } from "@/components/marketing/lead-form";

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com"; // [confirm contact email]

/**
 * Public marketing homepage — no auth required. Linked from Google
 * Business profile and Instagram bio. The actual coaching app lives at
 * /coach/* and /client/* (see src/middleware.ts for the public/protected
 * route split).
 */
export default async function HomePage() {
  const user = await getCurrentUser();
  const dashboardHref = user ? (user.role === "COACH" ? "/coach/dashboard" : "/client/dashboard") : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav dashboardHref={dashboardHref} />

      <main className="flex-1">
        <Hero />
        <Services />
        <HowItWorks />
        <About />
        <Consultation />
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteNav({ dashboardHref }: { dashboardHref: string | null }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Obsidian Performance Coach
          </span>
        </div>

        {dashboardHref ? (
          <Link href={dashboardHref}>
            <Button size="sm">Go to Dashboard</Button>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground">
              Client Login
            </Link>
            <Link href="/login">
              <Button size="sm" variant="outline">
                Coach Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center sm:pt-28">
      <Badge tone="accent">Personal Training + Naturopathic Nutrition</Badge>
      <h1 className="text-gradient mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Nutrition is 90% of your results. We built the coaching to match.
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
        Obsidian Performance Coach pairs daily tracking, automatic calorie and macro adjustment
        based on your real progress, and regular human check-ins — not just a workout plan.
      </p>
      <div className="mt-8 flex justify-center">
        <a href="#consultation">
          <Button size="lg">Book a Consultation</Button>
        </a>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section className="border-t border-border bg-surface/40 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Services</h2>
          <p className="mt-2 text-muted">Start with a consultation, then ongoing coaching built around you.</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            title="Initial Health & Performance Consultation"
            price={
              <div>
                <span className="text-2xl font-semibold text-foreground">$250–$350</span>
                <span className="ml-1 text-sm text-muted">one-time · [confirm final pricing]</span>
              </div>
            }
            description="A full intake covering your health history, goals, training, and nutrition — conducted by our naturopathic doctor."
            features={[
              "Full intake: health history, goals, training & nutrition",
              "Conducted by our naturopathic doctor",
              "Personalized starting plan",
            ]}
            footnote="May be eligible for reimbursement under naturopath coverage on your insurance plan — confirm eligibility and coverage with your provider."
          />

          <ServiceCard
            title="Ongoing Coaching"
            price={
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-2xl font-semibold text-accent">
                    $79–$129<span className="text-sm font-normal text-muted">/mo</span>
                  </span>
                  <span className="text-sm text-subtle line-through">$150–$200/mo</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone="accent">Founding Member Rate</Badge>
                  <span className="text-xs text-subtle">
                    regular rate once established · [confirm final pricing]
                  </span>
                </div>
              </div>
            }
            description="Monthly coaching subscription — limited-time rate for early clients."
            features={[
              "Daily check-in tracking (weight, meals, steps, sleep, and more)",
              "Automatic calorie & macro adjustment based on your real progress",
              "Weekly/biweekly personal follow-ups",
              "Direct messaging with your coach",
            ]}
          />

          <ServiceCard
            title="Naturopathic Follow-Up"
            price={
              <div>
                <span className="text-2xl font-semibold text-foreground">$80–$150</span>
                <span className="ml-1 text-sm text-muted">per session · [confirm final pricing]</span>
                <div className="mt-2">
                  <Badge tone="neutral">Optional add-on</Badge>
                </div>
              </div>
            }
            description="Periodic follow-ups with our naturopathic doctor, every 4–6 weeks."
            features={[
              "Progress review with our naturopathic doctor",
              "Every 4–6 weeks",
              "Adjust supplementation & naturopathic care as you progress",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  title,
  price,
  description,
  features,
  footnote,
}: {
  title: string;
  price: React.ReactNode;
  description: string;
  features: string[];
  footnote?: string;
}) {
  return (
    <Card className="flex flex-col p-6">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <div className="mt-3">{price}</div>
      <p className="mt-3 text-sm text-muted">{description}</p>
      <ul className="mt-5 space-y-2 text-sm text-foreground">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-accent" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {footnote && <p className="mt-5 text-xs text-subtle">{footnote}</p>}
    </Card>
  );
}

const STEPS = [
  {
    title: "Book your consultation",
    body: "A full intake with our naturopathic doctor to understand your health history, goals, and current nutrition and training.",
  },
  {
    title: "Get your personalized plan and app access",
    body: "We build your starting targets and set you up with your private client dashboard.",
  },
  {
    title: "Daily tracking + auto-adjusting targets",
    body: "Log as you go. Your calorie and macro targets adjust automatically based on real progress, with regular human check-ins along the way.",
  },
];

function HowItWorks() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">How it works</h2>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent">
                {i + 1}
              </div>
              <h3 className="mt-4 font-medium text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="border-t border-border bg-surface/40 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Meet your coaches</h2>
          <p className="mt-2 text-muted">A two-person practice — training and naturopathic nutrition, together.</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <BioCard
            name="[YOUR NAME]"
            role="Personal Trainer & Coach"
            bio="[YOUR BIO HERE — background, certifications, coaching philosophy.]"
          />
          <BioCard
            name="[SISTER'S NAME], ND"
            role="Naturopathic Doctor"
            bio="[YOUR SISTER'S BIO HERE — education, licensure, areas of focus.]"
          />
        </div>
      </div>
    </section>
  );
}

function BioCard({ name, role, bio }: { name: string; role: string; bio: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-xs text-subtle">
          Photo
        </div>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-sm text-muted">{role}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">{bio}</p>
    </Card>
  );
}

function Consultation() {
  return (
    <section id="consultation" className="px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Book a Consultation</h2>
          <p className="mt-2 text-muted">
            Tell us a bit about your goals and we&apos;ll follow up to schedule your initial consultation.
          </p>
        </div>
        <div className="mt-8">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-10 text-sm text-subtle">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Obsidian Performance Coach. All rights reserved.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>{CONTACT_EMAIL}</span>
          <span>[PHONE NUMBER]</span>
          <span>[CITY, REGION]</span>
        </div>
      </div>
    </footer>
  );
}
