alter table public.sessions
  add column chosen_by uuid references public.player(player_id);
