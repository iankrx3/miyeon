[← 목차](README.md)

## 5. 맵

| 파일 | 기능 |
|---|---|
| `pages/MapPage.tsx` | 지도/리스트 뷰 토글, 선택 장소 시트, 상세 이동, Save |
| `src/components/map/MapView.tsx` | Leaflet, 카테고리/픽 필터, 검색(로컬 + 라이브 Google), 내 위치, 핀, 큐레이터/일정 딥링크 |
| `src/components/map/PlaceListView.tsx` | 지도 대신 보는 스크롤형 장소 리스트 |
| `src/components/place/SponsoredPlaceCard.tsx` | "광고" 배지 + 강조 테두리로 감싼 `PlaceCard` (리스트 최상단에서 재사용) |
| `data/mapCategories.ts` | Map 탭에 노출할 카테고리 목록(`ENABLED_MAP_CATEGORIES`) |

- **데이터 소스**: Map의 기본 핀 데이터는 `services/curator.ts#fetchCuratedMapData(session)`가 반환하는, curator가 실제로 등록한 장소만이다 — 모든 curator 일정(`curator_itineraries`, 원격+로컬)의 day block에 들어간 spot과, 레거시 `creator_picks`/`list_spots`(`services/places.ts#fetchAllCreatorPicks`)를 place id로 합쳐 dedupe한다. 더 이상 `allSpotsAsPlaces()`(부트스트랩 때 KTO로 채운 전체 카탈로그)를 그대로 핀으로 뿌리지 않는다. 단, 카테고리 필터(Hair/Nails/Makeup, Nearby Search Pro 1회/24h 캐시)와 검색창의 라이브 결과(KTO `searchKeyword` 우선, 비면 Text Search Pro 1회, [§3](03-discovery-engine.md))는 이 제한과 무관하게 기존처럼 curator 등록 여부와 상관없는 장소도 보여주고, 선택/클릭 시 지도에 핀으로 추가된다 — 의도적으로 유지된 예외.
- **카테고리**: `ENABLED_MAP_CATEGORIES`(`data/mapCategories.ts`)에 5개 카테고리(skin/face/hair/nails/makeup)가 모두 들어 있다.
- 뷰티 핀: Miyeon Sub1 (Dusty Rose). 카테고리 아이콘.
- 웰니스 핀: Warm Taupe. mock `nearbyWellness`만.
- 타일: `VITE_MAPTILER_API_KEY` 있으면 MapTiler, 없으면 Carto Voyager.
- **큐레이터/일정 필터**: URL 쿼리 `?curator=<id>`로 들어오면 그 큐레이터의 일정들에 등장하는 spot만 지도에 남기고(`curatorFilterPlaces`), 일정이 하나뿐이면 바로 `/itinerary/:id`로 리다이렉트한다. `?itinerary=`/`?list=`도 곧장 해당 일정 페이지로 보낸다. `components/map/MapView.tsx`의 "Curated by Creators" 스트립에서 아바타를 누르면 지도 점프가 아니라 `/curator/:id` 큐레이터 프로필로 이동한다([§6](06-detail-community-saved.md)).
- **지도/리스트 토글**: `MapPage.tsx` 좌측 하단 버튼. 리스트뷰(`PlaceListView`)는 같은 장소를 rating 내림차순으로 보여주고, `lib/creatrip.ts#hasCreatripListing()`이 true인(=실제 Creatrip spot 페이지가 검증된) 장소 중 하나를 최상단에 "광고 · 추천" 카드로, 나머지는 "광고" 배지만 붙여 표시한다. 제휴 페이지가 없는 장소는 그대로 배지 없이 보인다.
