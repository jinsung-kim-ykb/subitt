import { ExtractedSmsItem, SmsParser } from '../types';

/**
 * 현대카드 결제 및 취소 문자 파서
 * 예시:
 * [Web발신]
 * 현대카드 ZERO 승인
 * 홍*동
 * 14,900원(일시불)
 * 11/25 12:30
 * 유튜브프리미엄
 */
export const hyundaiParser: SmsParser = {
  cardCompany: '현대카드',

  canParse(text: string): boolean {
    return text.includes('현대카드');
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
    // 현대카드는 보통 날짜 다음 줄에 가맹점명이 옴
    const dateLineIdx = lines.findIndex(l => /(\d{1,2})\/(\d{1,2})/.test(l));
    if (dateLineIdx !== -1 && lines[dateLineIdx + 1]) {
      merchantName = lines[dateLineIdx + 1];
    } else {
      const amountLineIdx = lines.findIndex(l => l.includes('원'));
      if (amountLineIdx !== -1 && lines[amountLineIdx + 1]) {
        merchantName = lines[amountLineIdx + 1];
      }
    }

    if (!merchantName) return null;

    return {
      cardCompany: '현대카드',
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
