[← 목차](README.md)

## 9. 환경 변수

| 변수 | 위치 | 용도 |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | 브라우저 | Google OAuth |
| `VITE_MAPTILER_API_KEY` | 브라우저 | 지도 타일 |
| `VITE_SITE_URL` | 빌드 · 브라우저 | 프로덕션 origin (예: `https://miyeon.app`). 있으면 빌드 때 `sitemap.xml`과 절대경로 canonical/`og:url`/`og:image`를 만들고 robots.txt에 Sitemap 줄을 넣는다 (`plugins/seo.ts`). 없으면 robots.txt만 만들고, 페이지 canonical은 런타임의 `location.origin`을 기준으로 한다 (`src/hooks/useDocumentMeta.ts`). |
| `KTO_SERVICE_KEY` | 서버 (Vite 프록시 · Vercel 함수) | 의료관광 Open API (`detailCommon` / `detailMdclTursm` 포함) |
| `GOOGLE_PLACES_API_KEY` | 서버 (Vite 프록시 · Vercel 함수) | Places API (New) — Nearby/Text Search **Pro field mask only**. Place Details·Photos 비활성. 프록시가 SKU별 일 150건 한도. Cloud Console에서도 Nearby Search Pro / Text Search Pro를 월 5,000으로 캡 걸 것. |

전부 비어 있으면: 데모 로그인 + mock 장소 + Carto 지도.
