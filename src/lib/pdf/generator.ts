// PDF 생성 유틸리티
// html2canvas-pro + jsPDF를 사용해 미리보기 DOM을 캡처하여 PDF로 변환

import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface PdfOptions {
  /** 캡처할 DOM 요소의 id */
  elementId: string;
  /** 파일명 (확장자 제외) */
  fileName: string;
}

/**
 * DOM 요소를 캡처하여 A4 PDF로 다운로드
 */
export async function downloadPdf({ elementId, fileName }: PdfOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  // html2canvas로 DOM 캡처
  // onclone: input 요소를 span으로 교체하여 텍스트가 잘리지 않게 함
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDoc, clonedElement) => {
      // 모든 input[type="text"]를 span으로 교체
      const textInputs = clonedElement.querySelectorAll('input[type="text"]');
      textInputs.forEach((input) => {
        const inp = input as HTMLInputElement;
        const span = clonedDoc.createElement('span');
        span.textContent = inp.value || '';
        span.style.cssText = window.getComputedStyle(inp).cssText;
        span.style.display = 'inline-block';
        span.style.width = inp.offsetWidth + 'px';
        span.style.whiteSpace = 'nowrap';
        span.style.overflow = 'visible';
        inp.parentNode?.replaceChild(span, inp);
      });
      // date input도 처리
      const dateInputs = clonedElement.querySelectorAll('input[type="date"]');
      dateInputs.forEach((input) => {
        const inp = input as HTMLInputElement;
        inp.style.display = 'none';
      });
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // A4 사이즈 (mm)
  const a4Width = 210;
  const a4Height = 297;
  const margin = 10; // 여백

  const contentWidth = a4Width - margin * 2;
  const contentHeight = (imgHeight * contentWidth) / imgWidth;

  const pdf = new jsPDF({
    orientation: contentHeight > a4Height ? 'portrait' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 이미지가 한 페이지를 넘으면 여러 페이지로 분할
  if (contentHeight <= a4Height - margin * 2) {
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
  } else {
    // 여러 페이지 처리
    let remainingHeight = contentHeight;
    let position = 0;
    const pageContentHeight = a4Height - margin * 2;

    while (remainingHeight > 0) {
      // 캔버스에서 현재 페이지에 해당하는 부분만 잘라내기
      const sliceHeight = Math.min(pageContentHeight, remainingHeight);
      const sliceCanvasHeight = (sliceHeight / contentWidth) * imgWidth;
      const sliceY = (position / contentWidth) * imgWidth;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = sliceCanvasHeight;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, sliceY, imgWidth, sliceCanvasHeight,
          0, 0, imgWidth, sliceCanvasHeight,
        );
      }

      const pageImgData = pageCanvas.toDataURL('image/png');

      if (position > 0) {
        pdf.addPage();
      }
      pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, sliceHeight);

      remainingHeight -= pageContentHeight;
      position += pageContentHeight;
    }
  }

  pdf.save(`${fileName}.pdf`);
}
