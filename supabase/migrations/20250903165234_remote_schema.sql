

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."cefr_level" AS ENUM (
    'A1',
    'A2',
    'B1',
    'B2',
    'C1',
    'C2'
);


ALTER TYPE "public"."cefr_level" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."asign_discriminator"() RETURNS "trigger"
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


ALTER FUNCTION "public"."asign_discriminator"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
insert into public.users (id, avatar_url, username)
values (new.id, 'default-dark.png', split_part(new.email, '@', 1));
    return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_enrollment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
insert into public.enrollment_logs (info)
values ('user: ' || new.user_id::text || 'enrolled to course: ' || new.language_course_id::text);
return new;
end;
$$;


ALTER FUNCTION "public"."log_enrollment"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."backend_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ts" timestamp with time zone DEFAULT "now"() NOT NULL,
    "level" "text" NOT NULL,
    "message" "text" NOT NULL,
    "context" "text" NOT NULL,
    "meta" "jsonb"
);


ALTER TABLE "public"."backend_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollment_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "info" "text" NOT NULL
);


ALTER TABLE "public"."enrollment_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "language_course_id" "uuid" NOT NULL,
    "level" "public"."cefr_level" NOT NULL,
    "enrolled_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."language_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."language_courses" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_enrollments" WITH ("security_invoker"='on') AS
 SELECT "e"."user_id",
    "c"."id",
    "c"."name",
    "e"."enrolled_at",
    "e"."level"
   FROM ("public"."enrollments" "e"
     JOIN "public"."language_courses" "c" ON (("e"."language_course_id" = "c"."id")));


ALTER TABLE "public"."user_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "avatar_url" "text",
    "username" "text",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "discriminator" character(4),
    "avatar_updated_at" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."backend_logs"
    ADD CONSTRAINT "backend_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollment_logs"
    ADD CONSTRAINT "enrollment_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_user_id_language_course_id_key" UNIQUE ("user_id", "language_course_id");



ALTER TABLE ONLY "public"."language_courses"
    ADD CONSTRAINT "language_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "unique_username_discriminator" UNIQUE ("username", "discriminator");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "on_new_enrollment" AFTER INSERT ON "public"."enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."log_enrollment"();



CREATE OR REPLACE TRIGGER "trigger_assign_discriminator" BEFORE INSERT ON "public"."users" FOR EACH ROW WHEN (("new"."discriminator" IS NULL)) EXECUTE FUNCTION "public"."asign_discriminator"();



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_language_course_id_fkey" FOREIGN KEY ("language_course_id") REFERENCES "public"."language_courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



CREATE POLICY "allow_auth_users_select_courses" ON "public"."language_courses" FOR SELECT TO "authenticated" USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."backend_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollment_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."language_courses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_users" ON "public"."users" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_insert_their_own_data" ON "public"."users" FOR INSERT WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_can_update_ther_own_data" ON "public"."users" FOR UPDATE USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (true);



CREATE POLICY "users_enroll_to_courses" ON "public"."enrollments" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_select_their_enrollments" ON "public"."enrollments" FOR SELECT USING (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."asign_discriminator"() TO "anon";
GRANT ALL ON FUNCTION "public"."asign_discriminator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."asign_discriminator"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_enrollment"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_enrollment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_enrollment"() TO "service_role";



























GRANT ALL ON TABLE "public"."backend_logs" TO "anon";
GRANT ALL ON TABLE "public"."backend_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."backend_logs" TO "service_role";



GRANT ALL ON TABLE "public"."enrollment_logs" TO "anon";
GRANT ALL ON TABLE "public"."enrollment_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollment_logs" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."language_courses" TO "anon";
GRANT ALL ON TABLE "public"."language_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."language_courses" TO "service_role";



GRANT ALL ON TABLE "public"."user_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."user_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."user_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
