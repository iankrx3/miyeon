[← 목차](README.md)

## 10. 의도적으로 빠져 있는 것

- 커뮤니티 팔로우 (글쓰기/좋아요/댓글/삭제는 있음)
- Map 탭의 hair/nails/makeup (타입·퀴즈·discovery엔 있지만 `ENABLED_MAP_CATEGORIES`로 지도만 skin/face로 제한)
- `WellnessTursmService` 실시간 연동
- 시술 마스터 DB — 라이브 장소는 카테고리당 합성 Treatment 1개
- 정적 배포용 프록시 — `npm run dev` / `vite preview`에서는 `plugins/miyeon-api-proxy.ts`, Vercel 배포에서는 `api/**/*.ts`가 동작. 그 외 정적 호스팅에는 `/api/*`가 없음
- 실제 LLM 랭커 — 일정 엔진은 `services/itinerary/generate.ts` 휴리스틱. `match.ts` Top 3 경로는 온보딩에서 분리됨
- Creatrip 장소 마스터 DB — 지금은 `src/data/spots.ts` 큐레이션 시드. Google/KTO는 오버레이 전용
- `creators`/`creator_picks`/`places`/`treatments` 테이블의 SQL 스키마 파일(`supabase/`에는 `community_schema.sql`, `leads_schema.sql`만 있음) — 라이브 프로젝트에 이미 있다고 가정하고 코드가 조회한다
