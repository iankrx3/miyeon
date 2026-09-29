[← 목차](README.md)

## 12. Glow Up V2 — 실제 장소 루틴 + 지도 + Creatrip 직접 예약

Figma "MIYEON V2 UX"를 구현한 흐름. §4의 옛 `BeautyTripProfile` 온보딩이 아니라 `ExplorePage`의 Glow Up 퀴즈(`data/glowUpQuiz.ts`)가 대상이다. 예전 "Day 1/2/3 × 카테고리 링크" 결과(`placement.ts`/`buildItinerary.ts`/`GlowUpCategoryList`)는 삭제됐고, 여행 기간이 카드 수를 제한하던 `planningDaysFor` 매핑도 함께 사라졌다.

### 12.1 흐름

| 단계 | 구현 |
|---|---|
| 퀴즈 전환 화면 2개 | `components/quiz/PinkTransition.tsx`. RESTORE 뒤 = `pickedInterlude()`, 예산·다운타임 뒤 = `constraintsInterlude()` (`data/glowUpQuiz.ts`). 실제 답변에서 카피·칩을 만들고, 반영할 답이 없으면 화면을 건너뛴다. 뒤로가기는 전환 화면을 거치지 않는다. |
| 생성 | `services/glowUp/generate.ts` `buildGlowUpItinerary()` → `services/glowUp/routines.ts` `buildRoutines()` (결정적, LLM 없음). `Itinerary.glowUpV2`(`version: 3`)에 루틴·믹스 프리셋·앵커 지역 저장, `days`는 빈 배열. |
| 결과 | Figma "V2.2 RESULT". `GlowUpResultView`: 헤더(+ 지역 미선택 시 "We based you in …") → `RoutineMap`(Leaflet, 선택한 시점의 루틴 핀·경로 강조) → **시점 칩**(First days / Mid-trip / Last days / Any night, 있는 시점만) → 칩별 패널을 스와이프, 패널 안에는 그 시점 루틴 카드를 세로로 나열 → `TryAnotherMix` → `EmailCaptureInline`. `RoutineCard` = 단계 배지 → 루틴명 → 한 줄 약속 → 구성 → 시간·시간대 → 안내·지역 → 번호 스톱(스톱별 순서 팁). |
| 상세 | Figma "V2.1 DETAIL". `/category/:subtype?place=<creatrip spot id>` — `CategoryDetailPage`가 장소 모드로 동작: 히어로 "장소명 · 지역", 키 팩트(분 · 가격 approx. · `booked_count`+ booked, 없으면 리뷰 수), `Book your Best Fit on Creatrip` = 그 장소의 상품 페이지, `See N+ More Options` = 같은 필터를 통과한 다른 장소 수 + 카테고리 목록, `MIYEON CHECKED`. `place` 없이 열면 예전 카테고리 설명 페이지. |
| 예전 저장 플랜 | 퀴즈 답변만 있는 V1 플랜과 `glowUpV2.version !== 3`인 예전 V2 플랜은 `ItineraryPage`가 열 때 한 번 다시 만든다(`upgradeLegacyItinerary`). |

### 12.2 장소 DB

- 원본: 루트의 `places.csv` (creatrip_place_DB 스크래퍼 출력, 188곳). `id`가 Creatrip spot id이고 예약 URL은 `https://creatrip.com/en/spot/{id}` + 제휴 파라미터(`services/places/glowUpPlaces.ts#creatripSpotUrl`).
- 빌드: `node scripts/build-places.mjs [csv 경로]` → CSV 컬럼을 그대로 타입만 바꿔 `supabase/seed_places.sql` + `src/data/glowUpPlaces.json`(같은 행 모양).
- Supabase: `supabase/places_schema.sql`(`places` 한 테이블, CSV 컬럼 1:1, RLS는 select만) 실행 후 `seed_places.sql`. 앱은 Supabase에 행이 있으면 그것을, 없거나 미설정이면 번들 JSON을 쓴다(`loadGlowUpPlaces`).
- 선택 컬럼 `booked_count`("More than N Global travelers have booked", 스냅샷)·`captured_at`(캡처일)은 CSV에 있으면 읽고, 없으면 null. 현재 CSV엔 둘 다 없다.
- 행 → `GlowUpPlace` 변환은 `glowUpPlaces.ts#fromRow`: subtype 매핑(dermatology는 `fix_targets`로 skin/face), 지역명 → 앱 지역 8곳(그 외 `null`), Seoul/Busan 이외 도시와 `active = false`는 제외, `languages`는 `listed`만. 옵션별 상품(products)은 CSV에 없어 빈 배열.
- 스크랩 시점 스냅샷이므로 가격·영업시간·예약 가능 여부를 단정하지 않는다.

### 12.3 추천 규칙

**장소 — `services/glowUp/scoring.ts`** (필터 → 점수 → 루틴 단위 조합 → 동점 처리, 무작위 없음)

1. 필터(`eligible`): 카테고리(skin/face는 클리닉만)·같은 도시·좌표·예약 링크. 언어는 영어 기본(확인된 불일치만 제외), 영어 외 언어를 고르면 그 언어가 `listed`인 곳만 — 도시 전체에 0곳이면 언어 조건만 푼다. 지역은 1차 = 선택 지역 안, 0곳이면 2차 = 도시 전체(`inAreaFirst`). **다운타임·예산은 필터가 아니다.**
2. 점수(`scorePlace`, 0–100): 품질 25(베이지안 보정 별점, C·m = 카테고리 평균 별점·리뷰 수 중앙값) · 외국인 수요 25(`log(booked)+log(reviews)`의 카테고리 내 백분위) · 위치 20(지역 안 20, 밖이면 추정 이동시간 10분 17 / 20분 12 / 40분 미만 6 / 그 이상 0) · 데이터 신뢰도 10(핵심 필드·`missing_fields`·90일 내 캡처) · 예산 5(안 5 / 초과 0 / 가격 없음 3). 스펙의 현지 신뢰 15점(Google Places)은 빠져 있어 85점을 100으로 환산한다. `Try another mix` 프리셋은 배점만 바꾼다(`pointsFor`).
3. 루틴 단위 조합(`bestCombination`): 슬롯별 상위 5곳의 모든 조합 → 평균 점수 − 이동 추정 분 × 0.25 최고 조합. 한 장소가 두 슬롯을 제공하면 재사용(찜질방 사우나+스크럽).
4. 동점: 점수 → 데이터 신뢰도 → 최근 캡처일 → 장소 id(수수료 데이터 없음).
5. 지역 미선택("Not sure yet"): 지역별 "고른 모든 카테고리의 1위 점수 합"이 가장 높은 지역을 앵커로(`anchorRegion`) → 결과 헤더에 표시.

**루틴 — `data/glowUpRoutines.ts` + `routines.ts`**

1. 템플릿 15개가 FOUNDATION(First days) → IDENTITY(Mid-trip) → FINISH(Last days) → RECOVER(Any night) 네 단계에 속한다. 템플릿마다 이름·한 줄 약속·슬롯(필수/선택, 스톱 순서 팁)·안내·시간대.
2. 선택 → 템플릿(그리디): 필수 슬롯이 모두 선택 안에 있는 템플릿 중 남은 선택을 가장 많이 담는 것, 동점이면 섞인 템플릿, 그다음 템플릿 순서. skin+face는 클리닉 1곳. 템플릿이 혼자 담지 못하는 nail·makeup(단독)은 카테고리 가이드 이름의 1스톱 루틴.
3. 개수: 목표 = 1일 → 2, 2–3일 → 3, 4일+ → 4(선택 수 이하). 적으면 가장 큰 루틴에서 하나를 떼어 새 템플릿으로, 많으면 같은 날 가능한 루틴에 붙인다(회복 ↔ 회복만, 최대 4스톱·저녁 3스톱). 선택은 절대 빠지지 않아 목표보다 많을 수 있다.
4. 같은 날 금지(`conflicts`): 클리닉 + 사우나/스크럽/마사지/메이크업/사진, 반영구 + 사우나/스크럽/사진.
5. 다운타임 `No — photos every day`: 클리닉 단독 FOUNDATION 템플릿과 Holy Grail Base를 쓰지 않고 클리닉은 **Fly Home Glowing**(Last days), 섞인 클리닉 루틴은 Last days로 옮기고 "Last on purpose — …" 안내.
6. `BEST` = 루틴 안에서 점수가 가장 높은 스톱 1개. `See another version`(`remixItinerary`)은 전체를 다시 계산하고 바뀐 장소를 한 줄로 설명(`describeChange`).
7. `MIYEON CHECKED`(`checksFor`): Your match · Trip-ready(분 · 지역) · English support(No translation app) · On budget — 기본 전부 표시, 표시 가격이 예산을 **명확히 초과**할 때만 On budget을 빼고 `3/3`.

### 12.4 알려진 한계

- 이메일 수집은 화면과 로컬 저장(`miyeon_beauty_card_requests`)까지만 — 실제 발송은 `services/beautyCard.ts`의 `TODO(email)` 그대로다.
- 현지 신뢰(Google Places 리뷰·별점)는 점수에 없다. 이동시간은 경로 API(카카오/네이버) 없이 직선거리 추정(`services/itinerary/travel.ts`)이다.
- `booked_count`·`captured_at`이 CSV에 아직 없어 외국인 수요는 Creatrip 리뷰 수만, 캡처 최신성은 중간값으로 계산된다.
- 소요 시간·다운타임은 장소별 실제 값이 있는 곳이 적어 카테고리 가이드(`data/categoryGuides.ts`)의 일반값으로 대체된다.
