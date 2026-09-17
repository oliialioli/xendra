# Community message-boats

Visitors write a message, draw their own paper boat freehand (no template --
see BoatDrawingCanvas), and send it off to sail the river loop around the
island. Anyone can click a boat to read its message. See `src/features/boats/`
for the implementation and each file's own doc comment for how the pieces
fit together.

## Landmark

The dock reuses the old `fronton`/notes landmark's exact spot and interaction
radius (see `types/content.ts`'s `dockMessages` doc comment) -- lower-right
of the island, below/right of the music school, near the lower-right
riverbank, upstream-left of the small waterfall. Its real artwork is a small
house (`LANDMARK_ASSET_OVERRIDES.dockMessages` in `mapGeometry.ts`, using
`public/assets/landmarks/casa_rio.png`); the discovery badge still shows a
provisional pencil icon (`landmarkIndicatorConfig.tsx`) until a definitive
one exists.

## Supabase setup

1. Create a Supabase project (or use an existing one).
2. Run `supabase/migrations/0001_boats.sql` against it -- paste it into the
   SQL editor, or `supabase db push` if you use the CLI. This creates the
   `boats` table, its RLS policies (public read + public insert, no public
   update/delete), and enables realtime for it.
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
| Where the launch animation hands off to the river loop | `content/dockConfig.ts` | `dockConfig.riverEntryPoint` (keep it geometrically on the path -- see `boatPathConfig.launchProgress`) |
| The river route itself | `content/boatPathConfig.ts` | `RIVER_PATH_MARGIN` (how far out from the coastline) -- the `path`/`RIVER_PATH_POLYGON` are derived automatically, never hand-edit them |
| Parallel lanes | `content/boatPathConfig.ts` | `boatPathConfig.lanes` (perpendicular world-unit offsets) |
| Boat size | `features/boats/BoatFleet.tsx` | `BOAT_WORLD_SIZE` |
| Boat speed | `features/boats/boatHash.ts` | `BASE_SPEED` / `SPEED_VARIATION` |
| Floating bob | `features/boats/BoatFleet.tsx` | `FLOAT_AMPLITUDE_PX` / `FLOAT_SPEED` |
| Bridge under-crossings (hide/fade a boat) | `content/boatPathConfig.ts` | `boatPathConfig.occlusionSegments` (only the waterfall's own rock cluster today -- the two real bridges are still empty, see below) |
| House landmark (Mensajes/Mezuak) position/size | `content/mapGeometry.ts` | position: `dockConfig.xPercent`/`yPercent` (shared with the landmark hotspot below); size: `HOUSE_WIDTH_PERCENT` |
| Waterfall art position/scale/rotation | `content/dockConfig.ts` | `waterfallConfig.x`/`y`/`scale`/`rotation`/`anchorX`/`anchorY` |
| Waterfall boat effect (tilt/speed/drop/splash) | `content/dockConfig.ts` | `waterfallConfig.tilt`/`speedMultiplier`/`dropDistance`/`splashEnabled`, over `segmentStart`/`segmentEnd` |

## Needs a visual pass once real assets/art exist

- **`boatPathConfig.occlusionSegments`**'s two real bridges aren't at a
  known progress range yet -- use the map's own debug overlay (press `D`
  in-game) as a starting point for where the path crosses a bridge deck,
  then add `{ start, end }` progress entries (0-1) here (the existing
  waterfall entry is a good template).
- **`waterfallConfig`**: the house (landmark artwork, `LANDMARK_ASSET_OVERRIDES.dockMessages`
  in `mapGeometry.ts`) and the waterfall (`content/landmarks/cascada.png`,
  placed via `waterfallConfig`) are both live, positioned and verified
  against the actual river art on `xendra-map-base-v7-4k.png` (not guessed
  from a reference image -- see `waterfallConfig`'s own comment in
  `dockConfig.ts` for how `x`/`y` were derived). If the base map or either
  asset ever changes, re-verify position/scale/`segmentStart`/`segmentEnd`
  against the live map (debug overlay, `D`) rather than adjusting blind.
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
