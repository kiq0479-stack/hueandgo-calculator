// 디버그 API: 모든 추가상품의 옵션 전수검사
// GET /api/debug/addon-options

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAsync } from '@/lib/cafe24/auth';
import { fetchProductByCode, fetchProductWithDetails } from '@/lib/cafe24/products';
import addonMappingData from '@/data/addon-mapping.json';

interface AddonOptionInfo {
  productCode: string;
  productName: string;
  price: string;
  hasOption: string;
  optionCount: number;
  options: {
    optionName: string;
    optionValues: string[];
  }[];
  variantCount: number;
  error?: string;
}

interface MainProductAddonInfo {
  mainProductCode: string;
  mainProductName: string;
  addons: AddonOptionInfo[];
}

export async function GET(request: NextRequest) {
  // DB에서 토큰 로드 및 인증 상태 확인
  const authenticated = await isAuthenticatedAsync();
  
  if (!authenticated) {
    return NextResponse.json(
      { error: '카페24 인증이 필요합니다. 먼저 메인 페이지에서 인증해주세요.' },
      { status: 401 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const targetMainCode = searchParams.get('main'); // 특정 메인상품만 검사
  const targetAddonCode = searchParams.get('addon'); // 특정 추가상품만 검사

  try {
    const addonMapping = addonMappingData as Record<string, string[]>;
    const results: MainProductAddonInfo[] = [];
    const processedAddons = new Set<string>(); // 중복 방지

    // 단일 추가상품 검사
    if (targetAddonCode) {
      const product = await fetchProductByCode(targetAddonCode);
      if (!product) {
        return NextResponse.json({ error: `추가상품 ${targetAddonCode} 찾을 수 없음` }, { status: 404 });
      }

      const details = await fetchProductWithDetails(product.product_no);
      const addonInfo: AddonOptionInfo = {
        productCode: targetAddonCode,
        productName: product.product_name,
        price: product.price,
        hasOption: product.has_option || 'F',
        optionCount: details.options?.length || 0,
        options: (details.options || []).map(opt => ({
          optionName: opt.option_name,
          optionValues: (opt.option_value || []).map(v => v.option_text),
        })),
        variantCount: details.variants?.length || 0,
      };

      return NextResponse.json({
        type: 'single_addon',
        addon: addonInfo,
      });
    }

    // 메인상품별 검사
    const mainCodes = targetMainCode ? [targetMainCode] : Object.keys(addonMapping);

    for (const mainCode of mainCodes) {
      const addonCodes = addonMapping[mainCode];
      if (!addonCodes || addonCodes.length === 0) continue;

      // 메인상품 정보
      const mainProduct = await fetchProductByCode(mainCode);
      const mainProductName = mainProduct?.product_name || mainCode;

      const addonInfos: AddonOptionInfo[] = [];

      for (const addonCode of addonCodes) {
        // 중복 스킵
        if (processedAddons.has(addonCode)) {
          // 이미 처리한 추가상품은 간략히 참조만
          addonInfos.push({
            productCode: addonCode,
            productName: '(중복 - 이전 결과 참조)',
            price: '',
            hasOption: '',
            optionCount: 0,
            options: [],
            variantCount: 0,
          });
          continue;
        }

        try {
          const product = await fetchProductByCode(addonCode);
          if (!product) {
            addonInfos.push({
              productCode: addonCode,
              productName: '(상품 없음)',
              price: '',
              hasOption: '',
              optionCount: 0,
              options: [],
              variantCount: 0,
              error: '상품 조회 실패',
            });
            continue;
          }

          const details = await fetchProductWithDetails(product.product_no);
          addonInfos.push({
            productCode: addonCode,
            productName: product.product_name,
            price: product.price,
            hasOption: product.has_option || 'F',
            optionCount: details.options?.length || 0,
            options: (details.options || []).map(opt => ({
              optionName: opt.option_name,
              optionValues: (opt.option_value || []).map(v => v.option_text),
            })),
            variantCount: details.variants?.length || 0,
          });

          processedAddons.add(addonCode);
        } catch (err) {
          addonInfos.push({
            productCode: addonCode,
            productName: '',
            price: '',
            hasOption: '',
            optionCount: 0,
            options: [],
            variantCount: 0,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      results.push({
        mainProductCode: mainCode,
        mainProductName,
        addons: addonInfos,
      });
    }

    // 요약 통계
    const allAddons = results.flatMap(r => r.addons.filter(a => !a.productName.includes('중복')));
    const summary = {
      totalMainProducts: results.length,
      totalAddons: allAddons.length,
      addonsWithOptions: allAddons.filter(a => a.optionCount > 0).length,
      addonsWithoutOptions: allAddons.filter(a => a.optionCount === 0 && !a.error).length,
      addonsWithErrors: allAddons.filter(a => a.error).length,
    };

    return NextResponse.json({
      type: 'full_scan',
      summary,
      results,
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }, { status: 500 });
  }
}
