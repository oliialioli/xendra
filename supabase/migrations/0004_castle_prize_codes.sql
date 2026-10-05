-- Prize codes that can't be guessed. Run after 0003_castle_prizes.sql.
--
-- Until now the codes were XENDRA1, XENDRA2... -- anyone could work out the
-- next one. They keep their number (so you still see how many have been
-- won) and gain four random characters: XENDRA3-K7QM. Codes already handed
-- out stay as they are. Check a code someone brings you in Table Editor ->
-- castle_prizes: it's only real if it's there.
--
-- Same function as in 0003, only the line building the code changes (the
-- signature and return type don't, so it can be replaced in place).

create or replace function public.submit_castle_score(
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
  -- No 0/O, 1/I: easy to read out loud or copy by hand.
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  suffix text := '';
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
    for i in 1..4 loop
      suffix := suffix || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;
    prize_code := 'XENDRA' || prize_number || '-' || suffix;
    insert into castle_prizes (number, code, score_id, alias, score)
    values (prize_number, prize_code, new_score_id, btrim(p_alias), p_score);
  end if;

  return prize_code;
end;
$$;

revoke all on function public.submit_castle_score(uuid, text, integer, numeric, boolean) from public;
grant execute on function public.submit_castle_score(uuid, text, integer, numeric, boolean) to anon, authenticated;
