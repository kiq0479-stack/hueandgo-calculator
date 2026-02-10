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

// 상품 상세 조회 (옵션 포함)
export async function fetchProductDetail(
  productNo: number,
  embed?: string[],
): Promise<Cafe24ProductDetail> {
  const headers = await getAuthHeaders();
  const BASE_URL = getBaseUrl();

  const query = new URLSearchParams();
  if (embed?.length) query.set('embed', embed.join(','));

  const url = `${BASE_URL}/products/${productNo}${query.toString() ? '?' + query.toString() : ''}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`상품 상세 조회 실패 (${productNo}): ${response.status} ${error}`);
  }

  const data: Cafe24ProductDetailResponse = await response.json();
  return data.product;
}

// 상품 품목(Variant) 목록 조회
export async function fetchProductVariants(
  productNo: number,
): Promise<Cafe24Variant[]> {
  const headers = await getAuthHeaders();
  const BASE_URL = getBaseUrl();

  const url = `${BASE_URL}/products/${productNo}/variants`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`품목 조회 실패 (${productNo}): ${response.status} ${error}`);
  }

  const data: Cafe24VariantsResponse = await response.json();
  return data.variants;
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

// 상품 상세 + 옵션 + 품목을 한 번에 가져오기
export async function fetchProductWithDetails(productNo: number) {
  const [product, options, variants] = await Promise.all([
    fetchProductDetail(productNo),
    fetchProductOptions(productNo),
    fetchProductVariants(productNo),
  ]);

  return { product, options, variants };
}
