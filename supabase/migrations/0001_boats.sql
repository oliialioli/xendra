-- Message-boats feature (docs/BOATS.md). Run this once against a Supabase
-- project via the SQL editor, or `supabase db push` if you use the CLI.

create extension if not exists pgcrypto;

create table if not exists public.boats (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  message text not null,
  drawing jsonb not null,
  created_at timestamptz not null default now(),

  -- Mirrors boatValidation.ts / drawingUtils.ts's own limits so a client
  -- that skips or has a bug in the frontend check still can't write bad data.
  constraint boats_message_not_blank check (btrim(message) <> ''),
  constraint boats_message_length check (char_length(message) <= 200),
  constraint boats_display_name_length check (display_name is null or char_length(display_name) <= 40),
  -- Same three link patterns as boatValidation.ts's containsLink().
  constraint boats_message_no_link check (
    message !~* 'https?://'
    and message !~* 'www\.'
    and message !~* '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(com|net|org|eus|es|io|dev|app|co|info|xyz|me|gg|tv|ai|cat|biz|shop|link|click)\b'
  ),
  constraint boats_drawing_not_empty check (jsonb_array_length(drawing -> 'strokes') > 0),
  -- Generous ceiling matching MAX_DRAWING_JSON_BYTES in drawingUtils.ts (60 KB) plus headroom for jsonb's own encoding overhead.
  constraint boats_drawing_size check (pg_column_size(drawing) < 80000)
);

create index if not exists boats_created_at_idx on public.boats (created_at desc);

alter table public.boats enable row level security;

-- Public read: anyone (including anonymous visitors) can list boats.
create policy "Boats are publicly readable"
  on public.boats for select
  to anon, authenticated
  using (true);

-- Public insert: anyone can publish a boat. No update/delete policies exist
-- at all, so RLS blocks both for every role except your own service-role
-- key (used only for manual/admin cleanup, e.g. via the Supabase dashboard
-- or a script with the service-role key -- never shipped to the client).
create policy "Anyone can publish a boat"
  on public.boats for insert
  to anon, authenticated
  with check (true);

-- Required for BoatFleet's realtime subscription (postgres_changes on
-- INSERT/DELETE) to receive events for this table.
alter publication supabase_realtime add table public.boats;
