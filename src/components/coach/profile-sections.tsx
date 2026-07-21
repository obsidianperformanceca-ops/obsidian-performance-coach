import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import type { ClientRow } from "@/lib/db/clients";
import type { TargetRow } from "@/lib/db/targets";
import type { DailyLogRow } from "@/lib/db/daily-logs";
import type { CoachNoteRow } from "@/lib/db/notes";
import type { MeasurementRow } from "@/lib/db/measurements";

const GOAL_OPTIONS = ["FAT_LOSS", "MUSCLE_GAIN", "RECOMP", "MAINTENANCE", "PERFORMANCE", "GENERAL_HEALTH"];
const ACTIVITY_OPTIONS = ["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE", "EXTREMELY_ACTIVE"];
const EXPERIENCE_OPTIONS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const LOCATION_OPTIONS = ["GYM", "HOME", "HYBRID"];
const STATUS_OPTIONS = ["ACTIVE", "PAUSED", "ARCHIVED"];

function label(v: string | null) {
  if (!v) return "—";
  return v
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function BasicInfoCard({
  client,
  action,
}: {
  client: ClientRow;
  action: (formData: FormData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <Badge tone={client.status === "ACTIVE" ? "success" : client.status === "PAUSED" ? "warning" : "neutral"}>
          {label(client.status)}
        </Badge>
      </CardHeader>
      <form action={action} className="grid grid-cols-2 gap-4">
        <LField label="Name"><Input name="fullName" defaultValue={client.full_name} /></LField>
        <LField label="Status">
          <Select name="status" defaultValue={client.status}>
            {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{label(o)}</option>)}
          </Select>
        </LField>
        <LField label="Age"><Input name="age" type="number" defaultValue={client.age ?? ""} /></LField>
        <LField label="Height (cm)"><Input name="heightCm" type="number" defaultValue={client.height_cm ?? ""} /></LField>
        <LField label="Current weight (kg)"><Input name="currentWeightKg" type="number" step="0.1" defaultValue={client.current_weight_kg ?? ""} /></LField>
        <LField label="Goal weight (kg)"><Input name="goalWeightKg" type="number" step="0.1" defaultValue={client.goal_weight_kg ?? ""} /></LField>
        <LField label="Goal">
          <Select name="goal" defaultValue={client.goal ?? ""}>
            <option value="">—</option>
            {GOAL_OPTIONS.map((o) => <option key={o} value={o}>{label(o)}</option>)}
          </Select>
        </LField>
        <LField label="Activity level">
          <Select name="activityLevel" defaultValue={client.activity_level ?? ""}>
            <option value="">—</option>
            {ACTIVITY_OPTIONS.map((o) => <option key={o} value={o}>{label(o)}</option>)}
          </Select>
        </LField>
        <LField label="Occupation"><Input name="occupation" defaultValue={client.occupation ?? ""} /></LField>
        <LField label="Experience level">
          <Select name="experienceLevel" defaultValue={client.experience_level ?? ""}>
            <option value="">—</option>
            {EXPERIENCE_OPTIONS.map((o) => <option key={o} value={o}>{label(o)}</option>)}
          </Select>
        </LField>
        <LField label="Training location">
          <Select name="trainingLocation" defaultValue={client.training_location ?? ""}>
            <option value="">—</option>
            {LOCATION_OPTIONS.map((o) => <option key={o} value={o}>{label(o)}</option>)}
          </Select>
        </LField>
        <LField label="Equipment available"><Input name="equipmentAvailable" defaultValue={client.equipment_available ?? ""} /></LField>
        <LField label="Injuries" full><Textarea name="injuries" defaultValue={client.injuries ?? ""} /></LField>
        <div className="col-span-2">
          <Button type="submit" size="sm" variant="secondary">Save changes</Button>
        </div>
      </form>
    </Card>
  );
}

export function TargetsCard({ target, action }: { target: TargetRow | null; action: (formData: FormData) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Nutrition Targets</CardTitle></CardHeader>
      <form action={action} className="grid grid-cols-2 gap-4">
        <LField label="Calories"><Input name="calories" type="number" defaultValue={target?.calories ?? ""} /></LField>
        <LField label="Protein (g)"><Input name="proteinG" type="number" defaultValue={target?.protein_g ?? ""} /></LField>
        <LField label="Carbs (g)"><Input name="carbsG" type="number" defaultValue={target?.carbs_g ?? ""} /></LField>
        <LField label="Fat (g)"><Input name="fatG" type="number" defaultValue={target?.fat_g ?? ""} /></LField>
        <LField label="Water goal (ml)" full><Input name="waterMl" type="number" defaultValue={target?.water_ml ?? ""} /></LField>
        <div className="col-span-2">
          <Button type="submit" size="sm" variant="secondary">Update targets</Button>
        </div>
      </form>
    </Card>
  );
}

export function LifestyleCard({ client, action }: { client: ClientRow; action: (formData: FormData) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Lifestyle Goals</CardTitle></CardHeader>
      <form action={action} className="grid grid-cols-3 gap-4">
        <LField label="Sleep goal (hrs)"><Input name="sleepGoalHours" type="number" step="0.5" defaultValue={client.sleep_goal_hours ?? ""} /></LField>
        <LField label="Step goal"><Input name="stepGoal" type="number" defaultValue={client.step_goal ?? ""} /></LField>
        <LField label="Cardio goal (min)"><Input name="cardioGoalMin" type="number" defaultValue={client.cardio_goal_min ?? ""} /></LField>
        <div className="col-span-3">
          <Button type="submit" size="sm" variant="secondary">Update lifestyle goals</Button>
        </div>
      </form>
    </Card>
  );
}

export function NotesCard({ notes, action }: { notes: CoachNoteRow[]; action: (formData: FormData) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coach Notes</CardTitle>
        <span className="text-xs text-subtle">Private — never visible to the client</span>
      </CardHeader>
      <form action={action} className="mb-4 flex gap-2">
        <Textarea name="body" placeholder="e.g. Lower calories next week." className="min-h-10 flex-1" />
        <Button type="submit" size="sm" variant="secondary">Add</Button>
      </form>
      <div className="space-y-3">
        {notes.length === 0 && <p className="text-sm text-muted">No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="rounded-lg bg-surface-2 p-3">
            <p className="text-sm text-foreground">{n.body}</p>
            <p className="mt-1 text-xs text-subtle">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function MeasurementsCard({
  measurements,
  action,
}: {
  measurements: MeasurementRow[];
  action: (formData: FormData) => void;
}) {
  const latest = measurements[0];
  return (
    <Card>
      <CardHeader><CardTitle>Measurements</CardTitle></CardHeader>
      <form action={action} className="mb-4 grid grid-cols-5 gap-2">
        <Input name="waistCm" type="number" step="0.1" placeholder="Waist" />
        <Input name="chestCm" type="number" step="0.1" placeholder="Chest" />
        <Input name="hipsCm" type="number" step="0.1" placeholder="Hips" />
        <Input name="armCm" type="number" step="0.1" placeholder="Arm" />
        <Input name="thighCm" type="number" step="0.1" placeholder="Thigh" />
        <div className="col-span-5">
          <Button type="submit" size="sm" variant="secondary">Log measurement</Button>
        </div>
      </form>
      {latest ? (
        <div className="grid grid-cols-5 gap-2 text-center text-sm">
          <MStat label="Waist" v={latest.waist_cm} />
          <MStat label="Chest" v={latest.chest_cm} />
          <MStat label="Hips" v={latest.hips_cm} />
          <MStat label="Arm" v={latest.arm_cm} />
          <MStat label="Thigh" v={latest.thigh_cm} />
        </div>
      ) : (
        <p className="text-sm text-muted">No measurements logged yet.</p>
      )}
    </Card>
  );
}

function MStat({ label, v }: { label: string; v: number | null }) {
  return (
    <div className="rounded-lg bg-surface-2 py-2">
      <p className="text-xs text-subtle">{label}</p>
      <p className="font-medium text-foreground">{v != null ? `${v}cm` : "—"}</p>
    </div>
  );
}

export function RecentCheckIns({ clientId, logs }: { clientId: string; logs: DailyLogRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Check-ins</CardTitle>
      </CardHeader>
      {logs.length === 0 ? (
        <p className="text-sm text-muted">No check-ins yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Link
              key={log.id}
              href={`/coach/clients/${clientId}/logs/${log.id}`}
              className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-2"
            >
              <span className="text-sm text-foreground">{format(new Date(log.log_date), "EEE, MMM d")}</span>
              <div className="flex items-center gap-2">
                {log.morning_weight_kg && <span className="text-xs text-subtle">{log.morning_weight_kg}kg</span>}
                <StatusBadge status={log.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED" ? "success" : status === "REVIEWED" ? "accent" : status === "SUBMITTED" ? "warning" : "neutral";
  return <Badge tone={tone as "success" | "accent" | "warning" | "neutral"}>{label(status)}</Badge>;
}

function LField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
