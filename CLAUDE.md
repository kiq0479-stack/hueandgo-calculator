# 휴앤고 단가계산기

## 프로젝트 개요
휴앤고 굿즈 제작 브랜드의 견적 자동화 시스템.
카페24 자사몰 API와 연동하여 상품/옵션/가격을 실시간 조회하고, 견적서를 자동 생성한다.

## 기술 스택
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- 카페24 Open API (OAuth 2.0)

## 주요 파일
- `REQUIREMENTS.md` — 상세 요구사항
- `assets/` — 견적서 양식, 도장 이미지, 사업자등록증
- `.env.local` — 카페24 API 키 (커밋 금지)

## 카페24 API
- 몰 ID: brandiz0312
- API 문서: https://developers.cafe24.com/docs/api/

## 개발 규칙
1. 한국어 주석 사용
2. 컴포넌트는 src/components/ 에 배치
3. API 라우트는 src/app/api/ 에 배치
4. 타입 정의는 src/types/ 에 배치
5. 유틸리티는 src/lib/ 에 배치

## 실행
```bash
pnpm dev
```
