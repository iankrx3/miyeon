[← 목차](README.md)

## 10. 의도적으로 빠져 있는 것

- 커뮤니티 팔로우 (글쓰기/좋아요/댓글/삭제는 있음)
- `WellnessTursmService` 실시간 연동 — 웰니스 핀은 지금도 mock `nearbyWellness`뿐
- 시술 마스터 DB — 라이브 Google/KTO 장소는 카테고리당 합성 Treatment 1개(디스커버리 엔진, [§3](03-discovery-engine.md)). `data/spots.ts`가 만드는 `Spot`도 `treatmentIds: []`라 상세 페이지에 시술 목록이 안 뜬다
- 정적 배포용 프록시 — `npm run dev` / `vite preview`에서는 `plugins/miyeon-api-proxy.ts`, Vercel 배포에서는 `api/**/*.ts`가 동작. 그 외 정적 호스팅에는 `/api/*`가 없음
- 실제 LLM 랭커 — 일정 엔진은 여전히 `services/itinerary/generate.ts`의 하드 필터 + 가중합 휴리스틱이다([§4.2](04-matching.md#42-일정-생성-servicesitinerarygeneratets))
- **일정 엔진이 큐레이션 필드를 흉내만 낸다** — Supabase `spots` 테이블은 삭제됐다. `data/spots.ts`는 이제 Google Places API + KTO Tour API 라이브 조회(`services/discovery.ts`)로 얻은 `Place`를 `Spot` 모양으로 변환해서 쓴다. `needleRequired`/`downtime`/`procedureIntensity`/`factoryLike`/`upsellingRisk`/`priceTransparency`/`experienceStyle` 같은 필드는 두 API 모두 제공하지 않으므로 "항상 통과"하는 고정값이고, `services/itinerary/generate.ts`도 더 이상 이 필드들로 하드 필터링·스코어링하지 않는다. `subcategory`/`parentCategory`도 실제 14종 세부 분류가 아니라 5개 `BeautyCategory`당 대표값 1개로 근사한 것이다.
- 큐레이터 리스트(`CuratorList`/`ListSpot`, `creator_lists`/`list_spots` 테이블, `SpotSearchPicker`) 인프라는 남아 있지만, 지금 큐레이터가 실제로 만드는 콘텐츠 단위는 리스트가 아니라 **일정(`Itinerary`, `curator_itineraries` 테이블)**이다. 두 시스템이 공존하는 이유와 레거시 `creator_picks` 테이블의 처지는 [§11](11-curator-tools.md)에 정리.
- **예전 Explore 매칭 엔진이 죽은 코드로 남아 있다** — `services/match.ts`, `components/explore/ResultCard.tsx`/`ProductCommerce.tsx`/`EmailCaptureCard.tsx`, `components/quiz/CategoryRadial.tsx`/`PairChoice.tsx`, `components/place/PlaceSearchPicker.tsx`는 어떤 라우트에서도 더 이상 import되지 않는다. Explore가 §4의 뷰티 트립 온보딩으로 바뀌면서 대체됐지만 지우거나 되살리는 결정은 아직 없다([§4.5](04-matching.md#45-지금은-죽은-코드--예전-매칭-엔진)).
- 앱 부트스트랩(`App.tsx`)이 모든 라우트 마운트 전에 `loadSpots()`를 await한다 — 예전에는 Supabase select 한 번이라 저렴했지만, 지금은 지역 4곳 × 카테고리 5개에 대해 Google/KTO 라이브 검색을 병렬로 쏘는 무거운 호출이다. 앱을 열 때마다 매번 이 비용을 내는 게 맞는지, 아니면 일정 생성/지도 진입 시점으로 지연 로딩을 옮길지는 별도 검토가 필요하다.

### 이제는 사실이 아닌 예전 기록 (참고용)

과거 이 문서·README는 "`creators`/`creator_picks`/`places`/`treatments` 테이블의 SQL 스키마 파일이 없다"고 적었지만, 지금은 `supabase/creators_schema.sql`(creators/creator_picks/creator_lists/list_spots), `supabase/itineraries_schema.sql`(curator_itineraries/saved_itineraries), `supabase/magazine_schema.sql`이 존재한다. `places` 테이블은 애초에 "한 번도 동기화 안 되는 캐시"였어서 스키마를 만드는 대신 **완전히 폐기**됐고, `spots` 테이블(Creatrip 스크레이핑 시드)도 일정 엔진이 Google/KTO 라이브 조회로 바뀌면서 함께 삭제됐다(`supabase/spots_schema.sql`/`seed_spots.sql`도 제거) — `creator_picks.place_id`/`list_spots.place_id`/`community_posts.place_id`는 전부 FK 없는 자유 텍스트다(각 스키마 파일의 주석 참고).

Map 탭의 카테고리 제한(hair/nails/makeup 숨김)도 더 이상 사실이 아니다 — `ENABLED_MAP_CATEGORIES`에 5개 카테고리가 모두 들어 있고, 큐레이션 카탈로그에 각 카테고리의 실제 spot이 있다([§5](05-map.md)).
