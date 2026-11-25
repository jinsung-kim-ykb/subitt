import {
  Subscription,
  PlanCatalogItem,
  BundleRule,
  DefenseRecommendation,
  DefenseSummary,
  Category,
} from '../../types';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * 요금표 갱신일 기준 일수 (기본 45일, 설정값으로 분리)
 */
export const DEFAULT_MAX_CATALOG_AGE_DAYS = 45;

export interface DefenseOptions {
  maxCatalogAgeDays?: number;
  dismissedRecommendationIds?: Set<string>;
  now?: Date;
}

/**
 * SPEC 7장 구독료 방어 계산 엔진 (단일 계산 원천 - Single Source of Truth)
 * 규칙 1: 대안이 여러 개일 때 해당 구독당 최대 절감액 1건만 합산
 * 규칙 2: 중복 구독(동일 카테고리 2개 이상) 경고 및 중복분 합산 제외
 * 규칙 3: 사용자가 "해당 없음"을 누른 제안은 제외
 * 규칙 4: 갱신일 기준 일수(기본 45일) 초과 시 제외
 * 규칙 5: 홈 화면 표시 금액과 줄이기 화면 제안의 합이 항상 동일
 */
export function calculateDefenseOpportunities(
  subscriptions: Subscription[],
  planCatalog: PlanCatalogItem[],
  bundleRules: BundleRule[],
  options: DefenseOptions = {}
): DefenseSummary {
  const maxAgeDays = options.maxCatalogAgeDays ?? DEFAULT_MAX_CATALOG_AGE_DAYS;
  const dismissed = options.dismissedRecommendationIds ?? new Set<string>();
  const now = options.now ?? new Date();

  const activeSubs = subscriptions.filter((s) => s.status === 'active' && !s.isFreeTrial);
  const allRecommendations: DefenseRecommendation[] = [];

  for (const sub of activeSubs) {
    const subMonthlyAmount =
      sub.billingCycle === 'yearly' ? Math.round(sub.amount / 12) : sub.amount;

    // 1. 요금제 다운그레이드 대안 탐색 (plan_downgrade)
    const matchingPlans = planCatalog.filter(
      (p) =>
        p.serviceName.trim().toLowerCase() === sub.serviceName.trim().toLowerCase() &&
        p.amount < subMonthlyAmount
    );

    for (const plan of matchingPlans) {
      // 규칙 4: 갱신일 유효성 검사
      const planAge = differenceInDays(now, parseISO(plan.updatedAt));
      if (planAge > maxAgeDays) continue;

      const recId = `downgrade:${sub.id}:${plan.id}`;
      // 규칙 3: 해당 없음 검사
      if (dismissed.has(recId)) continue;

      const monthlySavings = subMonthlyAmount - plan.amount;
      if (monthlySavings > 0) {
        allRecommendations.push({
          id: recId,
          subscriptionId: sub.id,
          serviceName: sub.serviceName,
          type: 'plan_downgrade',
          title: `${sub.serviceName} 요금제 전환`,
          currentPlan: sub.planName || '현재 이용 중인 플랜',
          currentAmount: subMonthlyAmount,
          recommendedPlan: plan.planName,
          recommendedAmount: plan.amount,
          monthlySavings,
          condition: plan.features || '일부 부가 기능 차이 확인 필요',
          catalogUpdatedAt: plan.updatedAt,
          isDismissed: false,
          isExample: plan.isExample,
        });
      }
    }

    // 2. 결합 할인 및 제휴 경로 탐색 (bundle)
    const matchingBundles = bundleRules.filter(
      (b) =>
        b.serviceName.trim().toLowerCase() === sub.serviceName.trim().toLowerCase() &&
        b.discountedAmount < subMonthlyAmount
    );

    for (const bundle of matchingBundles) {
      // 규칙 4: 갱신일 유효성 검사
      const bundleAge = differenceInDays(now, parseISO(bundle.updatedAt));
      if (bundleAge > maxAgeDays) continue;

      const recId = `bundle:${sub.id}:${bundle.id}`;
      // 규칙 3: 해당 없음 검사
      if (dismissed.has(recId)) continue;

      const monthlySavings = subMonthlyAmount - bundle.discountedAmount;
      if (monthlySavings > 0) {
        allRecommendations.push({
          id: recId,
          subscriptionId: sub.id,
          serviceName: sub.serviceName,
          type: 'bundle',
          title: `${bundle.provider} 제휴/결합 할인`,
          currentPlan: sub.planName || '개별 결제',
          currentAmount: subMonthlyAmount,
          recommendedPlan: bundle.bundleName,
          recommendedAmount: bundle.discountedAmount,
          monthlySavings,
          condition: bundle.condition,
          actionUrl: bundle.actionUrl,
          catalogUpdatedAt: bundle.updatedAt,
          isDismissed: false,
          isExample: bundle.isExample,
        });
      }
    }

    // 3. 연간 결제 전환 제안 (월 결제 중일 때 연간 결제 시 할인)
    if (sub.billingCycle === 'monthly') {
      const yearlyPlan = planCatalog.find(
        (p) =>
          p.serviceName.trim().toLowerCase() === sub.serviceName.trim().toLowerCase() &&
          p.billingCycle === 'yearly'
      );

      if (yearlyPlan) {
        const planAge = differenceInDays(now, parseISO(yearlyPlan.updatedAt));
        if (planAge <= maxAgeDays) {
          const recId = `yearly:${sub.id}:${yearlyPlan.id}`;
          if (!dismissed.has(recId)) {
            const monthlyEquivalent = Math.round(yearlyPlan.amount / 12);
            const monthlySavings = subMonthlyAmount - monthlyEquivalent;
            if (monthlySavings > 0) {
              allRecommendations.push({
                id: recId,
                subscriptionId: sub.id,
                serviceName: sub.serviceName,
                type: 'yearly_conversion',
                title: `${sub.serviceName} 연간 결제로 전환`,
                currentPlan: '월간 결제',
                currentAmount: subMonthlyAmount,
                recommendedPlan: `${yearlyPlan.planName} (연간 결제)`,
                recommendedAmount: monthlyEquivalent,
                monthlySavings,
                condition: '1년 단위 일괄 결제 조건',
                catalogUpdatedAt: yearlyPlan.updatedAt,
                isDismissed: false,
                isExample: yearlyPlan.isExample,
              });
            }
          }
        }
      }
    }
  }

  // 규칙 2: 중복 구독 감지 (동일 카테고리 2건 이상 구독 시)
  const categoryMap = new Map<Category, Subscription[]>();
  for (const sub of activeSubs) {
    const list = categoryMap.get(sub.category) || [];
    list.push(sub);
    categoryMap.set(sub.category, list);
  }

  const duplicateWarnings: DefenseSummary['duplicateWarnings'] = [];
  categoryMap.forEach((subs, category) => {
    // OTT(영상), 음악, AI 등 동일 성격 서비스 2개 이상일 때
    if (subs.length > 1 && (category === '영상' || category === '음악' || category === 'AI')) {
      const monthlyTotal = subs.reduce(
        (acc, s) => acc + (s.billingCycle === 'yearly' ? Math.round(s.amount / 12) : s.amount),
        0
      );
      duplicateWarnings.push({
        category,
        services: subs.map((s) => s.serviceName),
        monthlyTotal,
      });
    }
  });

  // 규칙 1: 대안이 여러 개일 때 구독별로 '최대 절감액 1건만' 총합에 반영
  const subSavingsMap = new Map<string, number>();
  for (const rec of allRecommendations) {
    const currentMax = subSavingsMap.get(rec.subscriptionId) || 0;
    if (rec.monthlySavings > currentMax) {
      subSavingsMap.set(rec.subscriptionId, rec.monthlySavings);
    }
  }

  let totalMonthlySavings = 0;
  subSavingsMap.forEach((maxSavings) => {
    totalMonthlySavings += maxSavings;
  });

  return {
    totalMonthlySavings,
    opportunitiesCount: allRecommendations.length,
    recommendations: allRecommendations.sort((a, b) => b.monthlySavings - a.monthlySavings),
    duplicateWarnings,
  };
}
