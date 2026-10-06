# Community message-boats

Visitors draw their own paper boat freehand (no template -- see
BoatDrawingCanvas), then write the message it carries, and send it off to sail the river loop around the
island. Anyone can click a boat to read its message. See `src/features/boats/`
for the implementation and each file's own doc comment for how the pieces
fit together.

## Landmark

The dock is the paper-boat workshop on the plaza where the old
`fronton`/notes landmark stood (see `types/content.ts`'s `dockMessages` doc
comment) -- lower-right of the island, below/right of the music school. Its
artwork is an open shed with the work table, a sign and a bench
(`public/assets/landmarks/caseta-ontziak.png`, via
`LANDMARK_ASSET_OVERRIDES.dockMessages` in `mapGeometry.ts`), on a plaza
fitted around it (`public/assets/map/ontzi-plaza.png`, `plazaConfig`); a sandy path
leads down to a small pier (`public/assets/map/ontzi-kaia.png`, placed by
`pierConfig` in `dockConfig.ts`), and new boats are launched off the pier's
end, just upstream of the waterfall.

## Supabase setup

1. Create a Supabase project (or use an existing one).
2. Run `supabase/migrations/0001_boats.sql` against it -- paste it into the
   SQL editor, or `supabase db push` if you use the CLI. This creates the
   `boats` table, its RLS policies (public read + public insert, no public
   update/delete), and enables realtime for it.
   Then run `supabase/migrations/0002_castle_scores.sql` too: the castle
   minigame's shared top 3 (`castle_scores`, readable by all, written only
   through the `submit_castle_score()` check -- see that file). Until it
   exists, the game keeps a per-browser ranking.
   Then `supabase/migrations/0003_castle_prizes.sql`: whoever beats
   everyone's best score wins a 10% discount code (XENDRA1, XENDRA2...),
   handed out in order and recorded in the private `castle_prizes` table
   (Table Editor -> castle_prizes) with alias, score and date.
   Then `supabase/migrations/0004_castle_prize_codes.sql`: the codes gain
   four random characters (XENDRA3-K7QM) so the next one can't be guessed.
3. Copy `.env.example` to `.env.local` and fill in:
   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-project's-anon-public-key>
   ```
   Both come from Supabase's dashboard: Project Settings -> API.
4. Restart the dev server (Vite only reads `.env*` files at startup).

Without those two variables set, `boatRepository.ts`'s `getBoatRepository()`
automatically falls back to `LocalStorageBoatRepository` -- the app runs
exactly the same, just with boats saved only in that browser's own
localStorage. **Local mode never shares boats between visitors or devices**
-- it's for development/preview only. `useBoatFleet.ts` exposes
`isLocalMode` if you want to surface that in the UI somewhere.

To delete a boat later (there's no delete UI on purpose -- see the brief):
delete the row directly in the Supabase dashboard's table editor, or via SQL
with your service-role key. `BoatFleet` removes it from the map in every
open tab automatically once the realtime `DELETE` event arrives.

## Where to adjust things

Everything below is a single named export in one of these files -- nothing
else needs to change:

| What | File | Field |
| --- | --- | --- |
| Landmark position / interaction radius | `content/dockConfig.ts` | `dockConfig.xPercent`/`yPercent`/`interactionRadius` |
| Where a new boat visually appears | `content/dockConfig.ts` | `dockConfig.launchPoint` |
| Where the launch animation hands off to the river loop | `content/boatPathConfig.ts` | `boatPathConfig.launchProgress` (the hand-off point is computed from it; boats start at `dockConfig.launchPoint`, the pier's end) |
| The river route itself | `content/boatPathConfig.ts` | `RIVER_PATH_MARGIN` (how far out from the coastline) -- the `path`/`RIVER_PATH_POLYGON` are derived automatically, never hand-edit them |
| Parallel lanes | `content/boatPathConfig.ts` | `boatPathConfig.lanes` (perpendicular world-unit offsets) |
| Boat size | `features/boats/BoatFleet.tsx` | `BOAT_WORLD_SIZE` |
| Boat speed | `features/boats/boatHash.ts` | `BASE_SPEED` / `SPEED_VARIATION` |
| Floating bob | `features/boats/BoatFleet.tsx` | `FLOAT_AMPLITUDE_PX` / `FLOAT_SPEED` |
| How boats are posed (always upright, mirrored when heading left, tilted in curves) | `features/boats/BoatFleet.tsx` | `MAX_BOAT_TILT_RAD` (max tilt), `uprightPose()` |
| Bridge under-crossings (boat drawn beneath the bridge) | `content/boatPathConfig.ts` | `boatPathConfig.bridges` (cut-out image, world bounds, and the path stretch under each of the four bridges) |
| Fading behind something on the map | `content/boatPathConfig.ts` | `boatPathConfig.occlusionSegments` (currently none) |
| House landmark (Mensajes/Mezuak) position/size | `content/mapGeometry.ts` | position: `dockConfig.xPercent`/`yPercent` (shared with the landmark hotspot below); size: `HOUSE_WIDTH_PERCENT` |
| Waterfall art position/scale/rotation | `content/dockConfig.ts` | `waterfallConfig.x`/`y`/`scale`/`rotation`/`anchorX`/`anchorY` |
| How boats go over the waterfall | `content/dockConfig.ts` | `waterfallConfig.route` (points + `pace`, `fall` marks the drop) between `segmentStart`/`segmentEnd`, and `splashDistance` -- see `features/boats/waterfallRoute.ts` |

## Needs a visual pass once real assets/art exist

- **`boatPathConfig.bridges`**: each bridge is a cut-out of
  `xendra-map-base-v7-4k.png` (`public/assets/map/bridge-*.png`) laid over
  the boats. If the base map changes, re-cut them from the new map at the
  same `bounds` (bridge pixels only -- water and the bridge's shadow on it
  transparent) and re-check each `segment` against where the river path
  actually runs under the deck.
- **`waterfallConfig`**: the house (landmark artwork, `LANDMARK_ASSET_OVERRIDES.dockMessages`
  in `mapGeometry.ts`) and the waterfall (`content/landmarks/cascada.png`,
  placed via `waterfallConfig`) are both live, positioned and verified
  against the actual river art on `xendra-map-base-v7-4k.png` (not guessed
  from a reference image -- see `waterfallConfig`'s own comment in
  `dockConfig.ts` for how `x`/`y` were derived). If the base map or either
  asset ever changes, re-verify position/scale/`segmentStart`/`segmentEnd`
  against the live map (debug overlay, `D`) rather than adjusting blind --
  and move `waterfallConfig.route` with it.
- **`RIVER_PATH_MARGIN`** (`boatPathConfig.ts`) was checked visually against
  the current map at its default value; if a future map revision moves the
  riverbank, re-check the loop still reads as "in the water" all the way
  around.

## Data model

```
boats {
  id: uuid
  display_name: text | null   -- shown as "Anonimoa" when null
  message: text                -- 1-200 chars, no links (enforced client + DB)
  drawing: jsonb                -- normalized stroke data, see boatTypes.ts
  created_at: timestamptz
}
```

No `status`/moderation column, no position/rotation/velocity columns --
every boat's on-screen position is computed deterministically in the
browser from its own `id` (see `boatHash.ts`) plus elapsed time, never
stored or synced.

## Drawing format

```ts
{
  version: 1,
  strokes: [
    { color: "#3a3530", size: 0.02, tool: "pen", points: [{ x: 0.12, y: 0.34 }, ...] }
  ]
}
```

Coordinates and `size` are normalized (0-1) to the drawing canvas itself,
independent of screen resolution. See `drawingUtils.ts` for the point-
distance sampling, stroke/point/byte-size caps, and the bounding-box
crop/center/scale step applied once when a drawing becomes a boat (never
while still being drawn).
