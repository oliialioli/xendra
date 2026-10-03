-- Shared top scores for the castle minigame (features/castleGame). Run this
-- once against the same Supabase project as 0001_boats.sql, in the SQL
-- editor (or `supabase db push` with the CLI).
--
-- The game runs in the visitor's browser, so a score can't be fully proven.
-- What this does make hard is inventing one: scores can only be written by
-- submit_castle_score(), which needs a run started (start_castle_run()) at
-- least as long ago as the time the game claims to have taken, used once,
-- and a score no higher than that time allows. The numbers below mirror
-- src/features/castleGame/config.ts (SCORE) and level.ts -- keep them in step.

create extension if not exists pgcrypto;

-- One row per game started. Not readable or writable directly by anyone;
-- only the two functions below touch it.
create table if not exists public.castle_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished boolean not null default false
);
alter table public.castle_runs enable row level security;

create table if not exists public.castle_scores (
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  score integer not null,
  -- Seconds of play, for a game won at the door; null for a game over.
  seconds numeric(6, 1),
  created_at timestamptz not null default now(),

  constraint castle_scores_alias check (alias = btrim(alias) and char_length(alias) between 1 and 12),
  -- 20 notes x 100 + 4 mites x 200 + boss 1000 + door 2000 + speed bonus up to 3000.
  constraint castle_scores_score check (score between 0 and 8800),
  constraint castle_scores_seconds check (seconds is null or seconds between 0 and 7200)
);

create index if not exists castle_scores_rank_idx on public.castle_scores (score desc, created_at asc);

alter table public.castle_scores enable row level security;

-- Anyone can read the ranking. There is no insert/update/delete policy:
-- writes only happen through submit_castle_score() below.
create policy "Castle scores are publicly readable"
  on public.castle_scores for select
  to anon, authenticated
  using (true);

-- A game starting: returns its run id. Also clears out runs over a day old.
create or replace function public.start_castle_run()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  run_id uuid;
begin
  delete from castle_runs where started_at < now() - interval '1 day';
  insert into castle_runs default values returning id into run_id;
  return run_id;
end;
$$;

-- A finished game's score, with the alias its player chose.
create or replace function public.submit_castle_score(
  p_run uuid,
  p_alias text,
  p_score integer,
  p_seconds numeric,
  p_won boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  run castle_runs;
  elapsed numeric;
  max_score integer;
begin
  select * into run from castle_runs where id = p_run for update;
  if not found or run.finished then
    raise exception 'unknown or already used run';
  end if;

  -- The game's clock stops while paused, so real time can only be longer.
  elapsed := extract(epoch from now() - run.started_at);
  if p_seconds is null or p_seconds < 0 or p_seconds > elapsed + 2 then
    raise exception 'time does not add up';
  end if;
  -- Running the whole level and beating the boss takes well over 20 s.
  if p_won and p_seconds < 20 then
    raise exception 'too fast to be true';
  end if;

  -- Everything but the door (notes, mites, boss) is 3800; a win adds the
  -- door's 2000 and the speed bonus for its time (3000 - 20/s, never below 0).
  max_score := 3800
    + case when p_won then 2000 + greatest(0, round(3000 - 20 * p_seconds))::integer + 10 else 0 end;
  if p_score < 0 or p_score > max_score then
    raise exception 'score out of range';
  end if;

  update castle_runs set finished = true where id = p_run;
  insert into castle_scores (alias, score, seconds)
  values (btrim(p_alias), p_score, case when p_won then round(p_seconds, 1) else null end);
end;
$$;

revoke all on function public.start_castle_run() from public;
revoke all on function public.submit_castle_score(uuid, text, integer, numeric, boolean) from public;
grant execute on function public.start_castle_run() to anon, authenticated;
grant execute on function public.submit_castle_score(uuid, text, integer, numeric, boolean) to anon, authenticated;
