# Miyeon (미연)

AI Korean Beauty Discovery & Booking Platform — Core UX per the MIYEON product spec
(Explore → Personalize → SNIFF → AI Match → Book / Shop). Map and Google login were
originally ported from an external "Sniffood" map+login starter kit (referenced during
initial porting; not part of this repository).

## Stack

Vite + React + TypeScript + Tailwind + React Router. Supabase (auth + data) and
Leaflet/MapTiler (map). Chosen over the PRD's Next.js listing (§13) to reuse the
original starter kit's Vite-specific auth/map code directly instead of rewriting
it for the App Router.

레이어별 기능 설명: [`docs/architecture/`](docs/architecture/README.md).

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — the app runs fully on demo data without this
npm run dev
```

Without `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, Google OAuth is skipped and
**Continue as demo** still signs you in locally (stored in `localStorage`). Every
data call falls back to `src/data/mock.ts` unless the place-discovery keys below
are set. Without `VITE_MAPTILER_API_KEY`, the map uses the free Carto Voyager
basemap instead of MapTiler.

### Live place discovery (optional)

Add these **server-only** keys to `.env.local` (no `VITE_` prefix — the Vite
proxy injects them so they never reach the browser):

```
KTO_SERVICE_KEY=          # data.go.kr, service MdclTursmService (의료관광정보)
GOOGLE_PLACES_API_KEY=    # Google Cloud Places API (New)
GEMINI_API_KEY=           # Google AI Studio / Gemini API — optional, powers "Get latest info"
```

- KTO key: [한국관광공사_의료관광정보](https://www.data.go.kr/data/15143913/openapi.do) → 활용신청. Use the Decoding or Encoding key; the proxy normalises either.
- Google key: enable **Places API (New)** on a Cloud project. Restrict it to `localhost` HTTP referrers for local work.
- Gemini key: from [Google AI Studio](https://aistudio.google.com/apikey). Place detail keeps Google Places + KTO as its data source; Gemini is only called on demand (the "Get latest info" button, `src/components/place/GroundedInfo.tsx`) with the Google Search grounding tool enabled, to surface things Places/KTO don't carry (hours changes, closures, recent notes). Without this key the button is hidden — fail-silent, like the KTO badges.

`src/services/discovery.ts` maps each beauty category to Google Place types and,
for `skin` / `face`, overlays KTO-certified medical-tourism orgs (badge +
languages). Hair / nails / makeup are Google-primary. If a key is missing or a
call fails, the app keeps serving mock data. KTO responses must be attributed
`자료: 한국관광공사` (already on the medical/wellness badges). Development
quota on data.go.kr is 1,000 calls/day — results are cached for 10 minutes.

## What's implemented

Explore (`/`) is a **beauty trip planner**, not a "quiz → 3 matches" screen anymore — it
follows the onboarding spec in `MIYEON_planner.md` end to end (Purpose → Goals →
conditional Skin/Needles → Restrictions → Budget → Time → Days → Downtime → Profile
summary → AI transition), then generates a day-by-day itinerary and hands you off to
it. The old category/quiz/match screen this replaced is still in the tree as dead code
(see "Known gaps" below) but is no longer reachable from any route.

- **Beauty trip onboarding → itinerary generation** (`src/pages/ExplorePage.tsx`,
  `src/services/itinerary/generate.ts`) — a multi-step wizard (`src/components/onboarding/`)
  builds a `BeautyTripProfile`, then a hard-filter → weighted-scoring → geographic-clustering
  → walking-order pipeline (PRD §14–§16) turns it into an `Itinerary` over
  `src/data/spots.ts`, a hand-curated catalog of 26 Seoul spots — **not** the
  Google/KTO discovery engine. Each spot block gets a one-line "why we chose this".
- **Itinerary workspace** (`src/pages/ItineraryPage.tsx`,
  `src/components/itinerary/ItineraryTimeline.tsx` / `ItineraryRouteMap.tsx`) — day
  tabs, a route map, and per-spot Replace / Move to another day / Remove, plus a
  top-level Regenerate (cheaper, less travel, more/fewer experiences, more Korean,
  more relaxing, start later, finish earlier) — all pure functions in
  `services/itinerary/generate.ts` that preserve the original profile's constraints.
- **Save an itinerary** (`src/hooks/useSavedItineraries.ts`,
  `src/services/savedItineraries.ts`) — works for any signed-in user (not just
  curators), always written to `localStorage`, and mirrored to Supabase
  `saved_itineraries` when configured. Saved trips show up on `/profile`.
- **Map** (`src/pages/MapPage.tsx`, `src/components/map/MapView.tsx`) — pins now come
  from `services/curator.ts#fetchCuratedMapData()`, i.e. the same curated
  `src/data/spots.ts` catalog plus every curator's published itineraries, **not**
  live Google/KTO discovery. All five categories (skin/face/hair/nails/makeup) are
  enabled (`src/data/mapCategories.ts`) since the curated catalog now covers all of
  them. The search box still layers in a live, debounced Google Places text search
  (`services/discovery.ts#searchPlacesByCategory`) so typing a real business name
  finds it even if it isn't in the curated set. `?curator=`/`?itinerary=` query
  params deep-link the map into one curator's or one itinerary's spots. A map/list
  toggle (bottom-left) switches to `components/map/PlaceListView.tsx`.
- **Login** (`src/hooks/useAuth.ts`, `src/services/auth.ts`,
  `src/components/auth/GoogleAuthModal.tsx`) — Google OAuth when Supabase is
  configured, plus a local **Continue as demo** session that does not need keys.
- **Place discovery** (`src/services/discovery.ts`) — category engine over
  Google Places API (New) + KTO `MdclTursmService`. Vite proxy in
  `plugins/miyeon-api-proxy.ts` hides the keys and avoids browser CORS. It no longer
  drives the Map's default pins; it now backs Place/Treatment detail lookups that
  fall through the curated catalog, and the Map search box above.
- **Place / Treatment detail** — Nearby Wellness and Medical Info KTO badges
  (§7.2/§7.3), fail-silent when their data is absent. Get-directions links to
  Google/Naver/Kakao Maps (`src/lib/directions.ts`), and an opt-in "Get latest
  info" lookup backed by Gemini + Google Search grounding
  (`src/components/place/GroundedInfo.tsx`) for anything Places/KTO don't cover.
  A "Back to itinerary" link appears when you arrived from `/itinerary/:id`.
- **Creatrip affiliate links** (`src/lib/creatrip.ts`) — Book-with-Creatrip CTAs
  (`PlaceDetailPage`, `TreatmentDetailPage`) are tagged with the Creatrip affiliate
  ID (`utm_source`/`aff_id` query params) and show a short commission-disclosure
  caption underneath, per Creatrip's affiliate policy. `hasCreatripListing()` tells
  apart a place with a real, spot-specific Creatrip page from one still pointing at
  the generic homepage; only the former is labeled "광고" (ad) — with one shown as a
  featured "광고 · 추천" pick — in the Map list view. `scripts/resolve-creatrip-links.mjs`
  (`npm run resolve:creatrip`) is a one-off, read-only tool that asks Gemini
  (Google Search grounding) to find each demo place's real Creatrip page and
  reports whether the answer is corroborated by an actual search result —
  verified results are applied to `src/data/mock.ts` by hand, never
  auto-written.
- **Curator tools** (`src/services/curator.ts`) — sign up / edit a curator profile
  (`/curator/signup`, `/curator/:id/edit`); create, edit (add spot/day, rename,
  delete), and publish **itineraries** as a curator's primary content
  (`/curator/:id/itineraries/:itineraryId`), backed by Supabase `curator_itineraries`
  with a `localStorage` fallback. `/curator/:id` shows a curator's bio, socials, and
  the itineraries they've published, reached by tapping their avatar in the Map
  tab's "Curated by Creators" strip. Older list infrastructure
  (`CuratorList`/`ListSpot`, `creator_lists`/`list_spots`) still exists in the code
  and schema but isn't what curators build with day to day anymore — see "Known
  gaps".
- **Magazine** (`src/services/magazine.ts`, Community tab's "Magazine" sub-tab,
  `/magazine/:id`) — curator-authored TREATMENT/GUIDE/TREND columns, backed by
  Supabase `magazine_articles` with a `localStorage` + seeded-article fallback.
- **Community** (`src/services/community.ts`) — read/write feed backed by
  Supabase when configured, falling back to `localStorage` otherwise: create
  post, like/unlike, comment, and delete your own post/comment. Follow is not
  built.
- **My Map** (`src/hooks/useSavedPlaces.ts`) — save/unsave individual places,
  stored in `localStorage` for now (no `saved_places` table yet). Separate from
  saving whole itineraries, above.
- **Mobile bottom nav** (`src/components/layout/BottomNav.tsx`) — below the `sm`
  breakpoint, the top tab bar (`NavHeader`) hides and a thumb-reachable bottom
  tab bar takes over; desktop keeps the top nav.
- Brand design tokens (Soft Cocoa / Dusty Rose / Soft Blush / Warm Beige / White) and
Satoshi / Pretendard typography, from the Miyeon brand board.

## Known gaps vs. the PRD

- Community **follow** is not built (post/like/comment/delete all are).
- The itinerary engine still reads a static, hand-written array
  (`src/data/spots.ts`, 26 spots) instead of live data. `supabase/spots_schema.sql`
  already defines a `spots` table that mirrors the `Spot` type column-for-column,
  but nothing writes to it yet and `getSpot()`/`getSpots()` don't read from it —
  wiring that up is a separate follow-up.
- Curated spots have no real `Treatment` rows (`treatmentIds: []`), so Place
  detail's Treatments list is empty for curated spots; it's only populated for
  live Google/KTO places, which get one synthetic Treatment per category.
- Nearby Wellness (`WellnessTursmService`) is still mock-only; medical-tourism
  badges on live `skin`/`face` places come from `MdclTursmService`.
- No nightly batch job. Discovery is on-demand with a 10-minute in-memory cache.
  The API proxy only runs under `vite` / `vite preview`, not on a static host.
- No real LLM ranker yet — itinerary generation in `services/itinerary/generate.ts`
  is a transparent hard-filter + weighted-scoring heuristic, per PRD §13's
  "structured pipeline, not an LLM prompt" requirement.
- **The pre-planner Explore flow is dead code, not deleted.** `services/match.ts`,
  `components/explore/ResultCard.tsx`/`ProductCommerce.tsx`/`EmailCaptureCard.tsx`,
  `components/quiz/CategoryRadial.tsx`/`PairChoice.tsx`, and
  `components/place/PlaceSearchPicker.tsx` implemented the old "category → quiz →
  top 3 matches" screen. None of them are imported from any route anymore; whether
  to delete or revive them hasn't been decided.
- `CuratorList`/`ListSpot` (the `creator_lists`/`list_spots` tables and
  `SpotSearchPicker`) are still wired up, but curators now build itineraries, not
  standalone lists — this infra is mostly legacy at this point. The even older
  `creator_picks` table (and the `places` table it used to join against) is fully
  superseded; `places` was dropped entirely rather than getting a schema, per the
  comments in `supabase/creators_schema.sql`.

See [`docs/architecture/`](docs/architecture/README.md) for the full breakdown,
including the current state of each subsystem and everything that's now dead code.
