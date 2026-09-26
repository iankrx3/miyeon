[← 목차](README.md)

## 12. Glow Up V2 — 실제 장소 루틴 + 지도 + Creatrip 직접 예약

Figma "MIYEON V2 UX"를 구현한 흐름. §4의 옛 `BeautyTripProfile` 온보딩이 아니라 `ExplorePage`의 Glow Up 퀴즈(`data/glowUpQuiz.ts`)가 대상이다. 예전 "Day 1/2/3 × 카테고리 링크" 결과(`placement.ts`/`buildItinerary.ts`/`GlowUpCategoryList`)는 삭제됐고, 여행 기간이 카드 수를 제한하던 `planningDaysFor` 매핑도 함께 사라졌다.

### 12.1 흐름

| 단계 | 구현 |
|---|---|
| 퀴즈 전환 화면 2개 | `components/quiz/PinkTransition.tsx`. RESTORE 뒤 = `pickedInterlude()`, 예산·다운타임 뒤 = `constraintsInterlude()` (`data/glowUpQuiz.ts`). 실제 답변에서 카피·칩을 만들고, 반영할 답이 없으면 화면을 건너뛴다. 뒤로가기는 전환 화면을 거치지 않는다. |
| 생성 | `services/glowUp/generate.ts` `buildGlowUpItinerary()` → `services/glowUp/routines.ts` `buildRoutines()` (결정적, LLM 없음). `Itinerary.glowUpV2`에 루틴·제외 카테고리·믹스 프리셋 저장, `days`는 빈 배열. |
| 결과 | `GlowUpResultView`: 헤더 → `RoutineMap`(Leaflet, 루틴별 핀·경로) → 루틴 탭 → 스와이프 `RoutineCard` → "We left out" → `TryAnotherMix` → `EmailCaptureInline`. |
| 상세 | `/category/:subtype?place=<creatrip spot id>` — `CategoryDetailPage`가 장소 모드로 동작(`Book your Best Fit on Creatrip` = 그 장소의 상품 페이지, `See More Options` = 카테고리 필터 목록, `MIYEON CHECKED`). `place` 없이 열면 예전 카테고리 설명 페이지. |
| 예전 저장 플랜 | 퀴즈 답변만 있는 V1 Glow Up 플랜은 `ItineraryPage`가 열 때 한 번 V2로 다시 만든다(`upgradeLegacyItinerary`). |

### 12.2 장소 DB

- 원본: `creatrip_place_DB/{dermatology,hair_salon,k-beauty}/{creatrip spot id}.txt` (Creatrip 페이지 텍스트 덤프, 4개는 빈 파일). 파일명이 Creatrip spot id이고 예약 URL은 `https://creatrip.com/en/spot/{id}` + 제휴 파라미터(`services/places/glowUpPlaces.ts#creatripSpotUrl`).
- 정리: 폴더별로 `creatrip_place_DB/curated/*.json`(덤프에서 사실만 추출, 없으면 `null`) → `node scripts/build-places.mjs`가 id로 병합, 주소·이름으로 지오코딩(Google Places Text Search, `.env.local`의 `GOOGLE_PLACES_API_KEY`), 이름만으로 잡힌 좌표는 `coordApprox`로 표시 → `src/data/glowUpPlaces.json` + `supabase/seed_places.sql` + `creatrip_place_DB/build-report.md`.
- Supabase: `supabase/places_schema.sql`(places/place_products, RLS는 select만) 실행 후 `seed_places.sql`. 앱은 Supabase에 행이 있으면 그것을, 없거나 미설정이면 번들 JSON을 쓴다(`loadGlowUpPlaces`).
- 가격은 덤프가 KRW만 보여준 곳은 1,400원/USD로 환산한 근사값. 덤프 시점 스냅샷이므로 가격·영업시간·예약 가능 여부를 단정하지 않는다.

### 12.3 추천 규칙 (`routines.ts`)

1. 카테고리별 후보: 같은 도시, 좌표 있음. 언어가 **확인된 불일치**(Korean only 등)·예산 초과가 **확인된** 곳·"No downtime" 요청 시 downtime `mild/days`로 확인된 곳은 제외. 정보가 없는 항목은 통과시키되 `MIYEON CHECKED`에서 체크하지 않는다. skin/face는 클리닉(primary subtype)만.
2. 점수: 평점·리뷰 수·선호 지역·이미 고른 장소와의 거리·언어 확인·가격·다운타임·primary 여부. `Less Downtime` / `Closer to My Hotel` / `Lower Budget` / `More Iconic K-Beauty` 프리셋은 가중치만 바꾼다(숙소 위치는 묻지 않으므로 "Closer"는 선호 지역/이미 고른 장소 기준).
3. 루틴 묶기: skin/face → Skin Reset, CHANGE(personal-color → hair → makeup → permanent-makeup → nail → photo) → Style Session, RESTORE → Recovery. 3km 안에 회복 장소가 있으면 Skin Reset 끝에 붙는다("Skin, Then Exhale"). 개수는 선택과 후보에 따라 정해진다.
4. 제외: 후보 장소가 없는 카테고리(현재 DB에는 sauna/massage/yoga/permanent-makeup 장소가 없음)와, 1~3일 여행의 photo(스타일링 뒤 하루가 필요) → "We left out …". 후자만 `Add →`로 되돌릴 수 있고(`addBackCategory`), 전자는 필터 없는 카테고리 목록(`Browse →`)으로 보낸다.
5. `See another version`(`remixItinerary`)은 전체 루틴을 다시 계산하고 바뀐 장소를 한 줄로 설명한다(`describeChange`).
6. `MIYEON CHECKED`(`checksFor`): Your match · Trip-ready(지역) · language support · On budget — 장소 데이터가 확인해 주는 것만 체크.

### 12.4 알려진 한계

- 이메일 수집은 화면과 로컬 저장(`miyeon_beauty_card_requests`)까지만 — 실제 발송은 `services/beautyCard.ts`의 `TODO(email)` 그대로다.
- `BEST` 태그는 4개 체크 중 3개 이상 확인된 장소에만 붙는다.
- 소요 시간·다운타임은 장소별 실제 값이 있는 곳이 적어 카테고리 가이드(`data/categoryGuides.ts`)의 일반값으로 대체된다.
