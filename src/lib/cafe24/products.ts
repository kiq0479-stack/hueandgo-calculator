// 카페24 상품 API 클라이언트

import { getValidAccessToken } from './auth';
import type {
  Cafe24Product,
  Cafe24ProductDetail,
  Cafe24ProductsResponse,
  Cafe24ProductDetailResponse,
  Cafe24Variant,
  Cafe24VariantsResponse,
  Cafe24ProductOption,
  Cafe24OptionValue,
  Cafe24OptionsResponse,
} from '@/types/cafe24';

// 환경변수 getter (런타임에 안전하게 접근)
function getBaseUrl(): string {
  const MALL_ID = process.env.CAFE24_MALL_ID;
  if (!MALL_ID) {
    throw new Error('CAFE24_MALL_ID 환경변수가 설정되지 않았습니다.');
  }
  return `https://${MALL_ID}.cafe24api.com/api/v2/admin`;
}

// 인증 헤더 생성
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getValidAccessToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// 상품 목록 조회
export async function fetchProducts(params?: {
  limit?: number;
  offset?: number;
  display?: 'T' | 'F';
  selling?: 'T' | 'F';
}): Promise<Cafe24Product[]> {
  const headers = await getAuthHeaders();
  const BASE_URL = getBaseUrl();

  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  if (params?.display) query.set('display', params.display);
  if (params?.selling) query.set('selling', params.selling);

  const url = `${BASE_URL}/products${query.toString() ? '?' + query.toString() : ''}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`상품 목록 조회 실패: ${response.status} ${error}`);
  }

  const data: Cafe24ProductsResponse = await response.json();
  return data.products;
}

// 상품 코드로 상품 번호 조회
export async function fetchProductByCode(productCode: string): Promise<Cafe24Product | null> {
  const headers = await getAuthHeaders();
  const BASE_URL = getBaseUrl();

  const url = `${BASE_URL}/products?product_code=${productCode}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.text();
    console.log(`[DEBUG] 상품코드 조회 실패 (${productCode}): ${response.status} ${error}`);
    return null;
  }

  const data: Cafe24ProductsResponse = await response.json();
  return data.products?.[0] || null;
}

// 상품 상세 조회 (옵션 포함)
export async function fetchProductDetail(
  productNo: number,
  embed?: string[],
): Promise<Cafe24ProductDetail> {
  const headers = await getAuthHeaders();
  const BASE_URL = getBaseUrl();

  const query = new URLSearchParams();
  // 기본으로 additionalproducts 포함
  const embedList = embed || [];
  if (!embedList.includes('additionalproducts')) {
    embedList.push('additionalproducts');
  }
  query.set('embed', embedList.join(','));

  const url = `${BASE_URL}/products/${productNo}?${query.toString()}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`상품 상세 조회 실패 (${productNo}): ${response.status} ${error}`);
  }

  const data: Cafe24ProductDetailResponse = await response.json();
  return data.product;
}

// 상품 품목(Variant) 목록 조회 (페이징으로 전체 가져오기)
export async function fetchProductVariants(
  productNo: number,
): Promise<Cafe24Variant[]> {
  const headers = await getAuthHeaders();
  const BASE_URL = getBaseUrl();

  const allVariants: Cafe24Variant[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const url = `${BASE_URL}/products/${productNo}/variants?limit=${limit}&offset=${offset}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`품목 조회 실패 (${productNo}): ${response.status} ${error}`);
    }

    const data: Cafe24VariantsResponse = await response.json();
    const variants = data.variants || [];
    allVariants.push(...variants);

    // 더 이상 데이터 없으면 종료
    if (variants.length < limit) break;
    offset += limit;

    // 안전장치: 최대 1000개
    if (offset >= 1000) break;
  }

  return allVariants;
}

// 추가구성상품 조회
export async function fetchAdditionalProducts(
  productNo: number,
): Promise<any[]> {
  const headers = await getAuthHeaders();
  const BASE_URL = getBaseUrl();

  const url = `${BASE_URL}/products/${productNo}/additionalproducts`;
  console.log('[DEBUG] Fetching additionalproducts from:', url);
  
  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.text();
      console.log('[DEBUG] additionalproducts API error:', response.status, error);
      // 404는 추가구성상품이 없는 경우일 수 있음 - 에러 던지지 않고 빈 배열 반환
      if (response.status === 404) {
        console.log('[DEBUG] additionalproducts: 404 - 해당 상품에 추가구성상품 없음');
        return [];
      }
      throw new Error(`추가구성상품 조회 실패 (${productNo}): ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log('[DEBUG] additionalproducts raw response:', JSON.stringify(data).slice(0, 1000));
    return data.additionalproducts || [];
  } catch (err) {
    console.log('[DEBUG] fetchAdditionalProducts exception:', err);
    throw err;
  }
}

// 상품 옵션 정의 조회
export async function fetchProductOptions(
  productNo: number,
): Promise<Cafe24ProductOption[]> {
  const headers = await getAuthHeaders();
  const BASE_URL = getBaseUrl();

  const url = `${BASE_URL}/products/${productNo}/options`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`옵션 조회 실패 (${productNo}): ${response.status} ${error}`);
  }

  const data: Cafe24OptionsResponse = await response.json();
  return data.options;
}

// variants에서 옵션 목록 추출 (Cafe24 Options API 대안)
function extractOptionsFromVariants(variants: Cafe24Variant[]): Cafe24ProductOption[] {
  if (!variants || !variants.length) return [];

  // 옵션별 값 수집
  const optionMap = new Map<string, Map<string, string>>(); // optionName -> (optionValue -> additionalAmount)
  
  for (const variant of variants) {
    if (!variant.options) continue;
    for (const opt of variant.options) {
      if (!optionMap.has(opt.name)) {
        optionMap.set(opt.name, new Map());
      }
      // 같은 옵션값이면 첫 번째 additional_amount 유지 (variants마다 다를 수 있음)
      if (!optionMap.get(opt.name)!.has(opt.value)) {
        optionMap.get(opt.name)!.set(opt.value, variant.additional_amount);
      }
    }
  }

  // Cafe24ProductOption 형태로 변환
  const options: Cafe24ProductOption[] = [];
  let idx = 0;
  for (const [optionName, valuesMap] of optionMap) {
    const optionValues: Cafe24OptionValue[] = [];
    for (const [text, amount] of valuesMap) {
      optionValues.push({
        option_text: text,
        value_no: null,
        additional_amount: amount,
      });
    }
    options.push({
      option_code: `extracted_${idx++}`,
      option_name: optionName,
      option_value: optionValues,
      required_option: 'T',
      option_display_type: 'S',
    });
  }

  return options;
}

// 상품 상세 + 옵션 + 품목 + 추가구성상품을 한 번에 가져오기
export async function fetchProductWithDetails(productNo: number) {
  // Promise.allSettled로 실패해도 다른 것들은 가져오기
  const [productResult, optionsResult, variantsResult, additionalResult] = await Promise.allSettled([
    fetchProductDetail(productNo),
    fetchProductOptions(productNo),
    fetchProductVariants(productNo),
    fetchAdditionalProducts(productNo),
  ]);

  const product = productResult.status === 'fulfilled' ? productResult.value : null;
  let options = optionsResult.status === 'fulfilled' ? (optionsResult.value || []) : [];
  const variants = variantsResult.status === 'fulfilled' ? (variantsResult.value || []) : [];

  // Options API 실패 또는 빈 배열이면 variants에서 추출
  if ((!options || options.length === 0) && variants && variants.length > 0) {
    console.log('[INFO] Options API 빈 결과 → variants에서 옵션 추출');
    options = extractOptionsFromVariants(variants);
  }

  // 디버그 로그
  const optionsApiError = optionsResult.status === 'rejected' 
    ? (optionsResult.reason?.message || String(optionsResult.reason))
    : null;
  
  console.log('[DEBUG] product:', product?.product_name);
  console.log('[DEBUG] options count:', options?.length ?? 0);
  console.log('[DEBUG] variants count:', variants?.length ?? 0);
  if (optionsApiError) {
    console.log('[DEBUG] fetchProductOptions failed:', optionsApiError);
  }

  // 추가구성상품 (별도 API 또는 상품 상세의 embed에서 가져옴)
  let additionalProducts = additionalResult.status === 'fulfilled' ? (additionalResult.value || []) : [];
  console.log('[DEBUG] additionalProducts from API count:', additionalProducts.length);
  if (additionalResult.status === 'rejected') {
    console.log('[DEBUG] fetchAdditionalProducts failed:', additionalResult.reason?.message || additionalResult.reason);
  }
  
  // 별도 API 실패 시 상품 상세의 additionalproducts에서 가져오기 시도
  const embeddedAddons = product?.additionalproducts;
  if (additionalProducts.length === 0 && embeddedAddons && embeddedAddons.length > 0) {
    console.log('[DEBUG] Using additionalproducts from product detail embed');
    additionalProducts = embeddedAddons;
  }
  
  // Cafe24 API에서 못 가져오면 로컬 매핑 사용 (product_code 기반)
  // 주의: 이 함수는 서버에서 실행되므로 fetch로 public 파일 접근 불가
  // 대신 API route에서 처리
  console.log('[DEBUG] final additionalProducts count:', additionalProducts.length);

  return { product, options, variants, additionalProducts, optionsApiError };
}
