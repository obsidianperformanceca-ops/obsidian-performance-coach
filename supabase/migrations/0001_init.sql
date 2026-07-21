-- =============================================================================
-- Obsidian Performance Coach — Initial Schema
-- Mirrors prisma/schema.prisma. Written by hand because migration binaries
-- can't be fetched in this build sandbox; matches the Prisma model exactly so
-- `prisma db pull`/`prisma migrate resolve --applied` will stay in sync once
-- you run this against a real Supabase project with full internet access.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

create type role as enum ('COACH', 'CLIENT');
create type client_status as enum ('ACTIVE', 'PAUSED', 'ARCHIVED');
create type goal as enum ('FAT_LOSS', 'MUSCLE_GAIN', 'RECOMP', 'MAINTENANCE', 'PERFORMANCE', 'GENERAL_HEALTH');
create type activity_level as enum ('SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE');
create type experience_level as enum ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
create type training_location as enum ('GYM', 'HOME', 'HYBRID');
create type day_status as enum ('PENDING', 'SUBMITTED', 'REVIEWED', 'APPROVED');
create type meal_type as enum ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DRINK');
create type message_sender_role as enum ('COACH', 'CLIENT');
create type notification_type as enum ('MISSED_CHECKIN', 'MISSED_WORKOUT', 'WEEKLY_CHECKIN_DUE', 'COACH_FEEDBACK', 'COACH_MESSAGE', 'DAY_APPROVED');
create type invite_status as enum ('PENDING', 'COMPLETED', 'EXPIRED');

-- ---------------------------------------------------------------------------
-- USERS  (mirrors auth.users; id === auth.uid())
-- ---------------------------------------------------------------------------

create table users (
  id          uuid primary key,
  email       text not null unique,
  full_name   text,
  role        role not null default 'CLIENT',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CLIENTS
-- ---------------------------------------------------------------------------

create table clients (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid unique references users(id) on delete cascade,
  coach_id              uuid not null references users(id) on delete cascade,
  status                client_status not null default 'ACTIVE',

  full_name             text not null,
  age                   int,
  height_cm             double precision,
  starting_weight_kg    double precision,
  current_weight_kg     double precision,
  goal_weight_kg        double precision,
  goal                  goal,
  activity_level        activity_level,
  occupation            text,
  injuries              text,
  experience_level      experience_level,
  equipment_available   text,
  training_location     training_location,

  sleep_goal_hours      double precision,
  step_goal             int,
  cardio_goal_min       int,

  invite_token          text unique,
  invite_status         invite_status not null default 'PENDING',
  invite_expires_at     timestamptz,
  onboarded_at          timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_clients_coach_id on clients(coach_id);
create index idx_clients_status on clients(status);

-- ---------------------------------------------------------------------------
-- ONBOARDING RESPONSES
-- ---------------------------------------------------------------------------

create table onboarding_responses (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null unique references clients(id) on delete cascade,

  days_per_week          int,
  workout_duration_min   int,
  gym_or_home            training_location,
  experience             experience_level,
  injuries               text,

  typical_eating_habits  text,
  foods_enjoyed          text,
  allergies              text,
  meals_per_day          int,
  alcohol                text,

  job                    text,
  daily_steps            int,
  sleep_hours            double precision,
  motivation             text,

  submitted_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TARGETS
-- ---------------------------------------------------------------------------

create table targets (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,

  calories        int,
  protein_g       int,
  carbs_g         int,
  fat_g           int,
  water_ml        int,

  is_active       boolean not null default true,
  effective_from  timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index idx_targets_client_active on targets(client_id, is_active);

-- ---------------------------------------------------------------------------
-- DAILY LOGS + MEALS
-- ---------------------------------------------------------------------------

create table daily_logs (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references clients(id) on delete cascade,

  log_date           date not null,

  morning_weight_kg  double precision,
  water_ml           int,
  workout_completed  boolean,
  workout_name       text,
  steps              int,
  sleep_hours        double precision,
  energy_level       int check (energy_level between 1 and 10),
  hunger_level       int check (hunger_level between 1 and 10),
  digestion          text,
  client_notes       text,

  status             day_status not null default 'PENDING',

  est_calories       int,
  est_protein_g      int,
  est_carbs_g        int,
  est_fat_g          int,
  coach_feedback     text,
  reviewed_at        timestamptz,
  approved_at        timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (client_id, log_date)
);

create index idx_daily_logs_client_date on daily_logs(client_id, log_date);

create table meals (
  id            uuid primary key default gen_random_uuid(),
  daily_log_id  uuid not null references daily_logs(id) on delete cascade,

  type          meal_type not null,
  description   text not null,

  est_calories  int,
  est_protein_g int,
  est_carbs_g   int,
  est_fat_g     int,

  created_at    timestamptz not null default now()
);

create index idx_meals_daily_log on meals(daily_log_id);

-- ---------------------------------------------------------------------------
-- WORKOUT PROGRAMS
-- ---------------------------------------------------------------------------

create table workout_programs (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,

  name        text not null,
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_workout_programs_client_active on workout_programs(client_id, is_active);

create table workout_days (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references workout_programs(id) on delete cascade,

  name        text not null,
  day_order   int not null default 0
);

create index idx_workout_days_program on workout_days(program_id);

create table exercises (
  id               uuid primary key default gen_random_uuid(),
  workout_day_id   uuid not null references workout_days(id) on delete cascade,

  name             text not null,
  sets             int not null,
  reps             text not null,
  rpe              double precision,
  notes            text,
  exercise_order   int not null default 0
);

create index idx_exercises_workout_day on exercises(workout_day_id);

create table workout_sessions (
  id               uuid primary key default gen_random_uuid(),
  workout_day_id   uuid not null references workout_days(id) on delete cascade,
  client_id        uuid not null references clients(id) on delete cascade,

  completed_at     timestamptz,
  scheduled_for    timestamptz not null default now(),
  notes            text,

  created_at       timestamptz not null default now()
);

create index idx_workout_sessions_client on workout_sessions(client_id);
create index idx_workout_sessions_day on workout_sessions(workout_day_id);

create table exercise_set_logs (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references workout_sessions(id) on delete cascade,
  exercise_id     uuid not null references exercises(id) on delete cascade,

  set_number      int not null,
  weight_kg       double precision,
  reps_completed  int,
  rpe             double precision,
  is_pr           boolean not null default false,

  created_at      timestamptz not null default now()
);

create index idx_set_logs_session on exercise_set_logs(session_id);
create index idx_set_logs_exercise on exercise_set_logs(exercise_id);

-- ---------------------------------------------------------------------------
-- PROGRESS
-- ---------------------------------------------------------------------------

create table weights (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,

  weight_kg    double precision not null,
  recorded_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index idx_weights_client_recorded on weights(client_id, recorded_at);

create table measurements (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,

  waist_cm     double precision,
  chest_cm     double precision,
  hips_cm      double precision,
  arm_cm       double precision,
  thigh_cm     double precision,

  recorded_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index idx_measurements_client_recorded on measurements(client_id, recorded_at);

create table progress_photos (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,

  storage_path  text not null,
  angle         text,
  taken_at      timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index idx_photos_client_taken on progress_photos(client_id, taken_at);

-- ---------------------------------------------------------------------------
-- COACH NOTES (private)
-- ---------------------------------------------------------------------------

create table coach_notes (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  author_id   uuid not null references users(id) on delete cascade,

  body        text not null,
  created_at  timestamptz not null default now()
);

create index idx_coach_notes_client on coach_notes(client_id);

-- ---------------------------------------------------------------------------
-- MESSAGING
-- ---------------------------------------------------------------------------

create table messages (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  sender_id    uuid not null references users(id) on delete cascade,
  sender_role  message_sender_role not null,

  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_messages_client_created on messages(client_id, created_at);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  client_id   uuid references clients(id) on delete cascade,

  type        notification_type not null,
  title       text not null,
  body        text,
  read_at     timestamptz,

  created_at  timestamptz not null default now()
);

create index idx_notifications_user_read on notifications(user_id, read_at);

-- ---------------------------------------------------------------------------
-- updated_at TRIGGERS
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at before update on users for each row execute function set_updated_at();
create trigger trg_clients_updated_at before update on clients for each row execute function set_updated_at();
create trigger trg_daily_logs_updated_at before update on daily_logs for each row execute function set_updated_at();
create trigger trg_workout_programs_updated_at before update on workout_programs for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- AUTO-CREATE public.users ROW WHEN A SUPABASE AUTH USER SIGNS UP
-- Role defaults to CLIENT; the coach's own account should be promoted to
-- COACH manually once (see README "Making yourself the coach").
-- ---------------------------------------------------------------------------

create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::role, 'CLIENT')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
