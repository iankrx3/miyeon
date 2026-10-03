[← 목차](README.md)

## 2. 인증

| 레이어 | 파일 | 하는 일 |
|---|---|---|
| UI | `src/components/auth/GoogleAuthModal.tsx` | Continue as demo / Continue with Google |
| Hook | `hooks/useAuth.ts` | 세션 hydrate, demo·Google·sign out |
| Service | `services/auth.ts` | demo `localStorage`, Google OAuth, return tab |
| Infra | `lib/supabase/client.ts` | `VITE_SUPABASE_*`가 있을 때만 클라이언트 생성 |

**Continue as demo**

- 유저: `Miyeon Demo` / `demo@miyeon.app`
- 키 `miyeon_mock_session`
- Supabase가 없어도 동작. 새로고침 유지. Sign out 시 삭제.

**Google**

- Supabase Auth `signInWithOAuth({ provider: 'google' })`
- 키가 없으면 모달이 안내만 하고 데모 로그인을 권한다.
