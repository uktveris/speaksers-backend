
create or replace function public.seed_executor()
returns jsonb
language plpgsql
security definer
as $$
declare
  lock_id bigint := 987654321;
  res_language_courses jsonb;
  res_dialogue_topics jsonb;
begin
  perform pg_advisory_xact_lock(lock_id);
  res_language_courses := public.seed_language_courses();
  res_dialogue_topics := public.seed_dialogue_topics();

  insert into admin.seed_runs(last_run_at, details)
  values (now(), jsonb_build_object('language_courses', res_language_courses, 'dialogue_topics', res_dialogue_topics))
  on conflict do update
    set last_run_at = excluded.last_run_at, details = excluded.details;

  return jsonb_build_object('status', 'ok', 'parts', json_build_array(res_language_courses, res_dialogue_topics));
end;
$$;

drop trigger if exists trigger_assign_discriminator on public.users;
drop function if exists public.asign_discriminator();

CREATE OR REPLACE FUNCTION "public"."assign_discriminator"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
random_discriminator char(4);
generation_attempts int := 0;
begin
loop
generation_attempts := generation_attempts + 1;
if generation_attempts > 10 then
raise exception 'failed to generate unique discriminator';
end if;
random_discriminator := lpad(floor(random() * 10000)::text, 4, '0');
if not exists (
  select 1 from public.users
  where username = new.username and discriminator = random_discriminator
) then
new.discriminator = random_discriminator;
return new;
end if;
end loop;
end;
$$;

ALTER FUNCTION "public"."assign_discriminator"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "trigger_assign_discriminator" BEFORE INSERT ON "public"."users" FOR EACH ROW WHEN (("new"."discriminator" IS NULL)) EXECUTE FUNCTION "public"."assign_discriminator"();

GRANT ALL ON FUNCTION "public"."assign_discriminator"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_discriminator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_discriminator"() TO "service_role";
