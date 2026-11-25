import { ExtractedSmsItem, SmsParser } from '../types';

/**
 * 일반 포맷 및 외화 결제 파서 (옵션 A 반영)
 * 예:
 * [해외승인] US$ 20.00 (KRW 28,000) OPENAI 11/25
 * 또는
 * [승인] 10,900원 스포티파이 11/25
 */
export const genericParser: SmsParser = {
  cardCompany: '기타/해외결제',

  canParse(_text: string): boolean {
    return true; // 기본 폴백 파서
  },

  parse(text: string): ExtractedSmsItem | null {
    const isCancellation = /취소|승인취소/.test(text);

    // 1. 외화 결제 패턴 (예: US$ 20.00, USD 20, $20 등 및 원화 병기)
    const foreignMatch = text.match(/(?:US\$|USD|\$)\s*([0-9.]+)/i);
    const wonEquivalentMatch = text.match(/(?:KRW|원화|원)\s*([0-9,]+)/i);

    let amount = 0;
    let currency = 'KRW';

    if (foreignMatch) {
      currency = 'USD';
      // 옵션 A: 문자에 찍힌 원화 청구 금액 우선 사용
      if (wonEquivalentMatch) {
        amount = parseInt(wonEquivalentMatch[1].replace(/,/g, ''), 10);
      } else {
        // 원화 표기가 없을 때 기본 기준환율 1,380원 적용
        const foreignAmount = parseFloat(foreignMatch[1]);
        amount = Math.round(foreignAmount * 1380);
      }
    } else {
      // 일반 원화 결제
      const amountMatch = text.match(/([0-9,]+)\s*원/);
      if (!amountMatch) return null;
      amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
    }

    // 날짜 추출
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
    const now = new Date();
    let paidAt = `${now.getFullYear()}-11-25`;
    if (dateMatch) {
      const month = dateMatch[1].padStart(2, '0');
      const day = dateMatch[2].padStart(2, '0');
      paidAt = `${now.getFullYear()}-${month}-${day}`;
    }

    // 가맹점명 추출 (단어 중 금액, 날짜, 승인 외 텍스트 검색)
    const words = text
      .replace(/\[.*?\]/g, ' ')
      .replace(/[0-9,]+(?:\s*원|\s*USD|\s*US\$)/g, ' ')
      .replace(/\d{1,2}\/\d{1,2}/g, ' ')
      .replace(/일시불|승인|체크|카드|취소/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);

    const merchantName = words[0] || '기타 가맹점';

    return {
      cardCompany: '기타',
      merchantName: merchantName.trim(),
      amount,
      currency,
      paidAt,
      isCancellation,
      confidence: 0.8,
      rawSnippet: text
    };
  }
};
