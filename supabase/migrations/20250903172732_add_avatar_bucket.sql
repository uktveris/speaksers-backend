insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false);

create policy "users can create their own avatar"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.folderName(name))[2]
);

create policy "users can update their own avatar"
on storage.objects
for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.folderName(name))[2]
);

create policy "users can delete their own avatar"
on storage.objects
for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.folderName(name))[2]
);

create policy "anyone can view avatars"
on storage.objects
for select
using (
  bucket_id = 'avatars'
);
