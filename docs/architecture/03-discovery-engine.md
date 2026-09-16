[← 목차](README.md)

## 3. 장소 디스커버리 엔진

카테고리(skin / face / hair / nails / makeup)의 기본 카탈로그는 KTO 의료관광(`MdclTursmService`)이다. Google Places는 **Pro 필드 마스크**로만, hair/nails/makeup 핀(Nearby Search Pro 1회, 24h 캐시)과 KTO 검색이 비었을 때의 Text Search Pro 1회에 쓴다. rating/reviews/photos 필드는 Enterprise라 요청하지 않는다.

### 3.1 API 프록시

두 곳에서 같은 엔드포인트를 제공한다 — 상수·설정은 `shared/apiProxy.ts` 하나를 공유해서 드리프트가 나지 않게 한다:

- `plugins/miyeon-api-proxy.ts` — 로컬 개발/프리뷰(`vite.config.ts`의 `configureServer` / `configurePreviewServer`)
- `api/**/*.ts` — Vercel 배포 (`api/health.ts`, `api/kto/[...op].ts`, `api/places/search.ts`, `api/places/photo.ts`, `api/places/details.ts`)

키는 `KTO_SERVICE_KEY`, `GOOGLE_PLACES_API_KEY` ( **`VITE_` 없음** ). 브라우저에 안 나간다.

| 프론트 | 업스트림 |
|---|---|
| `GET /api/health` | 키 장착 여부 `{ kto, google }` |
| `GET /api/kto/:op` | `https://apis.data.go.kr/B551011/MdclTursmService/:op` |
| `POST /api/places/search` | Places `searchNearby` / `searchText`, **Pro field mask**. 일 150건 초과면 `429 quota_exhausted` |
| `GET /api/places/photo` | 비활성 (`404`) — Place Photos SKU(월 1,000 무료)를 안 씀 |
| `GET /api/places/details` | 일 한도 0이라 `429`. 클라이언트도 호출하지 않음 |

키 없으면 `503 { error: 'not_configured' }`. 정적 호스팅에는 이 프록시가 없다.

### 3.2 클라이언트

| 파일 | 기능 |
|---|---|
| `services/googlePlaces.ts` | Nearby · Text Search · Place Details, 사진 URL, health 캐시 |
| `services/kto.ts` | `searchKeyword`, `locationBasedList`, `detailMdclTursm`, `detailCommon` |
| `lib/englishAddress.ts` | 한글이 섞인 주소를 영문 한 줄로 정규화 |
| `services/placeDetail.ts` | 상세는 KTO만. Google Place Details는 꺼 둠 |
| `shared/placesQuota.ts` | Nearby/Text Pro 일 150건. Details/Photos 일 0건 |
| `data/categorySearch.ts` | 카테고리 → Google type · 검색어 · KTO 키워드 |

기본 좌표는 강남 `(37.5172, 127.0473)`. `Near Me`여도 한국 밖이면 강남으로 되돌린다.

### 3.3 머지 (`services/discovery.ts`)

1. 부트스트랩 `discoverPlaces` / `loadSpots`는 KTO만 (`USE_GOOGLE_PLACES = false`). skin/face만 `ktoKeywords`가 있다.
2. Map에서 hair/nails/makeup 필터를 누르면 `discoverGoogleCategory`가 Nearby Search Pro를 **1회** 쏜다(24h 지오해시 캐시). 검색 필드에 rating/phone/photos를 넣지 않아 Pro(월 5,000 무료)로 유지한다.
3. KTO 히트면 `medicalTourismMatch` (인증 배지 · 언어 · 진료과). 별점·리뷰는 KTO에 없어 0.
4. 장소마다 합성 `Treatment` 하나 (`t-kto_…` / on-demand Google은 `t-gp_…`).
5. 10분 메모리 캐시. 실패하면 빈 배열 → 상위에서 mock.

| 카테고리 | Google `includedTypes` | KTO |
|---|---|---|
| skin | skin_care_clinic, spa, medical_clinic | dermatology, skin, 피부 |
| face | medical_clinic, spa | plastic, 성형 |
| hair | hair_salon, hair_care | 안 함 |
| nails | nail_salon | 안 함 |
| makeup | makeup_artist, beauty_salon | 안 함 |

웰니스(`WellnessTursmService`)는 엔진에 없고, mock 장소의 `nearbyWellness`만 쓴다.

### 3.4 지도 검색 (`searchPlacesByCategory`)

Map 탭 검색창은 이미 로드된 `places`를 이름/지역으로 즉시 필터링해서 보여주고(로컬 매치), 350ms 디바운스 후 `services/discovery.ts`의 `searchPlacesByCategory`가 KTO `searchKeyword` 한 번을 쏴 결과를 이어 붙인다(`src/components/map/MapView.tsx`).

- KTO 히트가 있으면 Google을 안 쏜다. 비었을 때만 Text Search Pro **1회**(카테고리 5개 병렬 금지).
- 결과는 (discovery 결과와 동일하게) `rememberDiscovery()`로 인메모리 카탈로그에 저장돼, 검색으로 찾은 장소를 클릭해 `/place/:id`로 들어가도 `fetchPlaceById`가 찾을 수 있다.
- 검색 결과를 클릭하면 지도에 아직 핀이 없을 수 있으므로(로컬 `places`에 없던 라이브 결과), `MapView`가 그 장소를 `places` state에 추가한 뒤 카메라를 이동시킨다. 카테고리 필터가 걸려 있으면 핀이 안 보일 수 있어 이때 필터도 "All"로 초기화한다.

### 3.5 조회 파사드 (`services/places.ts`)

`fetchPlaceById`/`fetchTreatmentById` 순서: `src/data/spots.ts`의 일정 후보 카탈로그(`getSpot`, 아래 3.6 참고) → in-memory 디스커버리 카탈로그(`catalogPlace`/`catalogTreatment`) → `src/data/mock.ts` → (그래도 없으면) `fetchPlaces()`/`fetchTreatments()`로 전체 디스커버리 재조회.

### 3.6 `data/spots.ts` — 이 엔진 위에 얹힌 일정 후보 카탈로그

Supabase `spots` 테이블(Creatrip 큐레이션 시드)은 삭제됐다. `src/data/spots.ts`의 `loadSpots()`는 지역 중심점 4곳(Gangnam/Seongsu/Hongdae/Myeongdong)마다 이 문서의 `discoverAll(origin)`을 호출해 병합하고, 결과 `Place`를 `Spot` 모양으로 매핑한다(`placeToSpot()`). 디스커버리가 KTO만 쓰므로 이 카탈로그도 KTO 의료관광 기관이다. 다음 화면들의 데이터 소스:

- **일정 생성 엔진** (`services/itinerary/generate.ts`, [§4](04-matching.md))
- **Map 탭 기본 핀** (`fetchCuratedMapData()`, [§5](05-map.md))
- **큐레이터 "장소 추가" 검색** (`SpotSearchPicker`) — 로컬 캐시 매치 + `searchPlacesByCategory` 라이브 검색을 합쳐 보여준다.
- **Place/Treatment 상세** (`PlaceDetailPage`, `TreatmentDetailPage`) — `fetchPlaceById`가 이 카탈로그에서 못 찾으면 이 엔진의 in-memory 디스커버리 카탈로그 → mock 순으로 fallback.

Google/KTO는 `needleRequired`/`downtime`/`procedureIntensity`/`factoryLike`/`upsellingRisk`/`priceTransparency`/`experienceStyle`를 주지 않으므로 `placeToSpot()`은 이 필드들을 "항상 통과" 고정값으로 채우고, `generate.ts`도 더 이상 이 필드들로 하드 필터링·스코어링하지 않는다(예산/언어/카테고리, rating만 실데이터). `subcategory`/`parentCategory`도 5개 `BeautyCategory`당 대표값 1개로 근사한 것이지, 실제 14종 세부 분류가 아니다.

`App.tsx`는 더 이상 `loadSpots()`를 await하지 않는다 — `getSpot`/`getSpots`를 실제로 읽는 페이지(`MapPage`/`ItineraryPage`/`CuratorListPage`)가 `hooks/useSpotsCatalog.ts`로 각자 진입 시점에 지연 호출한다(`PlaceDetailPage`는 `fetchPlaceById` 내부에서 이미 await). Google Places는 쓰지 않고 KTO만 쏜다([§10](10-known-gaps.md) 참고).
