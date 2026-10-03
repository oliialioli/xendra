-- First-place prizes for the castle minigame. Run after 0002_castle_scores.sql
-- (safe to run even if 0002 was run a while ago).
--
-- Whenever a saved score beats everyone's best so far (a tie doesn't), its
-- player wins a 10% discount code: XENDRA1 for the first person to take
-- first place, XENDRA2 for the next, and so on. submit_castle_score() now
-- returns that code (or null), and every code handed out is recorded in
-- castle_prizes -- visible only to you, in the Supabase dashboard (Table
-- Editor -> castle_prizes): code, alias, score and when, so you can see how
-- many have been won and check a code someone brings you.

create sequence if not exists public.castle_prize_number;

create table if not exists public.castle_prizes (
  number integer primary key,
  code text not null unique,
  score_id uuid not null references public.castle_scores (id) on delete cascade,
  alias text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

-- No policies at all: nobody can read or write prizes through the public
-- API; only submit_castle_score() (below) and your dashboard can.
alter table public.castle_prizes enable row level security;

-- Same checks as in 0002, now also handing out the prize. The return type
-- changes (void -> text), so the old function has to go first.
drop function if exists public.submit_castle_score(uuid, text, integer, numeric, boolean);

create function public.submit_castle_score(
  p_run uuid,
  p_alias text,
  p_score integer,
  p_seconds numeric,
  p_won boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  run castle_runs;
  elapsed numeric;
  max_score integer;
  best integer;
  new_score_id uuid;
  prize_number integer;
  prize_code text;
begin
  -- One submission at a time, so two people can't both take first place at once.
  perform pg_advisory_xact_lock(hashtext('castle_scores'));

  select * into run from castle_runs where id = p_run for update;
  if not found or run.finished then
    raise exception 'unknown or already used run';
  end if;

  elapsed := extract(epoch from now() - run.started_at);
  if p_seconds is null or p_seconds < 0 or p_seconds > elapsed + 2 then
    raise exception 'time does not add up';
  end if;
  if p_won and p_seconds < 20 then
    raise exception 'too fast to be true';
  end if;

  max_score := 3800
    + case when p_won then 2000 + greatest(0, round(3000 - 20 * p_seconds))::integer + 10 else 0 end;
  if p_score < 0 or p_score > max_score then
    raise exception 'score out of range';
  end if;

  select max(score) into best from castle_scores;

  update castle_runs set finished = true where id = p_run;
  insert into castle_scores (alias, score, seconds)
  values (btrim(p_alias), p_score, case when p_won then round(p_seconds, 1) else null end)
  returning id into new_score_id;

  -- A new best (strictly better than anyone so far): the next prize code.
  if p_score > 0 and (best is null or p_score > best) then
    prize_number := nextval('castle_prize_number');
    prize_code := 'XENDRA' || prize_number;
    insert into castle_prizes (number, code, score_id, alias, score)
    values (prize_number, prize_code, new_score_id, btrim(p_alias), p_score);
  end if;

  return prize_code;
end;
$$;

revoke all on function public.submit_castle_score(uuid, text, integer, numeric, boolean) from public;
grant execute on function public.submit_castle_score(uuid, text, integer, numeric, boolean) to anon, authenticated;
