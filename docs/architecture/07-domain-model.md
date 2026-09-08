[← 목차](README.md)

## 7. 도메인 모델 (`src/types.ts`)

| 타입 | 의미 |
|---|---|
| `BeautyCategory` | skin, face, hair, nails, makeup |
| `QuizAnswers` | 예전 매칭 퀴즈용 타입 — [§4.5](04-matching.md#45-지금은-죽은-코드--예전-매칭-엔진)에서만 쓰이는 죽은 타입 |
| `BeautyTripProfile` | 지금의 Explore 온보딩 결과물 — purpose/goals/restrictions/budget/beautyTime/tripDays/downtime. `Itinerary.profileSnapshot`에 그대로 저장돼 replace/regenerate가 원래 제약을 유지하게 해준다 |
| `Spot` | 일정 엔진이 쓰는 큐레이션 장소(`src/data/spots.ts`). `parentCategory`/`subcategory`가 PRD §7의 taxonomy 그대로, `area`로 지역 클러스터링 |
| `Itinerary` / `ItineraryDay` / `ItineraryBlock` | 생성된 일정. day마다 `spot`/`travel`/`break` 블록의 시퀀스, `source: 'miyeon' \| 'curator'`로 MIYEON 생성 vs. 큐레이터 제작 구분 |
| `SavedItinerary` | 유저가 저장한 일정 1건 — `snapshot`에 그 시점의 `Itinerary` 전체를 통째로 담아, 원본 일정이 나중에 바뀌어도 저장 시점 모습을 유지 |
| `ReplacePreference` / `RegeneratePreference` | 일정 편집 시트의 옵션 id ([§4.3](04-matching.md#43-일정-편집)) |
| `Place` | 지도/상세 장소. `Spot`(큐레이션) 또는 Google/KTO 디스커버리 결과 어느 쪽에서 와도 같은 모양 — `medicalTourismMatch`, `nearbyWellness`, `source: 'google' \| 'kto' \| 'merged' \| 'mock'` |
| `Treatment` | 시술. `placeId`로 Place에 붙음 |
| `MatchResult` | 시술 + 장소 + 점수 + reasons — 예전 매칭 엔진(`services/match.ts`) 전용, 죽은 코드 |
| `UserSession` | 로그인 여부, user, optional creator |
| `MedicalTourismMatch` | KTO 인증 기관 배지용 |
| `WellnessSpot` | 근처 웰니스 핀 (현재 mock) |
| `Creator` | 큐레이터 프로필(bio, avatar, 소셜 링크, picks_count) |
| `CreatorPick` | 큐레이터가 고른 장소 1건 — 지금은 레거시 `creator_picks` 테이블 + `list_spots`에서 파생된 값으로 채워짐([§11](11-curator-tools.md)) |
| `CuratorList` / `ListSpot` | 큐레이터가 만드는 다중 장소 리스트 인프라(제목/설명/spot들) — 코드·스키마·훅은 남아 있지만 지금 UI는 큐레이터 콘텐츠로 리스트 대신 `Itinerary`를 만든다. [§10](10-known-gaps.md) |
| `MagazineArticle` | 큐레이터가 쓰는 TREATMENT/GUIDE/TREND 칼럼 |

매퍼: `lib/mappers.ts` (Supabase row → Place/Creator/CuratorList/ListSpot/MagazineArticle/Session).
