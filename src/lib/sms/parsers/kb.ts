import { ExtractedSmsItem, SmsParser } from '../types';

/**
 * KB국민카드 결제 및 취소 문자 파서
 * 예시:
 * [Web발신]
 * KB국민카드 홍*동님
 * 11/25 14:00
 * 11,500원(일시불)
 * 디즈니플러스
 * 누적-150,000원
 */
export const kbParser: SmsParser = {
  cardCompany: 'KB국민카드',

  canParse(text: string): boolean {
    return text.includes('KB') || text.includes('국민카드');
  },

  parse(text: string): ExtractedSmsItem | null {
    const isCancellation = /취소|승인취소/.test(text);

    const amountMatch = text.match(/([0-9,]+)\s*원/);
    if (!amountMatch) return null;
    const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);

    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
    const now = new Date();
    let paidAt = `${now.getFullYear()}-11-25`;
    if (dateMatch) {
      const month = dateMatch[1].padStart(2, '0');
      const day = dateMatch[2].padStart(2, '0');
      paidAt = `${now.getFullYear()}-${month}-${day}`;
    }

    let merchantName = '';
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const amountLineIdx = lines.findIndex(l => l.includes('원'));

    if (amountLineIdx !== -1 && lines[amountLineIdx + 1]) {
      const nextLine = lines[amountLineIdx + 1];
      if (!nextLine.includes('누적') && !nextLine.includes('잔액')) {
        merchantName = nextLine;
      }
    }

    if (!merchantName) {
      const afterAmount = text.split(/원(?:\(일시불\))?/)[1];
      if (afterAmount) {
        const clean = afterAmount.replace(/누적.*$/, '').replace(/잔액.*$/, '').trim();
        merchantName = clean.split(/\s+/)[0] || '';
      }
    }

    if (!merchantName) return null;

    return {
      cardCompany: 'KB국민카드',
      merchantName: merchantName.trim(),
      amount,
      currency: 'KRW',
      paidAt,
      isCancellation,
      confidence: 0.95,
      rawSnippet: text
    };
  }
};
