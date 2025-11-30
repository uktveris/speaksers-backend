drop policy "users can create their own avatar" on storage.objects;

create policy "users can create their own avatar"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[2]
  and array_length(storage.foldername(name), 1) > 1
);

create policy "admins can upload default avatars"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and auth.jwt() ->> 'role' = 'service_role'
  and array_length(storage.foldername(name), 1) <= 1
);
