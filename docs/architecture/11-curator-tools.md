[← 목차](README.md)

## 11. 큐레이터 도구 · 매거진 · 저장된 일정

큐레이터(Creator)가 되면 프로필 하나로 두 종류의 콘텐츠를 만들 수 있다: **일정**(지금의 1차 콘텐츠)과 **매거진 칼럼**. 유저 쪽에서는 어떤 유저든(큐레이터가 아니어도) 일정을 저장할 수 있다. 셋 다 Supabase가 있으면 테이블에 쓰고, 없거나 실패하면 `localStorage`로 fail-soft한다 — 이 저장소 패턴은 커뮤니티([§6](06-detail-community-saved.md))와 동일하다.

### 1. 큐레이터 프로필 (`services/curator.ts`, `pages/CuratorSignupPage.tsx`/`CuratorEditPage.tsx`)

- `createCurator`/`updateCurator` — Supabase `creators` 테이블에 쓰고, 실패하거나 데모 세션이면 `local-creator-*` id로 `lib/localCuratorStore.ts`(`localStorage`)에 저장.
- `components/curator/CuratorProfileForm.tsx`가 등록(`/curator/signup`)과 수정(`/curator/:id/edit`) 양쪽에서 재사용된다.
- 데모 세션(`DEMO_USER`)은 로그인은 되지만 항상 로컬 저장 경로를 탄다 — Supabase에 데모 큐레이터가 쌓이지 않는다.

### 2. 큐레이터 일정 (`services/curator.ts`의 `*CuratorItinerary*`, `pages/CuratorListPage.tsx`)

큐레이터의 1차 콘텐츠 단위는 `Itinerary`(`source: 'curator'`)다. `/curator/:id/itineraries/:itineraryId`와 `/curator/:id/lists/:listId`는 같은 `CuratorListPage` 컴포넌트로 연결된다(둘 다 `resolvedId = itineraryId || listId`) — URL에 `lists`가 남아 있는 건 레거시 이름일 뿐, 실제로 여는 건 항상 일정이다.

- `createCuratorItinerary` — `createBlankItinerary()`(빈 Day 1 하나)로 시작해 Supabase `curator_itineraries`에 insert, 실패/데모/로컬 큐레이터면 `lib/localItineraryStore.ts`.
- 편집: `addSpotToDay`(`SpotSearchPicker`로 큐레이션 spot 검색해서 추가), `addEmptyDay`, `removeSpotFromItinerary` — 전부 [§4.2](04-matching.md#42-일정-생성-servicesitinerarygeneratets)와 같은 `services/itinerary/generate.ts` 함수를 재사용한다. 저장은 `updateCuratorItinerary`(로컬 + Supabase 동시 반영)를 통해.
- `deleteCuratorItinerary` — 로컬과 원격 양쪽에서 제거. `itn_seed_*`/`snap_*` id(마이그레이션 이전 시드나 저장 스냅샷)는 원격 삭제를 건너뛴다.
- `isOwner = session.creator?.id === id`일 때만 편집 UI(타이틀 수정, spot 추가/삭제, day 추가, 삭제)가 보인다. 남이 보면 읽기 전용.
- **Map 탭 노출**: `fetchCuratedMapData()`가 모든 큐레이터 일정(원격 + 로컬)을 훑어서 큐레이터당 대표 spot 하나를 `CreatorPick`으로 만들어 "Curated by Creators" 스트립에 올린다([§5](05-map.md)).

### 2.1 레거시 인프라 — `CuratorList`/`ListSpot`, `creator_picks`

`creator_lists`/`list_spots` 테이블과 `lib/localCuratorStore.ts`의 리스트 함수(`fetchCuratorLists`, `createList`, `addSpotToList` 등), `components/place/SpotSearchPicker.tsx`가 쓰는 다른 짝 `PlaceSearchPicker.tsx`(이건 죽은 코드, [§4.5](04-matching.md#45-지금은-죽은-코드--예전-매칭-엔진))는 여전히 코드에 있다. 지금 UI(`CuratorProfilePage`)는 이 리스트들을 직접 만들지 않고, 목 데이터(`mockCreatorPicks`)를 보여줄 때만 "All Picks"라는 이름의 합성 리스트 하나로 감싸서 재사용한다(`fetchCuratorLists`의 mock 분기). 더 오래된 `creator_picks` 테이블은 어떤 화면도 더 이상 쓰지 않아 `fetchAllCreatorPicks()`가 그 테이블과 `list_spots`를 나란히 조회해 합치는 코드만 남아 있다(`services/places.ts`).

### 3. 매거진 (`services/magazine.ts`)

- `fetchMagazineArticles` — Supabase `magazine_articles` + 로컬(`lib/localMagazineStore.ts`) + 시드(`data/magazine.ts`의 `mockMagazineArticles`)를 합쳐 최신순 정렬.
- `createMagazineArticle` — 로그인한 큐레이터만. `excerpt`(본문 첫 줄, 140자 컷)와 `minutes`(단어수/200, 최소 1분)를 서버에 안 보내고 클라이언트에서 계산해서 저장.
- `deleteMagazineArticle` — 본인 글만, `local-*`/mock 글은 로컬 스토어에서, 나머지는 Supabase에서 삭제.
- UI: `CommunityPage.tsx`의 Magazine 탭(`MagazineComposer`로 작성, `MagazineGrid`로 목록), `/magazine/:id` → `MagazineDetailPage.tsx`.

### 4. 저장된 일정 (`services/savedItineraries.ts`)

큐레이터 여부와 무관하게 로그인한 아무 유저나 일정을 저장할 수 있다(MIYEON이 생성한 내 일정이든 남의 큐레이터 일정이든).

- `fetchRemoteSavedItineraries`/`insertRemoteSavedItinerary`/`deleteRemoteSavedItinerary` — Supabase `saved_itineraries`(유저당 `unique(user_id, itinerary_id)`)에 스냅샷 JSON을 통째로 저장. 데모 세션(`DEMO_USER`)과 `mock-`로 시작하는 유저 id는 `isRemoteUser()`가 걸러서 원격 저장을 건너뛰고 `useSavedItineraries` 훅의 로컬 상태로만 유지한다.
- 저장·해제 UI는 `pages/ItineraryPage.tsx`(Save 버튼)와 `pages/ProfilePage.tsx`("Your trips" 목록, 카드마다 unsave 버튼)에 있다 — [§4.4](04-matching.md#44-저장-usesaveditineraries).
