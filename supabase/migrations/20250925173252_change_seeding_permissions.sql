revoke all on function public.seed_language_courses() from public;
grant execute on function public.seed_language_courses() to service_role;

revoke all on function public.seed_dialogue_topics() from public;
grant execute on function public.seed_dialogue_topics() to service_role;

revoke all on function public.seed_executor() from public;
grant execute on function public.seed_executor() to service_role;
