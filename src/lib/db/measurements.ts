import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MeasurementRow = Database["public"]["Tables"]["measurements"]["Row"];

export async function getMeasurementsForClient(clientId: string): Promise<MeasurementRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("measurements")
    .select("*")
    .eq("client_id", clientId)
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addMeasurement(
  clientId: string,
  values: { waistCm?: number; chestCm?: number; hipsCm?: number; armCm?: number; thighCm?: number }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("measurements").insert({
    client_id: clientId,
    waist_cm: values.waistCm,
    chest_cm: values.chestCm,
    hips_cm: values.hipsCm,
    arm_cm: values.armCm,
    thigh_cm: values.thighCm,
  });
  if (error) throw error;
}
