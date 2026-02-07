// 카페24 API 타입 정의

// 상품 목록 조회 응답의 개별 상품
export interface Cafe24Product {
  shop_no: number;
  product_no: number;
  product_code: string;
  custom_product_code: string;
  product_name: string;
  eng_product_name: string;
  model_name: string;
  price: string; // 판매가 (문자열)
  retail_price: string; // 소비자가
  supply_price: string; // 공급가(원가)
  display: 'T' | 'F'; // 진열 여부
  selling: 'T' | 'F'; // 판매 여부
  summary_description: string;
  detail_image: string;
  list_image: string;
  small_image: string;
  has_option: 'T' | 'F';
  created_date: string;
  updated_date: string;
}

// 상품 상세 조회 응답
export interface Cafe24ProductDetail extends Cafe24Product {
  description: string;
  option_type: string; // "T" = 조합형, "E" = 독립형, "F" = 옵션없음
  category: Cafe24Category[];
  variants?: Cafe24Variant[];
}

// 카테고리
export interface Cafe24Category {
  category_no: number;
  recommend: 'T' | 'F';
  new: 'T' | 'F';
}

// 품목 (Variant)
export interface Cafe24Variant {
  shop_no: number;
  variant_code: string;
  custom_variant_code: string;
  options: Cafe24VariantOption[];
  display: 'T' | 'F';
  selling: 'T' | 'F';
  additional_amount: string; // 옵션 추가금액
  quantity: number; // 재고수량
  safety_inventory: number;
}

// 품목 내 옵션 조합
export interface Cafe24VariantOption {
  name: string; // 옵션명 (예: "색상")
  value: string; // 옵션값 (예: "블루")
}

// 상품 옵션 정의
export interface Cafe24ProductOption {
  option_code: string;
  option_name: string; // 옵션명 (예: "아크릴 종류", "사이즈")
  option_value: Cafe24OptionValue[];
  required_option: 'T' | 'F';
  option_display_type: string;
}

// 옵션 값
export interface Cafe24OptionValue {
  option_text: string; // 표시 텍스트
  value_no: number | null;
  additional_amount: string; // 추가금액
}

// API 응답 래퍼
export interface Cafe24ProductsResponse {
  products: Cafe24Product[];
}

export interface Cafe24ProductDetailResponse {
  product: Cafe24ProductDetail;
}

export interface Cafe24VariantsResponse {
  variants: Cafe24Variant[];
}

export interface Cafe24OptionsResponse {
  options: Cafe24ProductOption[];
}
