import { describe, it, expect } from 'vitest';
import { calculateCostPerUse } from './costPerUse';
import { INITIAL_CANCELLATION_GUIDES, findCancellationGuide } from './initialGuides';

describe('6단계 가성비 체크 (D7)', () => {
  it('사용 횟수가 0회이면 회당 비용 대신 "이번 달 사용하지 않음"이 표시되고 isUnused가 true이다', () => {
    const result = calculateCostPerUse(17000, 0);

    expect(result.usageCount).toBe(0);
    expect(result.costPerUse).toBeNull();
    expect(result.statusLabel).toBe('이번 달 사용하지 않음');
    expect(result.isUnused).toBe(true);
  });

  it('사용 횟수가 음수이거나 잘못된 값이 들어와도 0회로 안전하게 처리된다', () => {
    const result = calculateCostPerUse(17000, -5);

    expect(result.usageCount).toBe(0);
    expect(result.costPerUse).toBeNull();
    expect(result.statusLabel).toBe('이번 달 사용하지 않음');
    expect(result.isUnused).toBe(true);
  });

  it('17,000원 구독을 월 10회 이용 시 회당 1,700원으로 계산된다', () => {
    const result = calculateCostPerUse(17000, 10);

    expect(result.usageCount).toBe(10);
    expect(result.costPerUse).toBe(1700);
    expect(result.statusLabel).toBe('회당 1,700원');
    expect(result.isUnused).toBe(false);
  });

  it('9,900원 구독을 월 30회 이용 시 회당 330원으로 계산된다', () => {
    const result = calculateCostPerUse(9900, 30);

    expect(result.usageCount).toBe(30);
    expect(result.costPerUse).toBe(330);
    expect(result.statusLabel).toBe('회당 330원');
    expect(result.isUnused).toBe(false);
  });
});

describe('6단계 해지 가이드 (F1)', () => {
  it('초기 해지 가이드 데이터는 모두 "예시" 라벨(isExample: true)이 붙어 있다', () => {
    expect(INITIAL_CANCELLATION_GUIDES.length).toBeGreaterThan(0);
    for (const guide of INITIAL_CANCELLATION_GUIDES) {
      expect(guide.isExample).toBe(true);
    }
  });

  it('결제 경로(web, appstore, googleplay)에 따라 알맞은 해지 가이드를 찾을 수 있다', () => {
    const webGuide = findCancellationGuide(INITIAL_CANCELLATION_GUIDES, '넷플릭스', 'web');
    expect(webGuide).toBeDefined();
    expect(webGuide?.channel).toBe('web');
    expect(webGuide?.directCancelUrl).toContain('netflix.com');

    const appStoreGuide = findCancellationGuide(INITIAL_CANCELLATION_GUIDES, '넷플릭스', 'appstore');
    expect(appStoreGuide).toBeDefined();
    expect(appStoreGuide?.channel).toBe('appstore');
    expect(appStoreGuide?.directCancelUrl).toContain('apple.com');

    const googlePlayGuide = findCancellationGuide(INITIAL_CANCELLATION_GUIDES, '넷플릭스', 'googleplay');
    expect(googlePlayGuide).toBeDefined();
    expect(googlePlayGuide?.channel).toBe('googleplay');
    expect(googlePlayGuide?.directCancelUrl).toContain('play.google.com');
  });

  it('등록되지 않은 서비스의 경우 undefined를 반환한다', () => {
    const unknown = findCancellationGuide(INITIAL_CANCELLATION_GUIDES, '미등록서비스XYZ');
    expect(unknown).toBeUndefined();
  });
});
