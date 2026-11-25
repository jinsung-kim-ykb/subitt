import { describe, it, expect } from 'vitest';
import {
  calculateDefenseOpportunities,
  DEFAULT_MAX_CATALOG_AGE_DAYS,
} from './defense';
import { Subscription, PlanCatalogItem, BundleRule } from '../../types';

describe('4단계 구독료 방어 SPEC 7장 5대 규칙 단위 테스트', () => {
  const fixedNow = new Date('2026-11-25T00:00:00Z');

  const mockSubs: Subscription[] = [
    {
      id: 'sub-disney',
      userId: 'user-1',
      serviceName: '디즈니플러스',
      planName: '스탠다드',
      category: '영상',
      amount: 11500,
      currency: 'KRW',
      billingCycle: 'monthly',
      nextBillingDate: '2026-12-01',
      isFreeTrial: false,
      registrationMethod: 'manual',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'sub-netflix',
      userId: 'user-1',
      serviceName: '넷플릭스',
      planName: '프리미엄',
      category: '영상',
      amount: 17000,
      currency: 'KRW',
      billingCycle: 'monthly',
      nextBillingDate: '2026-12-05',
      isFreeTrial: false,
      registrationMethod: 'manual',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
  ];

  const mockPlans: PlanCatalogItem[] = [
    {
      id: 'plan-disney-ad',
      serviceId: 'disney',
      serviceName: '디즈니플러스',
      planName: '광고형 스탠다드',
      category: '영상',
      amount: 7000, // 11,500 - 7,000 = 4,500원 절감
      currency: 'KRW',
      billingCycle: 'monthly',
      features: '광고 포함',
      isExample: true,
      updatedAt: '2026-11-20T00:00:00Z', // 5일 전 갱신 (유효)
    },
    {
      id: 'plan-netflix-standard',
      serviceId: 'netflix',
      serviceName: '넷플릭스',
      planName: '스탠다드',
      category: '영상',
      amount: 13500, // 17,000 - 13,500 = 3,500원 절감
      currency: 'KRW',
      billingCycle: 'monthly',
      isExample: true,
      updatedAt: '2026-11-20T00:00:00Z',
    },
    {
      id: 'plan-netflix-ad',
      serviceId: 'netflix',
      serviceName: '넷플릭스',
      planName: '광고형 스탠다드',
      category: '영상',
      amount: 5500, // 17,000 - 5,500 = 11,500원 절감
      currency: 'KRW',
      billingCycle: 'monthly',
      isExample: true,
      updatedAt: '2026-11-20T00:00:00Z',
    },
  ];

  const mockBundles: BundleRule[] = [
    {
      id: 'bundle-netflix-telecom',
      serviceId: 'netflix',
      serviceName: '넷플릭스',
      bundleName: '통신사 5G 결합',
      provider: 'SKT',
      discountedAmount: 9900, // 17,000 - 9,900 = 7,100원 절감
      originalAmount: 17000,
      condition: '특정 요금제 이용 시',
      actionUrl: 'https://example.com',
      isExample: true,
      updatedAt: '2026-11-20T00:00:00Z',
    },
  ];

  it('규칙 1: 대안이 여러 개일 때 구독당 최대 절감액 1건만 합계에 들어간다', () => {
    // 넷플릭스 17,000원에 대해 대안 3개 존재:
    // 1) 스탠다드: 3,500원 절감
    // 2) 광고형: 11,500원 절감 (최대)
    // 3) 통신사 결합: 7,100원 절감
    // 디즈니플러스 11,500원에 대해 1개:
    // 1) 광고형: 4,500원 절감
    // 총합은 11,500 + 4,500 = 16,000원이어야 함 (단순 합산 26,600원이 아님!)
    const result = calculateDefenseOpportunities(mockSubs, mockPlans, mockBundles, {
      now: fixedNow,
    });

    expect(result.totalMonthlySavings).toBe(16000);
    // 추천 목록에는 비교를 위해 모든 대안(4개)이 담겨 있음
    expect(result.opportunitiesCount).toBe(4);
  });

  it('규칙 2: 중복 구독(동일 카테고리 2개 이상)이 감지되고 중복 경고가 생성된다', () => {
    const result = calculateDefenseOpportunities(mockSubs, mockPlans, mockBundles, {
      now: fixedNow,
    });

    // 영상(OTT) 카테고리에 디즈니, 넷플릭스 2개가 있으므로 중복 경고 생성
    expect(result.duplicateWarnings).toHaveLength(1);
    expect(result.duplicateWarnings[0].category).toBe('영상');
    expect(result.duplicateWarnings[0].services).toContain('디즈니플러스');
    expect(result.duplicateWarnings[0].services).toContain('넷플릭스');
    expect(result.duplicateWarnings[0].monthlyTotal).toBe(28500); // 11,500 + 17,000
  });

  it('규칙 3: 사용자가 "해당 없음"을 누른 제안은 합계와 추천 목록에서 즉시 빠진다', () => {
    // 사용자가 넷플릭스 광고형(11,500원 절감)을 "해당 없음" 처리함
    const dismissed = new Set<string>(['downgrade:sub-netflix:plan-netflix-ad']);

    const result = calculateDefenseOpportunities(mockSubs, mockPlans, mockBundles, {
      now: fixedNow,
      dismissedRecommendationIds: dismissed,
    });

    // 이제 넷플릭스의 최대 절감 대안은 통신사 결합(7,100원)이 됨
    // 디즈니 광고형(4,500원) + 넷플릭스 결합(7,100원) = 11,600원
    expect(result.totalMonthlySavings).toBe(11600);
    expect(result.opportunitiesCount).toBe(3);
    expect(result.recommendations.some((r) => r.id === 'downgrade:sub-netflix:plan-netflix-ad')).toBe(false);
  });

  it('규칙 4: 요금표 갱신일이 45일(설정값)을 초과한 오래된 요금은 합계에서 제외된다', () => {
    const oldPlans: PlanCatalogItem[] = [
      {
        id: 'plan-disney-old',
        serviceId: 'disney',
        serviceName: '디즈니플러스',
        planName: '구 요금제',
        category: '영상',
        amount: 7000,
        currency: 'KRW',
        billingCycle: 'monthly',
        isExample: true,
        // 2026-11-25 기준 60일 전 갱신된 요금표 (45일 기준 초과)
        updatedAt: '2026-09-20T00:00:00Z',
      },
    ];

    const result = calculateDefenseOpportunities(
      [mockSubs[0]], // 디즈니플러스만
      oldPlans,
      [],
      { now: fixedNow, maxCatalogAgeDays: 45 }
    );

    // 오래된 요금 정보이므로 제안에 포함되지 않아야 함
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.opportunitiesCount).toBe(0);
  });

  it('규칙 5: 홈 화면의 절감 예상액과 줄이기 화면 제안들의 유효 합이 100% 일치한다', () => {
    const result = calculateDefenseOpportunities(mockSubs, mockPlans, mockBundles, {
      now: fixedNow,
    });

    // 줄이기 화면에서 그룹핑 후 채택된 제안들의 합계 계산
    const subMaxMap = new Map<string, number>();
    for (const r of result.recommendations) {
      const cur = subMaxMap.get(r.subscriptionId) || 0;
      if (r.monthlySavings > cur) {
        subMaxMap.set(r.subscriptionId, r.monthlySavings);
      }
    }

    let calculatedSum = 0;
    subMaxMap.forEach((v) => (calculatedSum += v));

    expect(result.totalMonthlySavings).toBe(calculatedSum);
  });
});
