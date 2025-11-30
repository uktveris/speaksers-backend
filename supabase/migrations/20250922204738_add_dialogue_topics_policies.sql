alter table public.dialogue_topics enable row level security;

create policy "users can select dialogue topics"
on public.dialogue_topics
for select
to authenticated
using(true);
