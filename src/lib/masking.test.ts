import { describe, it, expect } from 'vitest';
import { maskCardNumber, maskName, maskBalance, maskSensitiveData } from './masking';

describe('개인정보 가림 처리 함수 단위 테스트 (AGENTS.md 7장)', () => {
  it('카드번호 전체 및 뒷 4자리를 정확히 가려야 한다', () => {
    const raw1 = '신한카드(1234) 승인 13,500원';
    const res1 = maskCardNumber(raw1);
    expect(res1.text).toContain('신한카드(****)');

    const raw2 = '결제 카드번호: 1234-5678-9876-5432 결제완료';
    const res2 = maskCardNumber(raw2);
    expect(res2.text).toContain('[카드번호 가림]');
  });

  it('이름(성명 및 마스킹된 이름)을 가려야 한다', () => {
    const raw1 = '신한체크승인 홍*동(1234) 11/25 13:500원';
    const res1 = maskName(raw1);
    expect(res1.text).toContain('신한체크승인 [이름 가림]');

    const raw2 = 'KB국민카드 김철수님 15,000원 결제';
    const res2 = maskName(raw2);
    expect(res2.text).toContain('[이름 가림]님');
  });

  it('계좌 잔액, 누적금액, 한도를 가려야 한다', () => {
    const raw1 = '신한체크승인 13,500원 넷플릭스 잔액 452,000원';
    const res1 = maskBalance(raw1);
    expect(res1.text).toContain('잔액 [잔액 가림]');
    expect(res1.text).not.toContain('452,000원');

    const raw2 = 'KB카드 승인 11,500원 누적-1,250,000원';
    const res2 = maskBalance(raw2);
    expect(res2.text).toContain('누적 [잔액 가림]');
  });

  it('통합 가림 함수가 카드번호, 이름, 잔액을 모두 안전하게 가려야 한다', () => {
    const fullSms = `[Web발신]
신한체크승인 홍*동(5678)
11/25 13:20 (일시불)
13,500원
넷플릭스
잔액 850,000원`;

    const result = maskSensitiveData(fullSms);
    expect(result.maskedText).not.toContain('5678');
    expect(result.maskedText).not.toContain('홍*동');
    expect(result.maskedText).not.toContain('850,000원');
    expect(result.maskedText).toContain('13,500원'); // 결제 금액은 보존
    expect(result.maskedText).toContain('넷플릭스'); // 가맹점은 보존
    expect(result.maskedCount.cardNumbers).toBeGreaterThan(0);
    expect(result.maskedCount.names).toBeGreaterThan(0);
    expect(result.maskedCount.balances).toBeGreaterThan(0);
  });
});
