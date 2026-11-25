/**
 * 개인정보 가림(Masking) 처리 순수 함수 (AGENTS.md 7장, SPEC 9장)
 * AI API 또는 외부로 문자가 전송되기 전에 무조건 거쳐야 함.
 * 가림 대상: 카드번호, 한국인 성명, 통장/계좌 잔액
 */

export interface MaskingResult {
  maskedText: string;
  maskedCount: {
    cardNumbers: number;
    names: number;
    balances: number;
  };
}

/**
 * 1. 카드번호 가림
 * 예: 1234-5678-9012-3456, 1234567890123456, (1234), [1234] 등
 */
export function maskCardNumber(text: string): { text: string; count: number } {
  let count = 0;

  // 1-1. 하이픈 연결된 15~16자리 카드번호 (예: 1234-5678-9012-3456)
  const fullCardPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{3,4}\b/g;
  let result = text.replace(fullCardPattern, () => {
    count++;
    return '[카드번호 가림]';
  });

  // 1-2. 카드사 문자에 흔히 나오는 카드 뒷 4자리 패턴 (예: (1234), [1234], 카드(1234), 끝자리 1234)
  const endDigitPattern = /(?:\(|\b)(?:카드)?(?:\s?끝(?:자리)?\s?)?(\d{4})(?:\)|\b)/g;
  result = result.replace(endDigitPattern, (match, digits) => {
    // 연도 표기(2025, 2026 등)나 시간(1230 등)은 제외하기 위한 검증
    const num = parseInt(digits, 10);
    if (num >= 2020 && num <= 2030) return match; // 연도는 제외
    if (match.includes(':')) return match; // 시간 포맷 제외
    count++;
    return match.replace(digits, '****');
  });

  return { text: result, count };
}

/**
 * 2. 한국인 이름 가림
 * 카드사 문자에 흔히 찍히는: '홍*동님', '홍길동님', '승인 홍*동', '홍길동 회원님' 등
 */
export function maskName(text: string): { text: string; count: number } {
  let count = 0;

  // 2-1. '홍*동' 또는 '홍길동' 뒤에 님/회원/고객 등이 붙은 경우
  const nameSuffixPattern = /([가-힣]{1}[*가-힣]{1,3})\s*(?:님|회원(?:님)?|고객(?:님)?)/g;
  let result = text.replace(nameSuffixPattern, () => {
    count++;
    return '[이름 가림]님';
  });

  // 2-2. 카드 승인 뒤에 나오는 이름 패턴: '체크승인 홍*동' 등
  const nameApprovalPattern = /((?:체크)?승인|카드)\s+([가-힣]{1}[*가-힣]{1,2})(\s|\()/g;
  result = result.replace(nameApprovalPattern, (_match, p1, _name, p3) => {
    count++;
    return `${p1} [이름 가림]${p3}`;
  });

  return { text: result, count };
}

/**
 * 3. 잔액 가림
 * 카드사 문자에 찍히는: '잔액 123,450원', '통장잔액 1,000,000원', '잔여한도 500,000원' 등
 */
export function maskBalance(text: string): { text: string; count: number } {
  let count = 0;

  const balancePattern = /(?:잔액|통장잔액|잔여한도|누적|누적액|이용한도)\s*[-:]?\s*([0-9,]+(?:\s*원)?)/g;
  const result = text.replace(balancePattern, (match) => {
    count++;
    const prefix = match.split(/[-:\s0-9]/)[0];
    return `${prefix} [잔액 가림]`;
  });

  return { text: result, count };
}

/**
 * 통합 가림 처리 순수 함수
 */
export function maskSensitiveData(rawText: string): MaskingResult {
  const cardResult = maskCardNumber(rawText);
  const nameResult = maskName(cardResult.text);
  const balanceResult = maskBalance(nameResult.text);

  return {
    maskedText: balanceResult.text,
    maskedCount: {
      cardNumbers: cardResult.count,
      names: nameResult.count,
      balances: balanceResult.count
    }
  };
}
