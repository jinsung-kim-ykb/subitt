import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyEquivalent,
  calculateYearlyEquivalent,
  calculateTotalSpend,
  calculateRemainingThisMonth,
  getUpcomingPayments,
  calculateCategorySpend
} from './calculations';
import { Subscription } from '../types';

const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    userId: 'user1',
    serviceName: '넷플릭스',
    category: '영상',
    amount: 13500,
    currency: 'KRW',
    billingCycle: 'monthly',
    nextBillingDate: '2026-11-28',
    isFreeTrial: false,
    registrationMethod: 'manual',
    status: 'active',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01'
  },
  {
    id: '2',
    userId: 'user1',
    serviceName: '쿠팡 와우 (연간)',
    category: '쇼핑 멤버십',
    amount: 58800,
    currency: 'KRW',
    billingCycle: 'yearly',
    nextBillingDate: '2026-12-15',
    isFreeTrial: false,
    registrationMethod: 'manual',
    status: 'active',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01'
  },
  {
    id: '3',
    userId: 'user1',
    serviceName: '유튜브 프리미엄 (무료체험)',
    category: '영상',
    amount: 0,
    currency: 'KRW',
    billingCycle: 'monthly',
    nextBillingDate: '2026-11-30',
    isFreeTrial: true,
    postTrialAmount: 14900,
    registrationMethod: 'manual',
    status: 'active',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01'
  }
];

describe('구독료 계산 규칙 단위 테스트 (SPEC 4장 B1~B4)', () => {
  it('B1: 월간 및 연간 결제의 월 환산액이 올바르게 계산되어야 한다', () => {
    expect(calculateMonthlyEquivalent(mockSubscriptions[0])).toBe(13500);
    expect(calculateMonthlyEquivalent(mockSubscriptions[1])).toBe(4900);
    expect(calculateMonthlyEquivalent(mockSubscriptions[2])).toBe(0);
  });

  it('B1: 연 환산액이 올바르게 계산되어야 한다', () => {
    expect(calculateYearlyEquivalent(mockSubscriptions[0])).toBe(13500 * 12);
    expect(calculateYearlyEquivalent(mockSubscriptions[1])).toBe(58800);
  });

  it('B1: 전체 월/연 환산 합계가 정확해야 한다', () => {
    const totals = calculateTotalSpend(mockSubscriptions);
    expect(totals.monthlyTotal).toBe(18400);
  });

  it('B2: 이번 달 남은 결제 예정액이 올바르게 계산되어야 한다', () => {
    const refDate = new Date('2026-11-25T00:00:00');
    expect(calculateRemainingThisMonth(mockSubscriptions, refDate)).toBe(13500);
  });

  it('B3: 다가오는 결제가 날짜순으로 정렬되어야 한다', () => {
    const refDate = new Date('2026-11-25T00:00:00');
    const upcoming = getUpcomingPayments(mockSubscriptions, refDate);
    expect(upcoming[0].subscription.serviceName).toBe('넷플릭스');
  });

  it('B4: 카테고리별 지출 통계 및 비율이 정확해야 한다', () => {
    const stats = calculateCategorySpend(mockSubscriptions);
    expect(stats.length).toBe(2);
  });
});
