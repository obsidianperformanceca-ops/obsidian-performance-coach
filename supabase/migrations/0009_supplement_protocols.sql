-- Supplement protocols — the naturopathic side of the practice. A coach
-- (in this single-login setup, either partner) sets per-client supplement
-- recommendations; the client sees them read-only on their dashboard.
-- This is a deliberate differentiator: mainstream fitness apps have no
-- naturopath workflow.
create table supplement_protocols (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  supplement text not null,
  dose text,
  timing text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index supplement_protocols_client_id_idx on supplement_protocols(client_id);

alter table supplement_protocols enable row level security;

-- Coach manages; client reads. Mirrors the targets pattern.
create policy supplements_select on supplement_protocols for select
  using (owns_client(client_id));
create policy supplements_insert_coach on supplement_protocols for insert
  with check (is_coach() and owns_client(client_id));
create policy supplements_update_coach on supplement_protocols for update
  using (is_coach() and owns_client(client_id));
create policy supplements_delete_coach on supplement_protocols for delete
  using (is_coach() and owns_client(client_id));
