# fn-1-mvp.3 단가 계산기 UI

## Description
카페24 상품 API와 연동하는 단가 계산기 UI 구현. 제품 선택, 옵션 선택, 수량 입력, 추가상품 관리 기능과 견적 항목 목록을 포함하는 메인 페이지 구성.

## Acceptance
- [x] ProductSelector.tsx - 상품 목록 조회/검색/선택
- [x] OptionSelector.tsx - 상품 옵션(조합형/독립형) 선택
- [x] QuantityInput.tsx - 수량 입력 (+/- 버튼)
- [x] AddonSelector.tsx - 추가상품 추가/삭제/수량 관리
- [x] Calculator.tsx - 메인 계산기 (단가 계산, 견적 추가)
- [x] page.tsx - 메인 페이지에 계산기 + 견적 항목 목록 배치
- [x] 빌드 성공 확인

## Done summary
5개 계산기 컴포넌트 생성 및 메인 페이지 통합 완료. 카페24 API 연동 상품 조회, 옵션별 추가금 계산, 수량/추가상품 포함 합계 자동 계산, 견적 항목 추가/삭제 기능 구현. 2단 레이아웃(계산기 | 견적목록) 반응형 UI.

## Evidence
- Commits: feat: 단가 계산기 UI 구현
- Tests: pnpm build 성공
- PRs:
