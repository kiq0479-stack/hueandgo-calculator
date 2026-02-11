// 상품 API 라우트

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, setTokenStore, type TokenData } from '@/lib/cafe24/auth';
import { fetchProducts, fetchProductWithDetails } from '@/lib/cafe24/products';

// 쿠키에서 토큰 복원
function restoreTokenFromCookie(request: NextRequest): boolean {
  const tokenCookie = request.cookies.get('cafe24_token')?.value;
  if (tokenCookie) {
    try {
      const tokenData: TokenData = JSON.parse(tokenCookie);
      setTokenStore(tokenData);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// GET /api/products - 상품 목록 조회
// GET /api/products?product_no=123 - 상품 상세 조회 (옵션+품목 포함)
export async function GET(request: NextRequest) {
  // 쿠키에서 토큰 복원 시도
  restoreTokenFromCookie(request);
  
  if (!isAuthenticated()) {
    return NextResponse.json(
      { error: '카페24 인증이 필요합니다.' },
      { status: 401 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const productNo = searchParams.get('product_no');

  try {
    // 상품 상세 조회 (product_no 파라미터 있을 때)
    if (productNo) {
      try {
        const data = await fetchProductWithDetails(Number(productNo));
        console.log('[DEBUG] fetchProductWithDetails result keys:', Object.keys(data));
        console.log('[DEBUG] options count:', data.options?.length ?? 'undefined');
        console.log('[DEBUG] variants count:', data.variants?.length ?? 'undefined');
        console.log('[DEBUG] additionalProducts count:', data.additionalProducts?.length ?? 'undefined');
        console.log('[DEBUG] additionalProducts sample:', JSON.stringify(data.additionalProducts?.[0] || null));
        // 클라이언트에서 확인할 수 있도록 debug 정보 추가
        return NextResponse.json({
          ...data,
          _debug: {
            optionsCount: data.options?.length ?? 0,
            variantsCount: data.variants?.length ?? 0,
            additionalProductsCount: data.additionalProducts?.length ?? 0,
            productHasAdditionalproducts: !!data.product?.additionalproducts,
            productAdditionalproductsCount: data.product?.additionalproducts?.length ?? 0,
          }
        });
      } catch (detailError) {
        const msg = detailError instanceof Error ? detailError.message : String(detailError);
        console.error('[ERROR] fetchProductWithDetails failed:', msg);
        return NextResponse.json({ 
          error: msg, 
          debug: 'fetchProductWithDetails 실패',
          product_no: productNo 
        }, { status: 500 });
      }
    }

    // 상품 목록 조회
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Cafe24 API limit 최대 100, 여러 번 호출해서 전체 가져오기
    const allProducts = [];
    let currentOffset = 0;
    const pageLimit = 100;
    
    while (true) {
      const products = await fetchProducts({
        limit: pageLimit,
        offset: currentOffset,
        selling: 'T',
      });
      
      if (products.length === 0) break;
      allProducts.push(...products);
      
      if (products.length < pageLimit) break; // 마지막 페이지
      currentOffset += pageLimit;
      
      // 안전장치: 최대 10페이지 (1000개)
      if (currentOffset >= 1000) break;
    }

    // 출고일 계산기와 동일한 필터링 로직
    const filterKeywords = ['개인 결제창', '개인결제창', '개인결제', '결제창'];
    
    const filteredProducts = allProducts.filter((p) => {
      // 키워드 필터
      for (const keyword of filterKeywords) {
        if (p.product_name.includes(keyword)) return false;
      }
      return true;
    });

    return NextResponse.json({ products: filteredProducts });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
