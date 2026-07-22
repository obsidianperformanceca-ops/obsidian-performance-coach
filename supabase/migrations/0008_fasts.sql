-- Intermittent fasting tracking — a fast is just a started_at/ended_at
-- window. ended_at null = fast currently in progress. Kept deliberately
-- simple: one active fast per client at a time, enforced in the API
-- rather than with a constraint so historical data stays flexible.
create table fasts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index fasts_client_id_idx on fasts(client_id);

alter table fasts enable row level security;

create policy fasts_select on fasts for select
  using (owns_client(client_id));
create policy fasts_insert on fasts for insert
  with check (owns_client(client_id));
create policy fasts_update on fasts for update
  using (owns_client(client_id));
create policy fasts_delete on fasts for delete
  using (owns_client(client_id));
