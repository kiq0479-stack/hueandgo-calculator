# fn-1-mvp.1 카페24 OAuth 인증 구현

## Description
카페24 Open API OAuth 2.0 인증 플로우를 구현한다. Authorization Code Grant 방식으로 인증하며, Access Token / Refresh Token 관리 기능을 포함한다.

## Acceptance
- [x] `src/lib/cafe24/auth.ts` - OAuth 2.0 인증 라이브러리 (토큰 교환, 갱신, 검증)
- [x] `src/app/api/auth/cafe24/route.ts` - 인증 시작 (GET: 리다이렉트, POST: 상태 확인)
- [x] `src/app/api/auth/cafe24/callback/route.ts` - 콜백 처리 (code → token 교환)
- [x] CSRF 방지를 위한 state 파라미터 검증
- [x] Access Token 만료 5분 전 자동 갱신
- [x] 환경변수: CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET, CAFE24_MALL_ID

## Done summary
카페24 OAuth 2.0 인증 시스템 구현 완료:
- `src/lib/cafe24/auth.ts`: 인증 URL 생성, 코드→토큰 교환, 리프레시 토큰 갱신, 유효 토큰 자동 관리
- `src/app/api/auth/cafe24/route.ts`: GET으로 인증 시작(리다이렉트), POST로 인증 상태 확인
- `src/app/api/auth/cafe24/callback/route.ts`: 콜백 처리 + state CSRF 검증 + 토큰 교환
- MVP용 서버 메모리 토큰 저장소 (프로덕션에서는 DB로 교체 필요)
- `pnpm build` 성공 확인
## Evidence
- Commits: 91a716ce39053ccb9ce2f10e57d368f0cb4b1a48
- Tests: pnpm build
- PRs: