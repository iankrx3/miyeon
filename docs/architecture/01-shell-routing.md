[← 목차](README.md)

## 1. 셸 · 라우팅

| 파일 | 역할 |
|---|---|
| `src/main.tsx` | React 루트, `BrowserRouter` |
| `src/App.tsx` | 헤더, 라우트, 로그인 모달, 하단 탭바 |
| `src/components/layout/NavHeader.tsx` | Explore / Map / Community 탭(데스크톱, `sm` 이상), Sign in·out |
| `src/components/layout/BottomNav.tsx` | 같은 3탭을 아이콘+라벨로 보여주는 모바일 전용(`sm` 미만) 하단 탭바 |
| `src/index.css`, `tailwind.config.js` | Miyeon 브랜드 토큰 (Main/Sub1/Sub2/Neutral/Base), 폰트 |

**기능**

- `/` Plan 온보딩(구 Explore 퀴즈 자리) → 뷰티 트립 프로필 → 일정 생성, [§4](04-matching.md)
- `/itinerary/:id` 일정 타임라인 + 지도 워크스페이스 (MIYEON 생성 · 큐레이터 · 저장본 스냅샷)
- `/map` 장소 핀/리스트 · 카테고리(5종 전부)/픽 필터 · 검색 · 큐레이터·일정 딥링크(`?curator=`/`?itinerary=`)
- `/community` 게시글 피드(Community 탭) + 매거진(Magazine 탭, `?tab=magazine`) — 둘 다 읽기 + 작성/좋아요/댓글/삭제
- `/place/:id` 장소 상세 (웰니스 · 의료관광 배지, 저장, 일정에서 왔으면 "Back to itinerary")
- `/treatment/:id` 시술 상세 · Creatrip 제휴 링크
- `/curator/:id` 큐레이터 프로필 · 그 큐레이터의 일정 목록
- `/curator/signup` 큐레이터 등록, `/curator/:id/edit` 프로필 수정 (본인만)
- `/curator/:id/lists/:listId`, `/curator/:id/itineraries/:itineraryId` 큐레이터 일정 상세/편집 (둘 다 같은 `CuratorListPage`)
- `/community/:id` 게시글 상세 · 댓글
- `/magazine/:id` 매거진 칼럼 상세
- `/profile` 로그인한 유저의 저장된 일정 목록 + 큐레이터 페이지 진입점

로그인 여부로 라우트를 막지 않는다(단, 글쓰기·좋아요·댓글·삭제, 큐레이터 등록/편집, 일정 저장은 로그인 필요). 게스트의 일정 저장·생성은 `localStorage`에 남는다.

모바일(`sm` 미만)에서는 상단 탭이 숨고 `BottomNav`가 뜬다. Map을 제외한 모든 라우트는 `App.tsx`의 `<main>`에 `pb-16`을 줘서 콘텐츠가 하단 탭바에 안 가리게 하고, Map은 풀블리드 레이아웃이라 자체적으로 줌/위치 버튼·선택 장소 시트를 모바일에서만 위로 띄운다.
