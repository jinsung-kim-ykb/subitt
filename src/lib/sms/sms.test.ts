import { describe, it, expect } from 'vitest';
import { parseSingleSms, parseMultiSms } from './index';
import { INITIAL_CATALOG } from '../constants';

describe('카드사별 결제 문자 파서 단위 테스트 (SPEC 6장)', () => {
  it('신한카드 승인 문자를 올바르게 추출하고 카탈로그와 매칭해야 한다', () => {
    const sms = `[Web발신]
신한체크승인 홍*동(1234)
11/25 13:20 (일시불)
13,500원
넷플릭스
잔액 123,450원`;

    const res = parseSingleSms(sms, INITIAL_CATALOG);
    expect(res).not.toBeNull();
    expect(res?.cardCompany).toBe('신한카드');
    expect(res?.amount).toBe(13500);
    expect(res?.matchedServiceName).toBe('넷플릭스');
    expect(res?.category).toBe('영상');
    expect(res?.isCancellation).toBe(false);
  });

  it('KB국민카드 승인 문자를 올바르게 추출해야 한다', () => {
    const sms = `[Web발신]
KB국민카드 홍*동님
11/25 14:00
11,500원(일시불)
디즈니플러스
누적-150,000원`;

    const res = parseSingleSms(sms, INITIAL_CATALOG);
    expect(res).not.toBeNull();
    expect(res?.cardCompany).toBe('KB국민카드');
    expect(res?.amount).toBe(11500);
    expect(res?.matchedServiceName).toBe('디즈니플러스');
  });

  it('현대카드 승인 문자를 올바르게 추출해야 한다', () => {
    const sms = `[Web발신]
현대카드 ZERO 승인
홍*동
14,900원(일시불)
11/25 12:30
유튜브프리미엄`;

    const res = parseSingleSms(sms, INITIAL_CATALOG);
    expect(res).not.toBeNull();
    expect(res?.cardCompany).toBe('현대카드');
    expect(res?.amount).toBe(14900);
    expect(res?.matchedServiceName).toBe('유튜브 프리미엄');
  });

  it('삼성카드 승인 문자를 올바르게 추출해야 한다', () => {
    const sms = `[Web발신]
삼성카드 홍*동
11/25 10:15
7,890원 일시불
쿠팡`;

    const res = parseSingleSms(sms, INITIAL_CATALOG);
    expect(res).not.toBeNull();
    expect(res?.cardCompany).toBe('삼성카드');
    expect(res?.amount).toBe(7890);
    expect(res?.matchedServiceName).toBe('쿠팡 와우');
  });

  it('외화 결제 문자에서 옵션 A(원화 병기 우선)를 올바르게 처리해야 한다', () => {
    const sms = `[해외승인] US$ 20.00 (KRW 28,000) OPENAI 11/25`;
    const res = parseSingleSms(sms, INITIAL_CATALOG);
    expect(res).not.toBeNull();
    expect(res?.currency).toBe('USD');
    expect(res?.amount).toBe(28000); // 원화 표기 우선
  });

  it('승인 취소 문자를 인식해야 한다 (SPEC 6장 5번)', () => {
    const sms = `[Web발신]
신한체크취소 홍*동(1234)
11/25 13:50 (일시불)
13,500원
넷플릭스`;

    const res = parseSingleSms(sms, INITIAL_CATALOG);
    expect(res).not.toBeNull();
    expect(res?.isCancellation).toBe(true);
    expect(res?.amount).toBe(13500);
  });

  it('여러 건의 문자를 한 번에 붙여넣었을 때 건별로 분리 추출해야 한다 (A1)', () => {
    const multiSms = `[Web발신]
신한체크승인 홍*동(1234)
11/25 13:20 (일시불)
13,500원
넷플릭스

[Web발신]
삼성카드 홍*동
11/25 10:15
7,890원 일시불
쿠팡`;

    const items = parseMultiSms(multiSms, INITIAL_CATALOG);
    expect(items.length).toBe(2);
    expect(items[0].matchedServiceName).toBe('넷플릭스');
    expect(items[1].matchedServiceName).toBe('쿠팡 와우');
  });
});
