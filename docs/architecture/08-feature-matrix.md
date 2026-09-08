[← 목차](README.md)

## 8. 기능 × 레이어

| 기능 | UI | Hook / 상태 | Service | 외부 |
|---|---|---|---|---|
| 데모 로그인 | Auth modal, header | `useAuth` | `signInAsDemo` | `localStorage` |
| Google 로그인 | Auth modal | `useAuth` | `signInWithGoogle` | Supabase OAuth |
| 뷰티 트립 온보딩 → 일정 생성 | ExplorePage 위저드 | 페이지 state(`BeautyTripProfile`) | `generateItinerary` | `src/data/spots.ts` 큐레이션 카탈로그만 |
| 일정 편집(Replace/Move/Remove/Regenerate) | ItineraryPage 시트 | 페이지 state | `replaceSpotInItinerary`/`moveSpotToDay`/`removeSpotFromItinerary`/`regenerateItinerary` | — |
| 일정 저장 | ItineraryPage Save, ProfilePage | `useSavedItineraries` | `services/savedItineraries.ts` | `localStorage` + (로그인 시) Supabase `saved_itineraries` |
| 지도 핀 데이터 | Map 필터, 핀 | — | `fetchCuratedMapData` → `allSpotsAsPlaces` + 큐레이터 일정 | Supabase(`curator_itineraries`) 또는 로컬 |
| 지도 검색 | MapView 검색창 | 로컬 debounce | `searchPlacesByCategory` → `discoverAll` | Google |
| Map 리스트뷰 · 광고 | `PlaceListView` | — | `hasCreatripListing` | — |
| 큐레이터/일정 지도 딥링크 | MapView `?curator=`/`?itinerary=` | — | `fetchCuratorById`/`fetchCuratorItineraries` | Supabase 또는 로컬 |
| 장소/시술 상세 조회 | Place/Treatment detail | — | `fetchPlaceById`/`fetchTreatmentById`(spots → 디스커버리 카탈로그 → mock 순) | Google, KTO |
| 의료관광 배지 | Place detail | — | KTO `detailMdclTursm` 머지 | KTO |
| 웰니스 핀 | Map, Place detail | — | mock `nearbyWellness` | (미연동) |
| 장소 저장(My Map) | 상세/맵 버튼 | `useSavedPlaces` | — | `localStorage` |
| 커뮤니티 | CommunityPage(Community 탭), PostDetailPage | — | `services/community.ts` | Supabase 또는 `localStorage` |
| 매거진 | CommunityPage(Magazine 탭), MagazineDetailPage | `useMagazineArticles` | `services/magazine.ts` | Supabase 또는 `localStorage` |
| 큐레이터 프로필/일정 관리 | CuratorProfilePage, CuratorEditPage, CuratorSignupPage, CuratorListPage | — | `services/curator.ts` | Supabase 또는 `localStorage` |
| 예약 CTA + 광고 | Place / Treatment detail, Map 리스트 | — | `bookingUrl` / `lib/creatrip.ts` | 외부 링크(제휴) |
| 하단 탭바(모바일) | `BottomNav` | — | — | — |
