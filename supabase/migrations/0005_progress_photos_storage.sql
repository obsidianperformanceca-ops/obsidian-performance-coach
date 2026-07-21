-- New notification type for progress photo reminders
alter type notification_type add value if not exists 'PROGRESS_PHOTO_DUE';

-- Private bucket for progress photos. Files are stored under
-- {client_id}/{filename} so RLS can scope access per-client via owns_client().
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "progress_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'progress-photos'
    and owns_client(((storage.foldername(name))[1])::uuid)
  );

create policy "progress_photos_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'progress-photos'
    and owns_client(((storage.foldername(name))[1])::uuid)
  );

create policy "progress_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'progress-photos'
    and owns_client(((storage.foldername(name))[1])::uuid)
  );
