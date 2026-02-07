# 휴앤고 단가계산기 MVP

## 개요
휴앤고 굿즈 제작 브랜드의 견적 자동화 시스템. 카페24 자사몰 API와 연동하여 상품/옵션/가격을 실시간 조회하고, 견적서 및 거래명세서를 자동 생성한다.

## 카페24 API 정보
- 몰 ID: `brandiz0312`
- Client ID: `zvCXBGU5KJ3qcFYQlruc4C`
- Client Secret: `2KBwRj4qFdjkAHNirW4NnA`
- API 문서: https://developers.cafe24.com/docs/api/

## Tasks

### Task 1: 카페24 OAuth 인증 구현
- `src/lib/cafe24/auth.ts` 생성
- OAuth 2.0 인증 플로우 구현
- Access Token / Refresh Token 관리
- `src/app/api/auth/cafe24/route.ts` - 인증 시작
- `src/app/api/auth/cafe24/callback/route.ts` - 콜백 처리
- 환경변수: CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET, CAFE24_MALL_ID

### Task 2: 카페24 상품 API 연동
- `src/lib/cafe24/products.ts` 생성
- 상품 목록 조회 API
- 상품 상세 (옵션, 가격) 조회 API
- `src/types/cafe24.ts` - 타입 정의
- `src/app/api/products/route.ts` - 상품 API 라우트

### Task 3: 단가 계산기 UI
- `src/components/calculator/ProductSelector.tsx` - 제품 선택
- `src/components/calculator/OptionSelector.tsx` - 옵션 선택
- `src/components/calculator/QuantityInput.tsx` - 수량 입력
- `src/components/calculator/AddonSelector.tsx` - 추가상품 선택
- `src/components/calculator/Calculator.tsx` - 메인 계산기
- `src/app/page.tsx` - 메인 페이지에 계산기 배치

### Task 4: 견적 항목 관리
- `src/components/quote/QuoteItemList.tsx` - 견적 항목 목록
- `src/components/quote/QuoteItem.tsx` - 개별 항목 (수정/삭제)
- `src/components/quote/DiscountControl.tsx` - 할인율 적용
- `src/components/quote/QuoteSummary.tsx` - 합계 표시
- `src/hooks/useQuote.ts` - 견적 상태 관리

### Task 5: 견적서 생성
두 가지 양식:

#### 브랜디즈 견적서
- 등록번호: 725-81-03084
- 법인명: 주식회사 브랜디즈
- 대표자: 감민주
- 소재지: 울산광역시 울주군 웅촌면 웅촌로 575-7, 에이동
- 업태: 제조업, 도매 및 소매업, 정보통신업
- 종목: 문구 및 팬시 제조업, 전자상거래 소매업

#### 호탱감탱 견적서
- 등록번호: 812-09-01666
- 상호: 호탱감탱
- 대표자: 강태호
- 소재지: 울산광역시 동구 문현로 37, 3층(방어동)
- 업태: 제조업, 도매 및 소매업
- 종목: 인형 및 장난감 제조업, 전자상거래

#### 공통 기능
- 날짜: 자동(오늘) + 수정 가능
- 받는 상대(수신): 직접 입력
- 부가세 포함(기본) ↔ 부가세 제외(공급가액) 전환
- 메모란: 직접 작성
- 도장 이미지 삽입 (`assets/브랜디즈_도장.png`, 호탱감탱은 견적서PDF에서 추출)

컴포넌트:
- `src/components/quote/QuotePreview.tsx` - 견적서 미리보기
- `src/components/quote/QuoteForm.tsx` - 견적서 정보 입력 폼
- `src/lib/quote/templates.ts` - 견적서 템플릿 데이터

### Task 6: 거래명세서 생성
- 브랜디즈 양식
- `src/components/invoice/InvoicePreview.tsx`
- `src/components/invoice/InvoiceForm.tsx`

### Task 7: PDF/엑셀 다운로드
- `src/lib/pdf/generator.ts` - PDF 생성 (@react-pdf/renderer 사용)
- `src/lib/excel/generator.ts` - 엑셀 생성 (xlsx 사용)
- `src/components/quote/ExportButtons.tsx` - 다운로드 버튼

## 기술 스택
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- @react-pdf/renderer (PDF)
- xlsx (엑셀)

## UI/UX
- 심플하고 직관적
- 모바일 반응형
- 자사몰(hueandgo.com)과 유사한 옵션 선택 UX
