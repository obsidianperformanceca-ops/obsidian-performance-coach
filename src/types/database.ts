// Hand-authored to mirror supabase/migrations/0001_init.sql + 0002_rls.sql.
// Once the project is live, regenerate the source of truth with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// and re-apply the JSDoc comments below if you want to keep them.

export type Role = "COACH" | "CLIENT";
export type ClientStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export type Goal =
  | "FAT_LOSS"
  | "MUSCLE_GAIN"
  | "RECOMP"
  | "MAINTENANCE"
  | "PERFORMANCE"
  | "GENERAL_HEALTH";
export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "VERY_ACTIVE"
  | "EXTREMELY_ACTIVE";
export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type TrainingLocation = "GYM" | "HOME" | "HYBRID";
export type DayStatus = "PENDING" | "SUBMITTED" | "REVIEWED" | "APPROVED";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "DRINK";
export type MessageSenderRole = "COACH" | "CLIENT";
export type NotificationType =
  | "MISSED_CHECKIN"
  | "MISSED_WORKOUT"
  | "WEEKLY_CHECKIN_DUE"
  | "COACH_FEEDBACK"
  | "COACH_MESSAGE"
  | "DAY_APPROVED"
  | "TARGET_AUTO_ADJUSTED"
  | "PROGRESS_PHOTO_DUE";
export type InviteStatus = "PENDING" | "COMPLETED" | "EXPIRED";
export type UnitPreference = "METRIC" | "IMPERIAL";

type Timestamp = string;

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: Role;
          avatar_url: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          coach_id: string;
          status: ClientStatus;
          full_name: string;
          age: number | null;
          height_cm: number | null;
          starting_weight_kg: number | null;
          current_weight_kg: number | null;
          goal_weight_kg: number | null;
          goal: Goal | null;
          activity_level: ActivityLevel | null;
          occupation: string | null;
          injuries: string | null;
          experience_level: ExperienceLevel | null;
          equipment_available: string | null;
          training_location: TrainingLocation | null;
          sleep_goal_hours: number | null;
          step_goal: number | null;
          cardio_goal_min: number | null;
          invite_token: string | null;
          invite_status: InviteStatus;
          invite_expires_at: Timestamp | null;
          onboarded_at: Timestamp | null;
          unit_preference: UnitPreference;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          coach_id: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      onboarding_responses: {
        Row: {
          id: string;
          client_id: string;
          days_per_week: number | null;
          workout_duration_min: number | null;
          gym_or_home: TrainingLocation | null;
          experience: ExperienceLevel | null;
          injuries: string | null;
          typical_eating_habits: string | null;
          foods_enjoyed: string | null;
          allergies: string | null;
          meals_per_day: number | null;
          alcohol: string | null;
          job: string | null;
          daily_steps: number | null;
          sleep_hours: number | null;
          motivation: string | null;
          submitted_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["onboarding_responses"]["Row"]> & { client_id: string };
        Update: Partial<Database["public"]["Tables"]["onboarding_responses"]["Row"]>;
        Relationships: [];
      };
      targets: {
        Row: {
          id: string;
          client_id: string;
          calories: number | null;
          protein_g: number | null;
          carbs_g: number | null;
          fat_g: number | null;
          water_ml: number | null;
          is_active: boolean;
          effective_from: Timestamp;
          is_auto_generated: boolean;
          adjustment_reason: string | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["targets"]["Row"]> & { client_id: string };
        Update: Partial<Database["public"]["Tables"]["targets"]["Row"]>;
        Relationships: [];
      };
      daily_logs: {
        Row: {
          id: string;
          client_id: string;
          log_date: string;
          morning_weight_kg: number | null;
          water_ml: number | null;
          workout_completed: boolean | null;
          workout_name: string | null;
          steps: number | null;
          sleep_hours: number | null;
          energy_level: number | null;
          hunger_level: number | null;
          digestion: string | null;
          client_notes: string | null;
          status: DayStatus;
          est_calories: number | null;
          est_protein_g: number | null;
          est_carbs_g: number | null;
          est_fat_g: number | null;
          coach_feedback: string | null;
          reviewed_at: Timestamp | null;
          approved_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["daily_logs"]["Row"]> & {
          client_id: string;
          log_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_logs"]["Row"]>;
        Relationships: [];
      };
      meals: {
        Row: {
          id: string;
          daily_log_id: string;
          type: MealType;
          description: string;
          serving_size: string | null;
          est_calories: number | null;
          est_protein_g: number | null;
          est_carbs_g: number | null;
          est_fat_g: number | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["meals"]["Row"]> & {
          daily_log_id: string;
          type: MealType;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["meals"]["Row"]>;
        Relationships: [];
      };
      workout_programs: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          notes: string | null;
          is_active: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_programs"]["Row"]> & {
          client_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_programs"]["Row"]>;
        Relationships: [];
      };
      workout_days: {
        Row: { id: string; program_id: string; name: string; day_order: number };
        Insert: Partial<Database["public"]["Tables"]["workout_days"]["Row"]> & {
          program_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_days"]["Row"]>;
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          workout_day_id: string;
          name: string;
          sets: number;
          reps: string;
          rpe: number | null;
          notes: string | null;
          exercise_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["exercises"]["Row"]> & {
          workout_day_id: string;
          name: string;
          sets: number;
          reps: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Row"]>;
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          id: string;
          workout_day_id: string;
          client_id: string;
          completed_at: Timestamp | null;
          scheduled_for: Timestamp;
          notes: string | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_sessions"]["Row"]> & {
          workout_day_id: string;
          client_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_sessions"]["Row"]>;
        Relationships: [];
      };
      exercise_set_logs: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          weight_kg: number | null;
          reps_completed: number | null;
          rpe: number | null;
          is_pr: boolean;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["exercise_set_logs"]["Row"]> & {
          session_id: string;
          exercise_id: string;
          set_number: number;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_set_logs"]["Row"]>;
        Relationships: [];
      };
      weights: {
        Row: {
          id: string;
          client_id: string;
          weight_kg: number;
          recorded_at: Timestamp;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["weights"]["Row"]> & {
          client_id: string;
          weight_kg: number;
        };
        Update: Partial<Database["public"]["Tables"]["weights"]["Row"]>;
        Relationships: [];
      };
      measurements: {
        Row: {
          id: string;
          client_id: string;
          waist_cm: number | null;
          chest_cm: number | null;
          hips_cm: number | null;
          arm_cm: number | null;
          thigh_cm: number | null;
          recorded_at: Timestamp;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["measurements"]["Row"]> & { client_id: string };
        Update: Partial<Database["public"]["Tables"]["measurements"]["Row"]>;
        Relationships: [];
      };
      progress_photos: {
        Row: {
          id: string;
          client_id: string;
          storage_path: string;
          angle: string | null;
          taken_at: Timestamp;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["progress_photos"]["Row"]> & {
          client_id: string;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["progress_photos"]["Row"]>;
        Relationships: [];
      };
      coach_notes: {
        Row: {
          id: string;
          client_id: string;
          author_id: string;
          body: string;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["coach_notes"]["Row"]> & {
          client_id: string;
          author_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["coach_notes"]["Row"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          client_id: string;
          sender_id: string;
          sender_role: MessageSenderRole;
          body: string;
          read_at: Timestamp | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          client_id: string;
          sender_id: string;
          sender_role: MessageSenderRole;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          type: NotificationType;
          title: string;
          body: string | null;
          read_at: Timestamp | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: NotificationType;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
