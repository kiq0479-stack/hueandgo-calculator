'use client';

import Image from 'next/image';
import type { QuoteItem as QuoteItemType } from '@/components/calculator/Calculator';
import type { QuoteTotals } from '@/hooks/useQuote';
import {
  getTemplateById,
  type BusinessInfo,
  type QuoteFormData,
} from '@/lib/quote/templates';

interface QuotePreviewProps {
  items: QuoteItemType[];
  totals: QuoteTotals;
  formData: QuoteFormData;
}

// 날짜 포맷: YYYY-MM-DD -> YYYY년 MM월 DD일
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${m}월 ${d}일`;
}

// 등록번호 포맷 유지 (이미 하이픈 포함)
function formatRegNumber(num: string): string {
  return num;
}

// 금액을 부가세 포함/제외 기준으로 재계산
function recalcTotals(
  totals: QuoteTotals,
  vatIncluded: boolean
): {
  supplyAmount: number;
  vat: number;
  grandTotal: number;
} {
  if (vatIncluded) {
    // 부가세 포함: 기존 계산과 동일
    return {
      supplyAmount: totals.supplyAmount,
      vat: totals.vat,
      grandTotal: totals.grandTotal,
    };
  } else {
    // 부가세 별도: 기존 할인 후 금액이 공급가액
    const afterDiscount = totals.subtotal - totals.discountAmount;
    const supplyAmount = afterDiscount;
    const vat = Math.round(supplyAmount * 0.1);
    const grandTotal = supplyAmount + vat;
    return { supplyAmount, vat, grandTotal };
  }
}

// 개별 항목의 단가를 부가세 모드에 따라 계산
function getItemDisplayPrice(
  unitPrice: number,
  vatIncluded: boolean,
  discountRate: number
): number {
  const discounted = Math.round(unitPrice * (1 - discountRate / 100));
  if (vatIncluded) {
    // 부가세 포함이면 단가 그대로 (VAT 포함가)
    return discounted;
  }
  // 부가세 별도이면 단가가 곧 공급가
  return discounted;
}

export default function QuotePreview({
  items,
  totals,
  formData,
}: QuotePreviewProps) {
  const template: BusinessInfo | undefined = getTemplateById(
    formData.templateId
  );

  if (!template) return null;

  const { supplyAmount, vat, grandTotal } = recalcTotals(
    totals,
    formData.vatIncluded
  );

  // 항목이 없으면 안내 메시지
  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
        <p className="text-sm text-gray-400">
          견적 항목을 추가하면 미리보기가 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div
      id="quote-preview"
      className="mx-auto max-w-[210mm] border border-gray-300 bg-white p-8 text-[11px] leading-relaxed text-black print:border-none print:p-0"
      style={{ fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}
    >
      {/* 제목 */}
      <h2 className="mb-6 text-center text-2xl font-bold tracking-widest">
        견 적 서
      </h2>

      {/* 상단 정보 영역: 왼쪽(수신/날짜), 오른쪽(사업자정보) */}
      <div className="mb-6 flex gap-6">
        {/* 왼쪽: 수신 + 날짜 + 금액 */}
        <div className="flex-1 space-y-2">
          <div className="flex">
            <span className="w-16 font-semibold text-gray-700">수 신</span>
            <span className="border-b border-gray-400 flex-1 pb-0.5">
              {formData.recipient || '(미입력)'}
            </span>
          </div>
          <div className="flex">
            <span className="w-16 font-semibold text-gray-700">견적일자</span>
            <span>{formatDate(formData.date)}</span>
          </div>
          <div className="mt-4 rounded border border-gray-300 p-3">
            <div className="flex justify-between">
              <span className="font-semibold">합계금액</span>
              <span className="text-base font-bold">
                {grandTotal.toLocaleString()}원
              </span>
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              {formData.vatIncluded
                ? '(부가세 포함)'
                : `(공급가액 ${supplyAmount.toLocaleString()}원 + 부가세 ${vat.toLocaleString()}원)`}
            </p>
          </div>
        </div>

        {/* 오른쪽: 사업자 정보 테이블 */}
        <div className="w-[280px] shrink-0">
          <table className="w-full border-collapse border border-gray-400 text-[10px]">
            <tbody>
              <tr>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold w-[70px]">
                  등록번호
                </td>
                <td className="border border-gray-300 px-2 py-1" colSpan={3}>
                  {formatRegNumber(template.registrationNumber)}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold">
                  상 호
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {template.companyName}
                </td>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold w-[50px]">
                  대표자
                </td>
                <td className="border border-gray-300 px-2 py-1 relative w-[70px]">
                  {template.representative}
                  {/* 도장 이미지 (이름 옆에 겹침) */}
                  {template.stampImagePath && (
                    <span className="absolute -right-2 -top-3 inline-block h-12 w-12">
                      <Image
                        src={template.stampImagePath}
                        alt="도장"
                        width={48}
                        height={48}
                        className="opacity-80"
                      />
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold">
                  소재지
                </td>
                <td className="border border-gray-300 px-2 py-1" colSpan={3}>
                  {template.address}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold">
                  업 태
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {template.businessType}
                </td>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold">
                  종 목
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {template.businessItem}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 견적 항목 테이블 */}
      <table className="mb-4 w-full border-collapse border border-gray-400 text-[10px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1.5 text-center w-8">
              No
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">
              품 명
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-left w-[140px]">
              규 격
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-center w-12">
              수량
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-right w-[80px]">
              단 가
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-right w-[90px]">
              금 액
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-left w-[80px]">
              비 고
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            // 옵션 텍스트
            const optionText = Object.entries(item.selectedOptions)
              .map(([, v]) => v)
              .join(', ');

            const displayUnitPrice = getItemDisplayPrice(
              item.unitPrice,
              formData.vatIncluded,
              totals.discountRate
            );
            const displayTotal = displayUnitPrice * item.quantity;

            // 추가상품 행 포함
            const rows = [];

            // 메인 상품 행
            rows.push(
              <tr key={item.id}>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {idx + 1}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {item.product.product_name}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-[9px] text-gray-600">
                  {optionText || '-'}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {item.quantity.toLocaleString()}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right">
                  {displayUnitPrice.toLocaleString()}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right">
                  {displayTotal.toLocaleString()}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-[9px] text-gray-500">
                  {totals.discountRate > 0 ? `${totals.discountRate}% 할인` : ''}
                </td>
              </tr>
            );

            // 추가상품 하위 행
            item.addons.forEach((addon) => {
              const addonPrice = formData.vatIncluded
                ? addon.unitPrice
                : addon.unitPrice;
              const addonTotal = addonPrice * addon.quantity;
              rows.push(
                <tr key={`${item.id}-addon-${addon.name}`} className="text-gray-600">
                  <td className="border border-gray-300 px-2 py-1 text-center">
                  </td>
                  <td className="border border-gray-300 px-2 py-1 pl-4 text-[9px]">
                    +{addon.name}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    추가상품
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {addon.quantity.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    {addonPrice.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    {addonTotal.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-2 py-1"></td>
                </tr>
              );
            });

            return rows;
          })}

          {/* 빈 행으로 테이블 채우기 (최소 10행) */}
          {Array.from({
            length: Math.max(0, 10 - items.reduce((count, item) => count + 1 + item.addons.length, 0)),
          }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-gray-300 px-2 py-1 text-center">
                &nbsp;
              </td>
              <td className="border border-gray-300 px-2 py-1">&nbsp;</td>
              <td className="border border-gray-300 px-2 py-1">&nbsp;</td>
              <td className="border border-gray-300 px-2 py-1">&nbsp;</td>
              <td className="border border-gray-300 px-2 py-1">&nbsp;</td>
              <td className="border border-gray-300 px-2 py-1">&nbsp;</td>
              <td className="border border-gray-300 px-2 py-1">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 합계 영역 */}
      <table className="mb-6 w-full border-collapse border border-gray-400 text-[10px]">
        <tbody>
          <tr className="bg-gray-50">
            <td className="border border-gray-300 px-3 py-2 font-semibold text-center w-[100px]">
              공급가액
            </td>
            <td className="border border-gray-300 px-3 py-2 text-right">
              {supplyAmount.toLocaleString()}원
            </td>
            <td className="border border-gray-300 px-3 py-2 font-semibold text-center w-[100px]">
              부가세
            </td>
            <td className="border border-gray-300 px-3 py-2 text-right">
              {vat.toLocaleString()}원
            </td>
            <td className="border border-gray-300 px-3 py-2 font-semibold text-center w-[100px] bg-gray-100">
              합 계
            </td>
            <td className="border border-gray-300 px-3 py-2 text-right font-bold">
              {grandTotal.toLocaleString()}원
            </td>
          </tr>
        </tbody>
      </table>

      {/* 메모란 */}
      {formData.memo && (
        <div className="mb-4 rounded border border-gray-300 p-3">
          <p className="mb-1 text-[10px] font-semibold text-gray-600">메모</p>
          <p className="whitespace-pre-wrap text-[10px] text-gray-700">
            {formData.memo}
          </p>
        </div>
      )}

      {/* 하단 안내 */}
      <div className="mt-6 space-y-1 text-center text-[9px] text-gray-400">
        <p>위 금액으로 견적합니다.</p>
        <p>본 견적서의 유효기간은 발행일로부터 30일입니다.</p>
      </div>
    </div>
  );
}
