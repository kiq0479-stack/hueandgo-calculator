'use client';

import Image from 'next/image';
import type { QuoteItem as QuoteItemType } from '@/components/calculator/Calculator';
import type { QuoteTotals } from '@/hooks/useQuote';
import {
  getTemplateById,
  type BusinessInfo,
  type QuoteFormData,
} from '@/lib/quote/templates';

interface InvoicePreviewProps {
  items: QuoteItemType[];
  totals: QuoteTotals;
  formData: QuoteFormData;
}

// 날짜 포맷: YYYY-MM-DD -> YYYY년 MM월 DD일
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${m}월 ${d}일`;
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
    return {
      supplyAmount: totals.supplyAmount,
      vat: totals.vat,
      grandTotal: totals.grandTotal,
    };
  } else {
    const afterDiscount = totals.subtotal - totals.discountAmount;
    const supplyAmount = afterDiscount;
    const vat = Math.round(supplyAmount * 0.1);
    const grandTotal = supplyAmount + vat;
    return { supplyAmount, vat, grandTotal };
  }
}

// 개별 항목의 단가를 할인율 적용해서 계산
function getItemDisplayPrice(
  unitPrice: number,
  discountRate: number
): number {
  return Math.round(unitPrice * (1 - discountRate / 100));
}

/** 거래명세서 미리보기 (공급자/공급받는자 양쪽 사업자정보 표기) */
export default function InvoicePreview({
  items,
  totals,
  formData,
}: InvoicePreviewProps) {
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
          견적 항목을 추가하면 거래명세서 미리보기가 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div
      id="invoice-preview"
      className="mx-auto max-w-[210mm] border border-gray-300 bg-white p-8 text-[11px] leading-relaxed text-black print:border-none print:p-0"
      style={{ fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}
    >
      {/* 제목 */}
      <h2 className="mb-6 text-center text-2xl font-bold tracking-widest">
        거 래 명 세 서
      </h2>

      {/* 상단: 공급자 / 공급받는자 2열 구조 */}
      <div className="mb-4 flex gap-4">
        {/* 공급자 정보 */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-gray-400 text-[10px]">
            <thead>
              <tr>
                <th
                  className="border border-gray-300 bg-gray-100 px-2 py-1.5 text-center"
                  colSpan={4}
                >
                  공 급 자
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold w-[60px]">
                  등록번호
                </td>
                <td className="border border-gray-300 px-2 py-1" colSpan={3}>
                  {template.registrationNumber}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold">
                  상 호
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {template.companyName}
                </td>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold w-[40px]">
                  대표
                </td>
                <td className="border border-gray-300 px-2 py-1 relative w-[60px]">
                  {template.representative}
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

        {/* 공급받는자 정보 */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-gray-400 text-[10px]">
            <thead>
              <tr>
                <th
                  className="border border-gray-300 bg-gray-100 px-2 py-1.5 text-center"
                  colSpan={2}
                >
                  공 급 받 는 자
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold w-[60px]">
                  상 호
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {formData.recipient || '(미입력)'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold">
                  거래일자
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {formatDate(formData.date)}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold" colSpan={2}>
                  &nbsp;
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold" colSpan={2}>
                  &nbsp;
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 합계 금액 바 */}
      <div className="mb-4 rounded border border-gray-400 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">합계금액</span>
          <span className="text-base font-bold text-gray-900">
            {grandTotal.toLocaleString()}원
          </span>
        </div>
        <p className="mt-0.5 text-right text-[10px] text-gray-500">
          {formData.vatIncluded
            ? '(부가세 포함)'
            : `(공급가액 ${supplyAmount.toLocaleString()}원 + 부가세 ${vat.toLocaleString()}원)`}
        </p>
      </div>

      {/* 거래 항목 테이블 */}
      <table className="mb-4 w-full border-collapse border border-gray-400 text-[10px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1.5 text-center w-[30px]">
              No
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-center w-[60px]">
              월일
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-left">
              품 명
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-left w-[120px]">
              규 격
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-center w-[50px]">
              수량
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-right w-[75px]">
              단 가
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-right w-[85px]">
              공급가액
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-right w-[70px]">
              세 액
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-left w-[70px]">
              비 고
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const optionText = Object.entries(item.selectedOptions)
              .map(([, v]) => v)
              .join(', ');

            const displayUnitPrice = getItemDisplayPrice(
              item.unitPrice,
              totals.discountRate
            );
            const displayTotal = displayUnitPrice * item.quantity;
            const itemVat = formData.vatIncluded
              ? displayTotal - Math.round(displayTotal / 1.1)
              : Math.round(displayTotal * 0.1);
            const itemSupply = formData.vatIncluded
              ? Math.round(displayTotal / 1.1)
              : displayTotal;

            // 월일: 거래일자에서 MM/DD 추출
            const [, mm, dd] = formData.date.split('-');
            const dateShort = `${mm}/${dd}`;

            const rows = [];

            // 메인 상품 행
            rows.push(
              <tr key={item.id}>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {idx + 1}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {dateShort}
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
                  {itemSupply.toLocaleString()}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right">
                  {itemVat.toLocaleString()}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-[9px] text-gray-500">
                  {totals.discountRate > 0 ? `${totals.discountRate}%` : ''}
                </td>
              </tr>
            );

            // 추가상품 하위 행
            item.addons.forEach((addon) => {
              const addonTotal = addon.unitPrice * addon.quantity;
              const addonVat = formData.vatIncluded
                ? addonTotal - Math.round(addonTotal / 1.1)
                : Math.round(addonTotal * 0.1);
              const addonSupply = formData.vatIncluded
                ? Math.round(addonTotal / 1.1)
                : addonTotal;
              rows.push(
                <tr key={`${item.id}-addon-${addon.name}`} className="text-gray-600">
                  <td className="border border-gray-300 px-2 py-1 text-center">
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {dateShort}
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
                    {addon.unitPrice.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    {addonSupply.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    {addonVat.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-2 py-1"></td>
                </tr>
              );
            });

            return rows;
          })}

          {/* 빈 행 (최소 10행) */}
          {Array.from({
            length: Math.max(0, 10 - items.reduce((count, item) => count + 1 + item.addons.length, 0)),
          }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-gray-300 px-2 py-1">&nbsp;</td>
              <td className="border border-gray-300 px-2 py-1">&nbsp;</td>
              <td className="border border-gray-300 px-2 py-1">&nbsp;</td>
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
              세 액
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

      {/* 비고란 */}
      {formData.memo && (
        <div className="mb-4 rounded border border-gray-300 p-3">
          <p className="mb-1 text-[10px] font-semibold text-gray-600">비고</p>
          <p className="whitespace-pre-wrap text-[10px] text-gray-700">
            {formData.memo}
          </p>
        </div>
      )}

      {/* 하단 안내 */}
      <div className="mt-6 space-y-1 text-center text-[9px] text-gray-400">
        <p>위와 같이 거래합니다.</p>
      </div>
    </div>
  );
}
