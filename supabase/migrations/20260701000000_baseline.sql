


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."Season Status" AS ENUM (
    'UPCOMING',
    'IN_PROGRESS',
    'SUSPENDED',
    'COMPLETED'
);


ALTER TYPE "public"."Season Status" OWNER TO "postgres";


CREATE TYPE "public"."player_role" AS ENUM (
    'ADMIN',
    'PLAYER'
);


ALTER TYPE "public"."player_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "public"."player_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT player_role FROM public.player
  WHERE auth_id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_role_self_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.player_role IS DISTINCT FROM OLD.player_role
     AND public.get_user_role() != 'ADMIN' THEN
    RAISE EXCEPTION 'Only admins can change player roles';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_role_self_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_player_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_player_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."games" (
    "game_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "game_bgg_url" "text"
);


ALTER TABLE "public"."games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player" (
    "player_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_id" "uuid",
    "player_name" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "player_role" "public"."player_role" DEFAULT 'PLAYER'::"public"."player_role" NOT NULL
);


ALTER TABLE "public"."player" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_sessions" (
    "player_session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid",
    "session_id" "uuid",
    "player_session_position" integer NOT NULL,
    "player_session_score" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."player_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."season_players" (
    "season_players_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."season_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."season_scoring_schedules" (
    "schedule_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "multipliers" integer[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "season_scoring_schedules_multipliers_nonempty" CHECK (("cardinality"("multipliers") > 0)),
    CONSTRAINT "season_scoring_schedules_multipliers_positive" CHECK ((0 < ALL ("multipliers")))
);


ALTER TABLE "public"."season_scoring_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "season_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "season_description" "text",
    "season_status" "public"."Season Status" DEFAULT 'UPCOMING'::"public"."Season Status" NOT NULL
);


ALTER TABLE "public"."seasons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "session_date_played" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "Player_pkey" PRIMARY KEY ("player_id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("game_id");



ALTER TABLE ONLY "public"."player_sessions"
    ADD CONSTRAINT "player_sessions_pkey" PRIMARY KEY ("player_session_id");



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_pkey" PRIMARY KEY ("season_players_id");



ALTER TABLE ONLY "public"."season_scoring_schedules"
    ADD CONSTRAINT "season_scoring_schedules_pkey" PRIMARY KEY ("schedule_id");



ALTER TABLE ONLY "public"."season_scoring_schedules"
    ADD CONSTRAINT "season_scoring_schedules_season_id_key" UNIQUE ("season_id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("season_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_id");



CREATE INDEX "player_sessions_player_id_idx" ON "public"."player_sessions" USING "btree" ("player_id");



CREATE INDEX "player_sessions_session_id_idx" ON "public"."player_sessions" USING "btree" ("session_id");



CREATE INDEX "sessions_game_id_idx" ON "public"."sessions" USING "btree" ("game_id");



CREATE INDEX "sessions_season_id_idx" ON "public"."sessions" USING "btree" ("season_id");



CREATE OR REPLACE TRIGGER "set_player_updated_at" BEFORE UPDATE ON "public"."player" FOR EACH ROW EXECUTE FUNCTION "public"."set_player_updated_at"();



CREATE OR REPLACE TRIGGER "trg_prevent_role_self_change" BEFORE UPDATE ON "public"."player" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_role_self_change"();



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "Player_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."player_sessions"
    ADD CONSTRAINT "player_sessions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("player_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_sessions"
    ADD CONSTRAINT "player_sessions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("session_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("player_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("season_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_scoring_schedules"
    ADD CONSTRAINT "season_scoring_schedules_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("season_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("game_id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("season_id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Enable insert for authenticated users only" ON "public"."player" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."player_sessions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."player" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."season_players" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."seasons" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."sessions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "games_delete" ON "public"."games" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "games_insert" ON "public"."games" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "games_select" ON "public"."games" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "games_update" ON "public"."games" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role")) WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



ALTER TABLE "public"."player" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_delete" ON "public"."player" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "player_insert" ON "public"."player" FOR INSERT TO "authenticated" WITH CHECK (("auth_id" = "auth"."uid"()));



CREATE POLICY "player_select" ON "public"."player" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."player_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_sessions_delete" ON "public"."player_sessions" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "player_sessions_insert" ON "public"."player_sessions" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "player_sessions_select" ON "public"."player_sessions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "player_sessions_update" ON "public"."player_sessions" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role")) WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "player_update" ON "public"."player" FOR UPDATE TO "authenticated" USING ((("auth_id" = "auth"."uid"()) OR ("public"."get_user_role"() = 'ADMIN'::"public"."player_role"))) WITH CHECK ((("auth_id" = "auth"."uid"()) OR ("public"."get_user_role"() = 'ADMIN'::"public"."player_role")));



CREATE POLICY "schedules_delete" ON "public"."season_scoring_schedules" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "schedules_insert" ON "public"."season_scoring_schedules" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "schedules_select" ON "public"."season_scoring_schedules" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "schedules_update" ON "public"."season_scoring_schedules" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role")) WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



ALTER TABLE "public"."season_players" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "season_players_delete" ON "public"."season_players" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "season_players_insert" ON "public"."season_players" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "season_players_select" ON "public"."season_players" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "season_players_update" ON "public"."season_players" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role")) WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



ALTER TABLE "public"."season_scoring_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "seasons_delete" ON "public"."seasons" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "seasons_insert" ON "public"."seasons" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "seasons_select" ON "public"."seasons" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "seasons_update" ON "public"."seasons" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role")) WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessions_delete" ON "public"."sessions" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "sessions_insert" ON "public"."sessions" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));



CREATE POLICY "sessions_select" ON "public"."sessions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "sessions_update" ON "public"."sessions" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'ADMIN'::"public"."player_role")) WITH CHECK (("public"."get_user_role"() = 'ADMIN'::"public"."player_role"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_role_self_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_role_self_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_role_self_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_player_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_player_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_player_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."player" TO "anon";
GRANT ALL ON TABLE "public"."player" TO "authenticated";
GRANT ALL ON TABLE "public"."player" TO "service_role";



GRANT ALL ON TABLE "public"."player_sessions" TO "anon";
GRANT ALL ON TABLE "public"."player_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."player_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."season_players" TO "anon";
GRANT ALL ON TABLE "public"."season_players" TO "authenticated";
GRANT ALL ON TABLE "public"."season_players" TO "service_role";



GRANT ALL ON TABLE "public"."season_scoring_schedules" TO "anon";
GRANT ALL ON TABLE "public"."season_scoring_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."season_scoring_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."seasons" TO "anon";
GRANT ALL ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































