import { ExtractedSmsItem, SmsParser } from '../types';

/**
 * 신한카드 결제 및 취소 문자 파서
 * 예시:
 * [Web발신]
 * 신한체크승인 홍*동(1234)
 * 11/25 13:20 (일시불)
 * 13,500원
 * 넷플릭스
 * 잔액 123,450원
 *
 * 취소 예시:
 * [Web발신]
 * 신한체크취소 홍*동(1234) 11/25 13:50 13,500원 넷플릭스
 */
export const shinhanParser: SmsParser = {
  cardCompany: '신한카드',

  canParse(text: string): boolean {
    return text.includes('신한') || text.includes('신한카드') || text.includes('신한체크');
  },

  parse(text: string): ExtractedSmsItem | null {
    const isCancellation = /취소|승인취소/.test(text);

    // 금액 추출: 13,500원 또는 13500원
    const amountMatch = text.match(/([0-9,]+)\s*원/);
    if (!amountMatch) return null;
    const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);

    // 날짜/시간 추출: 11/25 13:20
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
    const now = new Date();
    let paidAt = `${now.getFullYear()}-11-25`;
    if (dateMatch) {
      const month = dateMatch[1].padStart(2, '0');
      const day = dateMatch[2].padStart(2, '0');
      const year = now.getFullYear();
      paidAt = `${year}-${month}-${day}`;
    }

    // 가맹점명 추출: 금액 줄 다음 줄 또는 원 뒤에 오는 단어
    let merchantName = '';
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const amountLineIdx = lines.findIndex(l => l.includes('원'));

    if (amountLineIdx !== -1 && lines[amountLineIdx + 1]) {
      const nextLine = lines[amountLineIdx + 1];
      if (!nextLine.includes('잔액') && !nextLine.includes('누적')) {
        merchantName = nextLine;
      }
    }

    if (!merchantName) {
      // 한 줄 포맷인 경우: 금액 뒤의 텍스트
      const afterAmount = text.split('원')[1];
      if (afterAmount) {
        const clean = afterAmount.replace(/잔액.*$/, '').replace(/누적.*$/, '').trim();
        const parts = clean.split(/\s+/);
        merchantName = parts[0] || '';
      }
    }

    if (!merchantName) {
      return null;
    }

    return {
      cardCompany: '신한카드',
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
