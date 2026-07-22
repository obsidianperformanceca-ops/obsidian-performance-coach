-- "Quick add" meal templates — lets a client save a meal they eat
-- regularly (e.g. their daily protein shake) once, then log it again with
-- a single tap instead of re-typing/re-estimating it every time.
create table saved_meals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  description text not null,
  serving_size text,
  est_calories integer,
  est_protein_g integer,
  est_carbs_g integer,
  est_fat_g integer,
  created_at timestamptz not null default now()
);

create index saved_meals_client_id_idx on saved_meals(client_id);

alter table saved_meals enable row level security;

-- Same ownership model as weights/measurements: the client manages their
-- own saved meals, and their coach can see them too (useful context when
-- reviewing a day's food log).
create policy saved_meals_select on saved_meals for select
  using (owns_client(client_id));
create policy saved_meals_insert on saved_meals for insert
  with check (owns_client(client_id));
create policy saved_meals_delete on saved_meals for delete
  using (owns_client(client_id));
