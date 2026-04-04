CREATE TABLE public.season_scoring_schedules (
  schedule_id  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id    uuid        NOT NULL UNIQUE REFERENCES public.seasons(season_id) ON DELETE CASCADE,
  multipliers  integer[]   NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  CONSTRAINT season_scoring_schedules_multipliers_nonempty
    CHECK (cardinality(multipliers) > 0),
  CONSTRAINT season_scoring_schedules_multipliers_positive
    CHECK (0 < ALL(multipliers))
);

ALTER TABLE public.season_scoring_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_select"
  ON public.season_scoring_schedules FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "schedules_insert"
  ON public.season_scoring_schedules FOR INSERT
  TO authenticated WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "schedules_update"
  ON public.season_scoring_schedules FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "schedules_delete"
  ON public.season_scoring_schedules FOR DELETE
  TO authenticated USING (public.get_user_role() = 'ADMIN');
