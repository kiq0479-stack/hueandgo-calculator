// 상품 API 라우트

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/cafe24/auth';
import { fetchProducts, fetchProductWithDetails } from '@/lib/cafe24/products';

// GET /api/products - 상품 목록 조회
// GET /api/products?product_no=123 - 상품 상세 조회 (옵션+품목 포함)
export async function GET(request: NextRequest) {
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
      const data = await fetchProductWithDetails(Number(productNo));
      return NextResponse.json(data);
    }

    // 상품 목록 조회
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const products = await fetchProducts({
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : undefined,
      selling: 'T', // 판매중인 상품만
    });

    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
