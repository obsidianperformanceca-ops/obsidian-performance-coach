import { requireClient } from "@/lib/auth/session";
import { getActiveTarget } from "@/lib/db/targets";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const LABELS: Record<string, string> = {
  FAT_LOSS: "Fat Loss",
  MUSCLE_GAIN: "Muscle Gain",
  RECOMP: "Recomp",
  MAINTENANCE: "Maintenance",
  PERFORMANCE: "Performance",
  GENERAL_HEALTH: "General Health",
  SEDENTARY: "Sedentary",
  LIGHTLY_ACTIVE: "Lightly Active",
  MODERATELY_ACTIVE: "Moderately Active",
  VERY_ACTIVE: "Very Active",
  EXTREMELY_ACTIVE: "Extremely Active",
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  GYM: "Gym",
  HOME: "Home",
  HYBRID: "Hybrid",
};

export default async function ClientProfilePage() {
  const { client } = await requireClient();
  const target = await getActiveTarget(client.id);

  return (
    <div>
      <PageHeader title="Your Profile" description="Managed by your coach — reach out via Messages to request changes." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Name" value={client.full_name} />
            <Field label="Age" value={client.age} />
            <Field label="Height" value={client.height_cm ? `${client.height_cm} cm` : null} />
            <Field label="Starting weight" value={client.starting_weight_kg ? `${client.starting_weight_kg} kg` : null} />
            <Field label="Current weight" value={client.current_weight_kg ? `${client.current_weight_kg} kg` : null} />
            <Field label="Goal weight" value={client.goal_weight_kg ? `${client.goal_weight_kg} kg` : null} />
            <Field label="Goal" value={client.goal ? LABELS[client.goal] : null} />
            <Field label="Activity level" value={client.activity_level ? LABELS[client.activity_level] : null} />
            <Field label="Experience" value={client.experience_level ? LABELS[client.experience_level] : null} />
            <Field label="Training location" value={client.training_location ? LABELS[client.training_location] : null} />
            <Field label="Occupation" value={client.occupation} />
            <Field label="Equipment" value={client.equipment_available} />
          </div>
          {client.injuries && (
            <div className="mt-4">
              <p className="text-xs text-subtle">Injuries</p>
              <p className="text-sm text-foreground">{client.injuries}</p>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Nutrition Targets</CardTitle></CardHeader>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Calories" value={target?.calories} />
              <Field label="Protein" value={target?.protein_g ? `${target.protein_g}g` : null} />
              <Field label="Carbs" value={target?.carbs_g ? `${target.carbs_g}g` : null} />
              <Field label="Fat" value={target?.fat_g ? `${target.fat_g}g` : null} />
              <Field label="Water goal" value={target?.water_ml ? `${target.water_ml}ml` : null} />
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lifestyle Goals</CardTitle></CardHeader>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Field label="Sleep" value={client.sleep_goal_hours ? `${client.sleep_goal_hours}h` : null} />
              <Field label="Steps" value={client.step_goal} />
              <Field label="Cardio" value={client.cardio_goal_min ? `${client.cardio_goal_min}m` : null} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-subtle">{label}</p>
      <p className="font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}
