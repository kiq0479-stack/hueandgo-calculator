# fn-1-mvp.2 카페24 상품 API 연동

## Description
카페24 Admin API를 사용하여 상품 목록/상세/옵션/품목(Variant) 조회 기능을 구현한다. Task 1의 OAuth 인증을 활용하여 인증된 API 호출을 수행한다.

## Acceptance
- [x] `src/types/cafe24.ts` - 카페24 API 타입 정의 (Product, Variant, Option 등)
- [x] `src/lib/cafe24/products.ts` - 상품 API 클라이언트 (목록/상세/옵션/품목 조회)
- [x] `src/app/api/products/route.ts` - 상품 API 라우트 (목록 + 상세 조회)
- [x] 인증 상태 확인 후 API 호출 (미인증 시 401 응답)
- [x] `pnpm build` 성공

## Done summary
카페24 상품 API 연동 구현 완료:
- `src/types/cafe24.ts`: 카페24 API 전체 타입 정의 (Product, ProductDetail, Variant, VariantOption, ProductOption, OptionValue + 응답 래퍼)
- `src/lib/cafe24/products.ts`: 상품 API 클라이언트 - fetchProducts(목록), fetchProductDetail(상세), fetchProductVariants(품목), fetchProductOptions(옵션), fetchProductWithDetails(통합 조회)
- `src/app/api/products/route.ts`: GET /api/products 라우트 - 목록 조회(limit/offset/selling 파라미터) + product_no 쿼리로 상세 조회(옵션+품목 포함)
- 인증 미완료 시 401 에러 응답
- `pnpm build` 성공 확인

## Evidence
- Commits:
- Tests: pnpm build
- PRs:
