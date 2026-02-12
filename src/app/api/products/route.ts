// 상품 API 라우트

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, setTokenStore, type TokenData } from '@/lib/cafe24/auth';
import { fetchProducts, fetchProductWithDetails, fetchProductByCode } from '@/lib/cafe24/products';

// 로컬 추가구성상품 매핑 (직접 import - Vercel serverless 호환)
// 새 형식: { [mainProductCode]: string[] } (추가상품 코드 배열)
import addonMappingData from '@/data/addon-mapping.json';

// 로컬 추가구성상품 코드 매핑 반환
function loadAddonMapping(): Record<string, string[]> {
  return addonMappingData as Record<string, string[]>;
}

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
// GET /api/products?product_code=P00000XX - 상품코드로 상세 조회
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
  const productCode = searchParams.get('product_code');

  try {
    // 상품 상세 조회 (product_no 파라미터 있을 때)
    if (productNo) {
      try {
        const data = await fetchProductWithDetails(Number(productNo));
        console.log('[DEBUG] fetchProductWithDetails result keys:', Object.keys(data));
        console.log('[DEBUG] options count:', data.options?.length ?? 'undefined');
        console.log('[DEBUG] variants count:', data.variants?.length ?? 'undefined');
        console.log('[DEBUG] additionalProducts count (API):', data.additionalProducts?.length ?? 'undefined');
        
        // Cafe24 API에서 추가구성상품 못 가져오면 로컬 매핑 사용
        let finalAdditionalProducts = data.additionalProducts || [];
        const productCode = data.product?.product_code;
        
        if (finalAdditionalProducts.length === 0 && productCode) {
          const addonMapping = loadAddonMapping();
          const addonCodes = addonMapping[productCode];
          if (addonCodes && addonCodes.length > 0) {
            console.log('[DEBUG] Using local addon mapping for', productCode, ':', addonCodes.length, 'codes');
            // 각 추가상품 코드에 대해 Cafe24에서 상품 정보 가져오기
            const addonProducts = await Promise.all(
              addonCodes.map(async (code) => {
                try {
                  const product = await fetchProductByCode(code);
                  if (product) {
                    return {
                      product_no: product.product_no,
                      product_code: product.product_code,
                      product_name: product.product_name,
                      price: product.price,
                      small_image: product.small_image,
                      has_option: product.has_option || 'F',
                    };
                  }
                } catch (e) {
                  console.error('[DEBUG] Failed to fetch addon product:', code, e);
                }
                return null;
              })
            );
            finalAdditionalProducts = addonProducts.filter((p): p is NonNullable<typeof p> => p !== null);
            console.log('[DEBUG] Fetched addon products:', finalAdditionalProducts.length);
          }
        }
        
        console.log('[DEBUG] final additionalProducts count:', finalAdditionalProducts.length);
        
        // 클라이언트에서 확인할 수 있도록 debug 정보 추가
        return NextResponse.json({
          ...data,
          additionalProducts: finalAdditionalProducts,
          _debug: {
            optionsCount: data.options?.length ?? 0,
            variantsCount: data.variants?.length ?? 0,
            additionalProductsCount: finalAdditionalProducts.length,
            productHasAdditionalproducts: !!data.product?.additionalproducts,
            productAdditionalproductsCount: data.product?.additionalproducts?.length ?? 0,
            usedLocalMapping: finalAdditionalProducts.length > 0 && (data.additionalProducts?.length ?? 0) === 0,
            productCode: productCode,
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

    // 상품코드로 상세 조회 (추가구성상품의 옵션 조회용)
    if (productCode) {
      try {
        // 1. 상품코드로 상품번호 찾기
        const product = await fetchProductByCode(productCode);
        if (!product) {
          return NextResponse.json({ 
            error: `상품코드 ${productCode}에 해당하는 상품을 찾을 수 없습니다.`,
          }, { status: 404 });
        }

        // 2. 상품번호로 상세 + 옵션 + variants 조회
        const data = await fetchProductWithDetails(product.product_no);
        
        return NextResponse.json({
          ...data,
          _debug: {
            productCode,
            productNo: product.product_no,
            optionsCount: data.options?.length ?? 0,
            variantsCount: data.variants?.length ?? 0,
          }
        });
      } catch (detailError) {
        const msg = detailError instanceof Error ? detailError.message : String(detailError);
        console.error('[ERROR] fetchProductByCode failed:', msg);
        return NextResponse.json({ 
          error: msg, 
          debug: 'fetchProductByCode 실패',
          product_code: productCode 
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
