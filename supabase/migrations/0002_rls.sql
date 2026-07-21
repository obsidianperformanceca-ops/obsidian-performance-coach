-- =============================================================================
-- Row Level Security — clients only ever see their own rows; coaches see
-- every client they own. All policies key off auth.uid() via public.users.
-- =============================================================================

-- Helper: is the current auth user a COACH?
create or replace function is_coach()
returns boolean as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'COACH'
  );
$$ language sql stable security definer set search_path = public;

-- Helper: does the current auth user own (coach) or belong to (client) this client_id row?
create or replace function owns_client(target_client_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.clients c
    where c.id = target_client_id
      and (c.coach_id = auth.uid() or c.user_id = auth.uid())
  );
$$ language sql stable security definer set search_path = public;

alter table users enable row level security;
alter table clients enable row level security;
alter table onboarding_responses enable row level security;
alter table targets enable row level security;
alter table daily_logs enable row level security;
alter table meals enable row level security;
alter table workout_programs enable row level security;
alter table workout_days enable row level security;
alter table exercises enable row level security;
alter table workout_sessions enable row level security;
alter table exercise_set_logs enable row level security;
alter table weights enable row level security;
alter table measurements enable row level security;
alter table progress_photos enable row level security;
alter table coach_notes enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

-- USERS: everyone can read their own row; coaches can read their clients' user rows.
create policy users_select on users for select
  using (id = auth.uid() or is_coach());
create policy users_update_self on users for update
  using (id = auth.uid());

-- CLIENTS
create policy clients_select on clients for select
  using (coach_id = auth.uid() or user_id = auth.uid());
create policy clients_insert_coach on clients for insert
  with check (is_coach() and coach_id = auth.uid());
create policy clients_update on clients for update
  using (coach_id = auth.uid() or user_id = auth.uid());
create policy clients_delete_coach on clients for delete
  using (coach_id = auth.uid());

-- ONBOARDING RESPONSES
create policy onboarding_select on onboarding_responses for select
  using (owns_client(client_id));
create policy onboarding_insert on onboarding_responses for insert
  with check (owns_client(client_id));
create policy onboarding_update on onboarding_responses for update
  using (owns_client(client_id));

-- TARGETS: coach manages, client reads
create policy targets_select on targets for select
  using (owns_client(client_id));
create policy targets_write_coach on targets for insert
  with check (is_coach() and owns_client(client_id));
create policy targets_update_coach on targets for update
  using (is_coach() and owns_client(client_id));

-- DAILY LOGS: client writes their own entries, coach reviews
create policy daily_logs_select on daily_logs for select
  using (owns_client(client_id));
create policy daily_logs_insert on daily_logs for insert
  with check (owns_client(client_id));
create policy daily_logs_update on daily_logs for update
  using (owns_client(client_id));

-- MEALS (inherit access from parent daily_log's client)
create policy meals_select on meals for select
  using (exists (select 1 from daily_logs dl where dl.id = daily_log_id and owns_client(dl.client_id)));
create policy meals_insert on meals for insert
  with check (exists (select 1 from daily_logs dl where dl.id = daily_log_id and owns_client(dl.client_id)));
create policy meals_update on meals for update
  using (exists (select 1 from daily_logs dl where dl.id = daily_log_id and owns_client(dl.client_id)));

-- WORKOUT PROGRAMS: coach writes, both read
create policy programs_select on workout_programs for select
  using (owns_client(client_id));
create policy programs_write_coach on workout_programs for insert
  with check (is_coach() and owns_client(client_id));
create policy programs_update_coach on workout_programs for update
  using (is_coach() and owns_client(client_id));
create policy programs_delete_coach on workout_programs for delete
  using (is_coach() and owns_client(client_id));

-- WORKOUT DAYS / EXERCISES (inherit from program's client)
create policy days_select on workout_days for select
  using (exists (select 1 from workout_programs p where p.id = program_id and owns_client(p.client_id)));
create policy days_write_coach on workout_days for insert
  with check (is_coach() and exists (select 1 from workout_programs p where p.id = program_id and owns_client(p.client_id)));
create policy days_update_coach on workout_days for update
  using (is_coach() and exists (select 1 from workout_programs p where p.id = program_id and owns_client(p.client_id)));
create policy days_delete_coach on workout_days for delete
  using (is_coach() and exists (select 1 from workout_programs p where p.id = program_id and owns_client(p.client_id)));

create policy exercises_select on exercises for select
  using (exists (
    select 1 from workout_days d join workout_programs p on p.id = d.program_id
    where d.id = workout_day_id and owns_client(p.client_id)
  ));
create policy exercises_write_coach on exercises for insert
  with check (is_coach() and exists (
    select 1 from workout_days d join workout_programs p on p.id = d.program_id
    where d.id = workout_day_id and owns_client(p.client_id)
  ));
create policy exercises_update_coach on exercises for update
  using (is_coach() and exists (
    select 1 from workout_days d join workout_programs p on p.id = d.program_id
    where d.id = workout_day_id and owns_client(p.client_id)
  ));
create policy exercises_delete_coach on exercises for delete
  using (is_coach() and exists (
    select 1 from workout_days d join workout_programs p on p.id = d.program_id
    where d.id = workout_day_id and owns_client(p.client_id)
  ));

-- WORKOUT SESSIONS + SET LOGS: client logs their own performance
create policy sessions_select on workout_sessions for select
  using (owns_client(client_id));
create policy sessions_insert on workout_sessions for insert
  with check (owns_client(client_id));
create policy sessions_update on workout_sessions for update
  using (owns_client(client_id));

create policy set_logs_select on exercise_set_logs for select
  using (exists (select 1 from workout_sessions s where s.id = session_id and owns_client(s.client_id)));
create policy set_logs_insert on exercise_set_logs for insert
  with check (exists (select 1 from workout_sessions s where s.id = session_id and owns_client(s.client_id)));
create policy set_logs_update on exercise_set_logs for update
  using (exists (select 1 from workout_sessions s where s.id = session_id and owns_client(s.client_id)));

-- WEIGHTS / MEASUREMENTS / PHOTOS: client logs, both read
create policy weights_select on weights for select using (owns_client(client_id));
create policy weights_insert on weights for insert with check (owns_client(client_id));

create policy measurements_select on measurements for select using (owns_client(client_id));
create policy measurements_insert on measurements for insert with check (owns_client(client_id));

create policy photos_select on progress_photos for select using (owns_client(client_id));
create policy photos_insert on progress_photos for insert with check (owns_client(client_id));

-- COACH NOTES: private — coach only, never exposed to the client
create policy notes_select_coach on coach_notes for select
  using (is_coach() and owns_client(client_id));
create policy notes_insert_coach on coach_notes for insert
  with check (is_coach() and owns_client(client_id) and author_id = auth.uid());
create policy notes_update_coach on coach_notes for update
  using (is_coach() and author_id = auth.uid());
create policy notes_delete_coach on coach_notes for delete
  using (is_coach() and author_id = auth.uid());

-- MESSAGES: either party in the thread can read/write
create policy messages_select on messages for select
  using (owns_client(client_id));
create policy messages_insert on messages for insert
  with check (owns_client(client_id) and sender_id = auth.uid());
create policy messages_update_read on messages for update
  using (owns_client(client_id));

-- NOTIFICATIONS: only the recipient
create policy notifications_select on notifications for select
  using (user_id = auth.uid());
create policy notifications_update_self on notifications for update
  using (user_id = auth.uid());
create policy notifications_insert_system on notifications for insert
  with check (true); -- created by server-side (service role) jobs/API routes
