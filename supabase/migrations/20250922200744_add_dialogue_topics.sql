create table if not exists public.dialogue_topics (
  id uuid not null default gen_random_uuid(),
  title varchar(100) not null,
  role1 varchar(100) not null,
  arg1 text not null,
  tip1 text not null,
  role2 varchar(100) not null,
  arg2 text not null,
  tip2 text not null,
  created_at timestamp with time zone not null default now()
);
