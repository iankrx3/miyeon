# Miyeon 아키텍처별 기능 설명

Vite + React SPA. 서버는 Vite 개발/프리뷰 프록시(및 Vercel 배포용 `api/`)뿐이고, 나머지 로직은 브라우저에서 돌아간다.

```
[브라우저]
  pages / components          UI, 라우팅
  hooks                       세션 · 저장 상태(itineraries/places)
  services                    인증 · 장소 조회 · 디스커버리 · 일정 생성 · 큐레이터 · 매거진 · 커뮤니티
  data / types                퀴즈/온보딩 카피, 큐레이션 spot 카탈로그, mock, 도메인 모델
       │  /api/*
[Vite 프록시] plugins/miyeon-api-proxy.ts   (로컬 개발/프리뷰)
[Vercel 함수] api/**/*.ts                    (배포)
       │  둘 다 shared/apiProxy.ts의 상수를 공유
  data.go.kr MdclTursmService (KTO 의료관광)
  places.googleapis.com      (Google Places API New)
  generativelanguage.googleapis.com (optional) Gemini + Google Search grounding
  (optional) Supabase Auth + Postgres (creators/creator_lists/list_spots/curator_itineraries/saved_itineraries/magazine_articles/community_*/spots)
```

실패 시 항상 mock/로컬 데이터로 연다. 키가 없어도 Plan 온보딩 → 일정 생성, Map, 데모 로그인은 동작한다.

Explore 탭은 더 이상 "퀴즈 → Top 3 장소 매칭" 화면이 아니다. `MIYEON_planner.md`의 온보딩 플로우 그대로 뷰티 트립 프로필을 받아 `services/itinerary/generate.ts`로 day-by-day 일정을 만들고 `/itinerary/:id`로 보낸다 — 자세한 내용은 [§4](04-matching.md). 이전 매칭 엔진(`services/match.ts`, `ResultCard`, `ProductCommerce`, `CategoryRadial`, `PairChoice`, `EmailCaptureCard`)은 코드에 남아 있지만 어떤 라우트에서도 더 이상 참조되지 않는 죽은 코드다.

## 목차

1. [셸 · 라우팅](01-shell-routing.md)
2. [인증](02-auth.md)
3. [장소 디스커버리 엔진](03-discovery-engine.md)
4. [뷰티 트립 플래너 (Explore → Itinerary)](04-matching.md)
5. [맵](05-map.md)
6. [상세 · 커뮤니티 · 저장](06-detail-community-saved.md)
7. [도메인 모델](07-domain-model.md)
8. [기능 × 레이어](08-feature-matrix.md)
9. [환경 변수](09-env-vars.md)
10. [의도적으로 빠져 있는 것](10-known-gaps.md)
11. [큐레이터 도구 · 매거진 · 저장된 일정](11-curator-tools.md)
