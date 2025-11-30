insert into public.language_courses (name)
values ('English'), ('Spanish'), ('German') on conflict do nothing;
