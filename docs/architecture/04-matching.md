[← 목차](README.md)

## 4. 뷰티 트립 플래너 (Explore → Itinerary)

Explore 탭(`/`)은 더 이상 "카테고리 → 퀴즈 → Top 3 장소" 매칭 화면이 아니다. `MIYEON_planner.md`의 온보딩 스펙 그대로, 여러 단계 질문으로 `BeautyTripProfile`을 채운 뒤 day-by-day `Itinerary`를 생성해 `/itinerary/:id`로 이동하는 온보딩 위저드다.

| 레이어 | 파일 | 기능 |
|---|---|---|
| UI | `pages/ExplorePage.tsx` | Home landing → Purpose → Goals → (조건부 Skin/Needles/바이브 스텝들) → Restrictions → Languages → Budget → Time → Days → Downtime → Profile 요약 → AI transition |
| 위젯 | `components/onboarding/WizardShell.tsx`, `OptionCard.tsx`, `components/quiz/AITransition.tsx` | 진행률 있는 1문항 화면, 선택 카드, 로딩 전환 |
| 온보딩 카피/옵션 | `data/quiz.ts` | purpose/goal/restriction/budget/time/downtime 옵션과 라벨, goal별 바이브 옵션(`hairVibeOptions` 등), `languageOptions`, replace/regenerate 옵션 |
| 도메인 타입 | `types.ts`의 `BeautyTripProfile`, `Itinerary`, `ItineraryDay`, `ItineraryBlock` | §4의 UX 스펙(§8~§12)을 그대로 반영 |
| 일정 생성 엔진 | `services/itinerary/generate.ts` | 하드 필터 → 스코어링 → 지역 클러스터링 → 도보순서 → 타임라인 조립 |
| 이동시간 | `services/itinerary/travel.ts` | 두 spot 사이 이동수단/시간 추정(도보 우선, 거리 기반) |
| 일정 워크스페이스 | `pages/ItineraryPage.tsx`, `components/itinerary/ItineraryTimeline.tsx`, `ItineraryRouteMap.tsx` | 일별 타임라인 · 지도 · Replace/Move/Remove/Regenerate |
| 저장 | `hooks/useSavedItineraries.ts`, `lib/localItineraryStore.ts`, `services/savedItineraries.ts` | 생성된 일정을 `localStorage`(항상) + 로그인 시 Supabase `saved_itineraries`에도 저장 |

### 4.1 온보딩 흐름

`ExplorePage.tsx`는 `profile.goals`/`skinExperience`에 따라 스텝 배열(`flow`)을 동적으로 계산한다 — PRD §6의 conditional-questions 로직 그대로:

```
purpose → goals → (goals에 skin 포함 시) skin → (skin === 'medical' 시) needles
        → (goals에 hair/face/makeup-style/details 포함 시 각각) hairVibe/faceVibe/makeupStyleVibe/detailsVibe
        → restrictions → languages → budget → time → days → downtime → profile
```

`hairVibe`/`faceVibe`/`makeupStyleVibe`/`detailsVibe`는 "Color & Perm vs Head Spa 중 골라주세요" 같은 직접적인 서비스 목록이 아니라 `data/quiz.ts`의 감성적인 문구(예: "Deep-conditioning head spa") 선택지로 물어서 `profile.subcategoryVibe[goal]`에 실제 `SpotSubcategory`를 저장한다 — Creatrip 버튼(§4.2 하단)이 어떤 세부 카테고리를 가리킬지 정하는 데만 쓰이고, spot 후보 필터링에는 안 쓰인다. `skin` 목표는 이미 있는 `skinExperience` 답변을 재사용해 파생하므로 별도 스텝이 없다. `languages` 스텝은 Creatrip이 지원하는 4개 언어(중국어/일본어/태국어/베트남어) 중 필요한 걸 골라 `profile.languageNeeds`에 저장 — Creatrip `theme` 필터로 연결된다.

`profile` 스텝에서 "Build my itinerary →"를 누르면 `AITransition` 로딩 화면을 거쳐 `generateItinerary(profile)`을 호출하고, 결과를 `upsertItinerary()`로 `localStorage`에 저장한 뒤 `/itinerary/:id`로 이동한다.

### 4.2 일정 생성 (`services/itinerary/generate.ts`)

카탈로그는 `src/data/spots.ts`의 `getSpots()` — Google Places API + KTO Tour API 라이브 조회 결과를 `Spot` 모양으로 근사한 것이다([§3.6](03-discovery-engine.md#36-dataspotsts--이-엔진-위에-얹힌-일정-후보-카탈로그), [§10](10-known-gaps.md) 참고). needleRequired/downtime/procedureIntensity/factoryLike/upsellingRisk/priceTransparency/experienceStyle는 두 API 모두 못 주는 값이라 항상 "통과" 고정값이고, 이 필드들에 기대던 하드 필터·스코어링은 제거됐다.

1. **하드 필터** (`passesHardFilter`) — 커뮤니케이션(영어) 제약, 예산 상한, goals → subcategory 매핑(`GOAL_SUBCATS`, 실제로는 5개 `BeautyCategory` 대표값 1개씩이라 카테고리 단위로 동작)으로 걸러낸다. 후보가 3개 미만이면 `dont-know` 취급으로 한 번 더 완화해서 재시도.
2. **소프트 스코어링** (`scoreSpot`) — Personal fit 0.3 · Location 0.2 · Price 0.15 · Category 0.15 · Quality(rating) 0.2. `korean-experience` 목적은 KTO 소스(`spot.source === 'kto'`, 한국관광공사 공식 등록 정보) 여부로 가점.
3. **지역 클러스터링** — spot을 `area`(Gangnam/Seongsu/Hongdae/Myeongdong — 좌표 최단거리로 버킷팅, `data/spots.ts#nearestArea`)별로 묶고 area당 상위 점수 합으로 순위를 매긴 뒤, `tripDays`/`beautyTime`에서 뽑은 일수만큼 area를 하루씩 배정한다(§16).
4. **일자 조립** (`buildDay`) — 같은 area 안에서 최근접 이웃 방식(`orderByWalk`)으로 도보 순서를 잡고, `travelBetween()`으로 이동 블록을, 시술 180분 누적마다 점심 브레이크 블록을 끼워 넣는다.
5. 각 spot 블록에는 `whyFor()`가 만든 한 줄 이유(§19 "Why we chose this")가 붙는다.

`ItineraryTimeline.tsx`의 각 spot 카드에는 "Book with Creatrip →" 링크도 붙는다(`lib/creatrip.ts#buildCreatripListUrl`) — `generate.ts#creatripSubcategoryFor(spot, profile)`가 그 spot이 속한 goal의 `subcategoryVibe` 답변(없으면 spot 자체의 대표 subcategory)으로 타깃 카테고리를 정하고, `creatripThemesForProfile(profile)`이 `languageNeeds`/`budget`/일부 `restrictions`(no-surprise-costs → affordable price, no-upsell·no-factory → excellent service)로 `theme` 쿼리를 더한다. 이 매핑은 spot 선택(하드 필터·스코어링)과는 완전히 별개다 — 후보 자체는 여전히 5-way `BeautyCategory` 수준에서만 걸러진다.

### 4.3 일정 편집

`ItineraryPage.tsx`의 스팟 메뉴(⋯)와 상단 Regenerate 버튼이 PRD §21~§23을 구현한다 — 전부 `services/itinerary/generate.ts`의 순수 함수:

- **Replace** (`replaceSpotInItinerary`) — cheaper/closer/relaxing/korean/higher-rated/different-category 중 하나를 고르면, 같은 프로필 제약을 유지한 채 그 날의 나머지 spot과 안 겹치는 대체 spot을 골라 그 날을 재조립.
- **Move to another day** (`moveSpotToDay`) — 원래 날에서 빼고 대상 날에 추가한 뒤 두 날 다 재조립.
- **Remove** (`removeSpotFromItinerary`) — 그 spot만 빼고 재조립. 그 날이 비면 날짜 자체를 지우고 나머지 날짜 인덱스를 당긴다.
- **Regenerate** (`regenerateItinerary`) — cheaper/less-travel(한 지역으로 압축)/more-experiences·more-packed(스팟 +1)/more-korean/more-relaxing/start-later/finish-earlier 프리퍼런스를 `GenerateOpts`로 바꿔 프로필로 처음부터 재생성하되 id/생성일은 유지.

`canEdit`은 `itinerary.source === 'miyeon'`(방금 생성한 내 일정)이거나 로그인한 큐레이터 본인 소유일 때만 true — 다른 사람이 저장한 일정이나 남의 큐레이터 일정은 읽기 전용으로 열린다.

### 4.4 저장 (`useSavedItineraries`)

Save 버튼은 로그인 없이도 누를 수 있게 UI엔 노출되지만 실제로는 로그인을 요구한다(`onSignIn()` 폴백). 저장된 항목은 `/profile`(ProfilePage, "Your trips")에서 다시 열 수 있고, 로그인 사용자는 Supabase `saved_itineraries`(스냅샷 JSON 컬럼)에도 동기화된다 — 자세한 저장 계층은 [§11](11-curator-tools.md#4-저장된-일정-servicessaveditinerariests) 참고.

### 4.5 지금은 죽은 코드 — 예전 매칭 엔진

아래 파일들은 이전 "카테고리 → 퀴즈 → Top 3 매칭" Explore 화면의 잔재로, 지금은 **어떤 라우트에서도 import되지 않는다**(자기 자신의 정의 파일 밖에서 참조가 없음):

- `services/match.ts` (`getMatches`, Concern/Result/Downtime/Budget/Timing/Location/Foreigner/Vibe 가중합 스코어러)
- `components/explore/ResultCard.tsx`, `ProductCommerce.tsx`, `EmailCaptureCard.tsx`
- `components/quiz/CategoryRadial.tsx`, `PairChoice.tsx`
- `components/place/PlaceSearchPicker.tsx`

지우거나 되살리는 결정은 아직 안 내려졌다 — [§10](10-known-gaps.md) 참고.
