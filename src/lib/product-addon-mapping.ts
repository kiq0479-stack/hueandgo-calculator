// 메인상품 코드 -> 추가상품 코드 매칭 테이블
// 민주가 제공한 엑셀 기반 (2026-02-12)

export const PRODUCT_ADDON_MAPPING: Record<string, string[]> = {
  'P00000BU': ['P00000DV', 'P000000V', 'P000000W', 'P000000X', 'P000000Y'], // 아크릴 키링
  'P00000CF': ['P00000DQ', 'P00000DW', 'P00000BD', 'P00000LD'], // 아크릴 스마트톡
  'P00000EC': ['P00000SE', 'P00000LD', 'P00000DY', 'P00000DZ', 'P0000BMY', 'P00000FT'], // 아크릴 젤펜
  'P0000BNI': ['P00000CY', 'P0000BNH', 'P00000BN'], // 유사코롯타
  'P0000BIS': ['P00000SE', 'P00000LD', 'P00000BN', 'P00000DZ', 'P00000FT'], // 아크릴 볼펜
  'P0000BIM': ['P00000NB', 'P00000EV', 'P00000KI'], // 아크릴 띠용용 등신대
  'P0000BBG': ['P00000NB', 'P00000KI', 'P00000EV'], // 아크릴 메모보드
  'P00000ZE': ['P00000NB', 'P00000ZB', 'P00000ZC', 'P00000CZ', 'P00000ZD'], // 아크릴 자석 포토카드 스탠드
  'P00000YE': ['P00000NB', 'P00000GR', 'P00000CZ'], // 아크릴 참 양쪽집게
  'P00000XP': ['P00000NB', 'P00000XK', 'P00000XL', 'P00000XM', 'P00000XN', 'P00000XO', 'P000000X', 'P00000BN'], // 아크릴 테이프 홀더
  'P00000WI': ['P00000NB', 'P00000GR', 'P00000WF', 'P00000EV', 'P00000KI'], // 아크릴 충전단자 보호캡
  'P00000VP': ['P00000NB', 'P00000EV', 'P00000KI', 'P00000ND'], // 아크릴 연필꽂이
  'P00000VN': ['P00000NB', 'P00000OJ', 'P00000VI', 'P00000KI'], // 아크릴 자
  'P00000TX': ['P00000NB', 'P00000DH', 'P00000GR', 'P00000KI'], // 아크릴 입간판 집게
  'P00000TS': ['P00000NB', 'P00000PN', 'P00000PO', 'P00000KI', 'P00000ND'], // 아크릴 폰 거치대
  'P00000TC': ['P000000V', 'P00000DV', 'P000000Y', 'P00000CZ'], // 오로라 아크릴 키링
  'P00000RW': ['P00000DV', 'P000000V', 'P000000W', 'P000000Y'], // 컬러 아크릴 키링
  'P00000OS': ['P00000NB', 'P00000BN', 'P000000X', 'P00000OT', 'P00000OU'], // 아크릴 코롯토
  'P00000OK': ['P00000OI', 'P00000OM', 'P00000BD', 'P00000DQ', 'P00000DW'], // 아크릴 회전 스마트톡
  'P00000NK': ['P00000NB', 'P00000KI', 'P00000NL'], // 아크릴 머들러
  'P00000NE': ['P00000NB', 'P00000NC', 'P00000KI', 'P00000ND'], // 아크릴 메모꽂이
  'P00000KV': ['P00000KI'], // 아크릴 QR 스탠드
  'P00000KG': ['P00000CY', 'P00000KI', 'P00000LD'], // 아크릴 뱃지
  'P00000KE': ['P00000CY', 'P00000KD', 'P00000LD'], // 아크릴 LED 파츠 참
  'P00000JW': ['P00000JU', 'P00000JV', 'P00000LD'], // 아크릴 자석 집게
  'P00000GA': [], // 피규어 턴테이블 (추가상품 없음)
  'P00000ET': ['P00000EU', 'P00000EV', 'P00000EW'], // 아크릴 코스터
  'P00000ER': ['P00000CM', 'P00000GJ', 'P00000LD'], // 아크릴 자석
  'P00000EQ': ['P00000CI', 'P00000CJ', 'P00000LD'], // 아크릴 집게
  'P00000EP': ['P00000LD', 'P00000EJ', 'P00000EK', 'P00000EL', 'P00000EM', 'P00000EN'], // 아크릴 포토프롭
  'P00000DR': ['P00000DQ', 'P00000DW', 'P00000BD', 'P00000LD'], // 아크릴 맥세이프 스마트톡
  'P00000DA': ['P00000CY', 'P00000CZ', 'P00000LD'], // 아크릴 파츠 참
  'P00000CG': ['P00000BA', 'P00000BB', 'P000000X', 'P00000BC'], // 아크릴 등신대
  'P00000CE': ['P00000BI'], // 스팽글쿠션
  'P00000CD': ['P00000BQ', 'P00000BR', 'P00000BS', 'P00000BP'], // 타투스티커
  'P00000CC': ['P00000BK', 'P0000BKG', 'P0000BKF'], // 마우스패드
  'P00000CA': ['P00000BI', 'P00000BG', 'P00000BJ'], // 일반쿠션
  'P00000BZ': ['P00000BI', 'P00000BL', 'P00000BN', 'P00000BM'], // 안경닦이
};

// 추가상품명 정제 함수
// 규칙:
// - 옵션이 2개 이상: 옵션 이름 사용 (Cafe24AddonSelector에서 처리)
// - 옵션이 1개: 상품명에서 메인상품명, 괄호 안/뒤 내용 제거
// 예: "키링 개별 포장 (수량에 맞게...)" → "개별 포장"
// 예: "젤펜 배경제거(누끼작업) 이미지 개수에..." → "배경제거"
export function cleanAddonName(addonName: string, mainProductName?: string): string {
  let cleaned = addonName;
  
  // 1. 괄호 안 내용 제거: (...)
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '');
  
  // 2. 괄호 뒤 내용 제거 (괄호로 시작하는 경우)
  // 예: "배경제거(누끼작업) 이미지 개수에..." → "배경제거"
  cleaned = cleaned.replace(/\([^)]*\).*/g, '');
  
  // 3. 메인상품명에서 공통 키워드 추출해서 제거
  // 메인상품명: "(파트너 전용) 아크릴 키링" → 키워드: ["아크릴", "키링"]
  if (mainProductName) {
    const mainKeywords = mainProductName
      .replace(/\(파트너 전용\)/g, '')
      .replace(/\([^)]*\)/g, '')
      .trim()
      .split(/\s+/)
      .filter(k => k.length > 1);
    
    // 추가상품명에서 메인상품 키워드 제거
    for (const keyword of mainKeywords) {
      cleaned = cleaned.replace(new RegExp(keyword, 'gi'), '');
    }
  }
  
  // 4. 앞뒤 공백 정리
  cleaned = cleaned.trim();
  
  // 5. 빈 문자열이면 원본 반환
  if (!cleaned) {
    return addonName.replace(/\s*\([^)]*\)/g, '').trim() || addonName;
  }
  
  return cleaned;
}

// 견적서용 메인상품명 정제 (파트너 전용 제거)
export function cleanMainProductName(productName: string): string {
  return productName
    .replace(/\(파트너 전용\)\s*/g, '')
    .replace(/\(파트너 전용_에디터\)\s*/g, '')
    .trim();
}
