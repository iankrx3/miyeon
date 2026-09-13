[← 목차](README.md)

## 9. 환경 변수

| 변수 | 위치 | 용도 |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | 브라우저 | Google OAuth |
| `VITE_MAPTILER_API_KEY` | 브라우저 | 지도 타일 |
| `KTO_SERVICE_KEY` | 서버 (Vite 프록시 · Vercel 함수) | 의료관광 Open API (`detailCommon` / `detailMdclTursm` 포함) |
| `GOOGLE_PLACES_API_KEY` | 서버 (Vite 프록시 · Vercel 함수) | Places API (New) — Search + Place Details |

전부 비어 있으면: 데모 로그인 + mock 장소 + Carto 지도.
