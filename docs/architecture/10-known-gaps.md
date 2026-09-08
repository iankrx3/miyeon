[← 목차](README.md)

## 10. 의도적으로 빠져 있는 것

- 커뮤니티 팔로우 (글쓰기/좋아요/댓글/삭제는 있음)
- `WellnessTursmService` 실시간 연동 — 웰니스 핀은 지금도 mock `nearbyWellness`뿐
- 시술 마스터 DB — 라이브 Google/KTO 장소는 카테고리당 합성 Treatment 1개(디스커버리 엔진, [§3](03-discovery-engine.md)). 큐레이션 spot(`src/data/spots.ts`)은 아예 `treatmentIds: []`라 상세 페이지에 시술 목록이 안 뜬다
- 정적 배포용 프록시 — `npm run dev` / `vite preview`에서는 `plugins/miyeon-api-proxy.ts`, Vercel 배포에서는 `api/**/*.ts`가 동작. 그 외 정적 호스팅에는 `/api/*`가 없음
- 실제 LLM 랭커 — 일정 엔진은 여전히 `services/itinerary/generate.ts`의 하드 필터 + 가중합 휴리스틱이다([§4.2](04-matching.md#42-일정-생성-servicesitinerarygeneratets))
- **일정 엔진이 여전히 정적 시드만 읽는다** — `supabase/spots_schema.sql`이 `Spot` 타입 그대로 만드는 `spots` 테이블을 정의해 두었지만(코멘트에 명시), `services/itinerary/generate.ts`/`data/spots.ts`는 아직 그 테이블이 아니라 코드에 박힌 26개 큐레이션 spot 배열만 읽는다. 테이블에 실제 데이터를 채우고 `getSpot()`/`getSpots()`를 Supabase 조회로 바꾸는 건 별도 작업.
- 큐레이터 리스트(`CuratorList`/`ListSpot`, `creator_lists`/`list_spots` 테이블, `SpotSearchPicker`) 인프라는 남아 있지만, 지금 큐레이터가 실제로 만드는 콘텐츠 단위는 리스트가 아니라 **일정(`Itinerary`, `curator_itineraries` 테이블)**이다. 두 시스템이 공존하는 이유와 레거시 `creator_picks` 테이블의 처지는 [§11](11-curator-tools.md)에 정리.
- **예전 Explore 매칭 엔진이 죽은 코드로 남아 있다** — `services/match.ts`, `components/explore/ResultCard.tsx`/`ProductCommerce.tsx`/`EmailCaptureCard.tsx`, `components/quiz/CategoryRadial.tsx`/`PairChoice.tsx`, `components/place/PlaceSearchPicker.tsx`는 어떤 라우트에서도 더 이상 import되지 않는다. Explore가 §4의 뷰티 트립 온보딩으로 바뀌면서 대체됐지만 지우거나 되살리는 결정은 아직 없다([§4.5](04-matching.md#45-지금은-죽은-코드--예전-매칭-엔진)).
- Creatrip 장소 마스터 DB — `src/data/spots.ts`가 지금 두 가지 역할을 겸한다: (1) Creatrip 큐레이션 시드, (2) 일정 엔진의 유일한 장소 카탈로그. Google/KTO 디스커버리는 Place/Treatment 상세 조회와 Map 검색창의 오버레이로만 남는다([§3.6](03-discovery-engine.md#36-지금-이-엔진을-실제로-쓰는-화면)).

### 이제는 사실이 아닌 예전 기록 (참고용)

과거 이 문서·README는 "`creators`/`creator_picks`/`places`/`treatments` 테이블의 SQL 스키마 파일이 없다"고 적었지만, 지금은 `supabase/creators_schema.sql`(creators/creator_picks/creator_lists/list_spots), `supabase/itineraries_schema.sql`(curator_itineraries/saved_itineraries), `supabase/magazine_schema.sql`, `supabase/spots_schema.sql`이 전부 존재한다. `places` 테이블은 애초에 "한 번도 동기화 안 되는 캐시"였어서 스키마를 만드는 대신 **완전히 폐기**됐다 — `creator_picks.place_id`/`list_spots.place_id`/`community_posts.place_id`는 전부 FK 없는 자유 텍스트다(각 스키마 파일의 주석 참고).

Map 탭의 카테고리 제한(hair/nails/makeup 숨김)도 더 이상 사실이 아니다 — `ENABLED_MAP_CATEGORIES`에 5개 카테고리가 모두 들어 있고, 큐레이션 카탈로그에 각 카테고리의 실제 spot이 있다([§5](05-map.md)).
