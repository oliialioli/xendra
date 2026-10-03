import { getSupabaseClient } from '../../lib/supabaseClient';
import { LEADERBOARD } from './config';
import type { LeaderboardEntry } from './leaderboard';

/**
 * The shared ranking, everyone's best three, kept in Supabase (see
 * supabase/migrations/0002_castle_scores.sql). Every call resolves to null
 * (or false) instead of throwing when Supabase isn't configured, the
 * migration hasn't been run yet, or the network fails -- the game then
 * keeps using this browser's own ranking (leaderboard.ts).
 */

type ScoreRow = { alias: string; score: number; seconds: number | string | null; created_at: string };

/** The current top 3, or null if the shared ranking isn't available. */
export async function fetchSharedTop(): Promise<LeaderboardEntry[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('castle_scores')
      .select('alias, score, seconds, created_at')
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(LEADERBOARD.size);
    if (error || !data) return null;
    return (data as ScoreRow[]).map((row) => {
      const entry: LeaderboardEntry = { alias: row.alias, score: row.score, at: Date.parse(row.created_at) };
      if (row.seconds !== null) entry.time = Number(row.seconds);
      return entry;
    });
  } catch {
    return null;
  }
}

/** Registers a game starting; its id has to come back with the score. Null if unavailable. */
export async function startSharedRun(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('start_castle_run');
    return error || typeof data !== 'string' ? null : data;
  } catch {
    return null;
  }
}

export type SubmitResult = {
  /** False if it couldn't be saved (offline, or refused as implausible). */
  ok: boolean;
  /**
   * The discount code (XENDRA1, XENDRA2...) when this score took first place
   * from everyone -- handed out by Supabase, in order (migration 0003).
   */
  prizeCode: string | null;
};

/** Sends a finished game's score to everyone's ranking. */
export async function submitSharedScore(
  runId: string,
  alias: string,
  score: number,
  seconds: number,
  won: boolean,
): Promise<SubmitResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, prizeCode: null };
  try {
    const { data, error } = await supabase.rpc('submit_castle_score', {
      p_run: runId,
      p_alias: alias,
      p_score: score,
      p_seconds: Math.round(seconds * 10) / 10,
      p_won: won,
    });
    if (error) return { ok: false, prizeCode: null };
    return { ok: true, prizeCode: typeof data === 'string' && /^XENDRA\d+$/.test(data) ? data : null };
  } catch {
    return { ok: false, prizeCode: null };
  }
}
