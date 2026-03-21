-- =============================================================================
-- RBAC Setup: Admin + Player roles
-- Run this in Supabase SQL Editor (or via supabase db push)
-- =============================================================================

-- 1. Create the player_role enum and add column to player table
CREATE TYPE public.player_role AS ENUM ('ADMIN', 'PLAYER');

ALTER TABLE public.player
  ADD COLUMN player_role public.player_role NOT NULL DEFAULT 'PLAYER';

-- 2. Helper function for RLS policies (SECURITY DEFINER to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.player_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT player_role FROM public.player
  WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- 3. Trigger: prevent non-admins from changing player_role
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.player_role IS DISTINCT FROM OLD.player_role
     AND public.get_user_role() != 'ADMIN' THEN
    RAISE EXCEPTION 'Only admins can change player roles';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_role_self_change
  BEFORE UPDATE ON public.player FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_change();

-- =============================================================================
-- 4. Enable RLS on all tables
-- =============================================================================
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_players ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. RLS Policies
-- =============================================================================

-- games
CREATE POLICY "games_select" ON public.games FOR SELECT TO authenticated USING (true);
CREATE POLICY "games_insert" ON public.games FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'ADMIN');
CREATE POLICY "games_update" ON public.games FOR UPDATE TO authenticated USING (public.get_user_role() = 'ADMIN') WITH CHECK (public.get_user_role() = 'ADMIN');
CREATE POLICY "games_delete" ON public.games FOR DELETE TO authenticated USING (public.get_user_role() = 'ADMIN');

-- seasons
CREATE POLICY "seasons_select" ON public.seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "seasons_insert" ON public.seasons FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'ADMIN');
CREATE POLICY "seasons_update" ON public.seasons FOR UPDATE TO authenticated USING (public.get_user_role() = 'ADMIN') WITH CHECK (public.get_user_role() = 'ADMIN');
CREATE POLICY "seasons_delete" ON public.seasons FOR DELETE TO authenticated USING (public.get_user_role() = 'ADMIN');

-- sessions
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'ADMIN');
CREATE POLICY "sessions_update" ON public.sessions FOR UPDATE TO authenticated USING (public.get_user_role() = 'ADMIN') WITH CHECK (public.get_user_role() = 'ADMIN');
CREATE POLICY "sessions_delete" ON public.sessions FOR DELETE TO authenticated USING (public.get_user_role() = 'ADMIN');

-- player (special: self-insert, self-or-admin update, admin-only delete)
CREATE POLICY "player_select" ON public.player FOR SELECT TO authenticated USING (true);
CREATE POLICY "player_insert" ON public.player FOR INSERT TO authenticated WITH CHECK (auth_id = auth.uid());
CREATE POLICY "player_update" ON public.player FOR UPDATE TO authenticated
  USING (auth_id = auth.uid() OR public.get_user_role() = 'ADMIN')
  WITH CHECK (auth_id = auth.uid() OR public.get_user_role() = 'ADMIN');
CREATE POLICY "player_delete" ON public.player FOR DELETE TO authenticated USING (public.get_user_role() = 'ADMIN');

-- player_sessions
CREATE POLICY "player_sessions_select" ON public.player_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "player_sessions_insert" ON public.player_sessions FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'ADMIN');
CREATE POLICY "player_sessions_update" ON public.player_sessions FOR UPDATE TO authenticated USING (public.get_user_role() = 'ADMIN') WITH CHECK (public.get_user_role() = 'ADMIN');
CREATE POLICY "player_sessions_delete" ON public.player_sessions FOR DELETE TO authenticated USING (public.get_user_role() = 'ADMIN');

-- season_players
CREATE POLICY "season_players_select" ON public.season_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "season_players_insert" ON public.season_players FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'ADMIN');
CREATE POLICY "season_players_update" ON public.season_players FOR UPDATE TO authenticated USING (public.get_user_role() = 'ADMIN') WITH CHECK (public.get_user_role() = 'ADMIN');
CREATE POLICY "season_players_delete" ON public.season_players FOR DELETE TO authenticated USING (public.get_user_role() = 'ADMIN');

-- =============================================================================
-- 6. Promote your admin user (replace with your auth user UUID)
-- =============================================================================
-- UPDATE public.player SET player_role = 'ADMIN' WHERE auth_id = '<your-auth-user-uuid>';
