// 견적서 템플릿 데이터
// 두 가지 사업자 양식: 브랜디즈, 호탱감탱

export interface BusinessInfo {
  /** 템플릿 ID */
  id: 'brandiz' | 'hotanggamtang';
  /** 상호(법인명) */
  companyName: string;
  /** 등록번호 */
  registrationNumber: string;
  /** 대표자 */
  representative: string;
  /** 소재지 */
  address: string;
  /** 업태 */
  businessType: string;
  /** 종목 */
  businessItem: string;
  /** 도장 이미지 경로 (public 기준) */
  stampImagePath: string | null;
  /** 라벨 (UI 표시용) */
  label: string;
}

/** 브랜디즈 사업자 정보 */
export const BRANDIZ: BusinessInfo = {
  id: 'brandiz',
  companyName: '주식회사 브랜디즈',
  registrationNumber: '725-81-03084',
  representative: '감민주',
  address: '울산광역시 울주군 웅촌면 웅촌로 575-7, 에이동',
  businessType: '제조업, 도매 및 소매업, 정보통신업',
  businessItem: '문구 및 팬시 제조업, 전자상거래 소매업',
  stampImagePath: '/stamps/brandiz_stamp.png',
  label: '브랜디즈',
};

/** 호탱감탱 사업자 정보 */
export const HOTANGGAMTANG: BusinessInfo = {
  id: 'hotanggamtang',
  companyName: '호탱감탱',
  registrationNumber: '812-09-01666',
  representative: '강태호',
  address: '울산광역시 동구 문현로 37, 3층(방어동)',
  businessType: '제조업, 도매 및 소매업',
  businessItem: '인형 및 장난감 제조업, 전자상거래',
  stampImagePath: null, // 호탱감탱 도장은 추후 추출 필요
  label: '호탱감탱',
};

/** 전체 템플릿 목록 */
export const TEMPLATES: BusinessInfo[] = [BRANDIZ, HOTANGGAMTANG];

/** ID로 템플릿 조회 */
export function getTemplateById(id: string): BusinessInfo | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** 견적서 폼 데이터 */
export interface QuoteFormData {
  /** 선택된 템플릿 ID */
  templateId: 'brandiz' | 'hotanggamtang';
  /** 견적일자 (YYYY-MM-DD) */
  date: string;
  /** 수신 (받는 상대) */
  recipient: string;
  /** 부가세 포함 여부 (true: 포함, false: 제외/공급가액) */
  vatIncluded: boolean;
  /** 메모 */
  memo: string;
}

/** 기본 폼 데이터 */
export function getDefaultFormData(): QuoteFormData {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  return {
    templateId: 'brandiz',
    date: `${yyyy}-${mm}-${dd}`,
    recipient: '',
    vatIncluded: true,
    memo: '',
  };
}
