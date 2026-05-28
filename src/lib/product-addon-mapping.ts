// 메인상품-추가상품 매핑은 src/data/addon-mapping.json 에서 관리한다.
// (이 파일은 추가상품명/메인상품명 정제 함수만 export)

// 추가상품명 정제 함수
// 규칙:
// - 옵션이 2개 이상: 옵션 이름 사용 (Cafe24AddonSelector에서 처리)
// - 옵션이 1개: 상품명에서 메인상품명, 괄호 안/뒤 내용 제거
// 예: "키링 개별 포장 (수량에 맞게...)" → "개별 포장"
// 예: "젤펜 배경제거(누끼작업) 이미지 개수에..." → "배경제거"
export function cleanAddonName(addonName: string, mainProductName?: string): string {
  let cleaned = addonName;
  
  // 1. 괄호와 그 뒤의 모든 내용 제거 (먼저 처리!)
  // 예: "배경제거(누끼작업) 이미지 개수에..." → "배경제거"
  cleaned = cleaned.replace(/\([^)]*\).*/g, '');
  
  // 2. 남은 공백있는 괄호 제거: " (...)"
  // 예: "키링 개별 포장 (수량에 맞게...)" → "키링 개별 포장"
  cleaned = cleaned.replace(/\s+\([^)]*\)/g, '');
  
  // 3. 메인상품명에서 공통 키워드 추출해서 제거
  // 메인상품명: "(파트너 전용) 아크릴 키링" → 키워드: ["아크릴", "키링"]
  if (mainProductName) {
    const mainKeywords = mainProductName
      .replace(/\(파트너 전용\)/g, '')
      .replace(/\(파트너 전용_에디터\)/g, '')
      .replace(/\([^)]*\)/g, '')
      .trim()
      .split(/\s+/)
      .filter(k => k.length > 1);
    
    // 추가상품명에서 메인상품 키워드 제거
    for (const keyword of mainKeywords) {
      cleaned = cleaned.replace(new RegExp(keyword, 'gi'), '');
    }
  }
  
  // 4. 앞뒤 공백 정리 및 중복 공백 제거
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // 5. 빈 문자열이면 원본에서 괄호만 제거해서 반환
  if (!cleaned) {
    return addonName.replace(/\([^)]*\).*/g, '').replace(/\s+\([^)]*\)/g, '').trim() || addonName;
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
