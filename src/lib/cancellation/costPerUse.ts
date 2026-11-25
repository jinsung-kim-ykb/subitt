import { CostPerUseResult } from '../../types';

/**
 * 가성비 체크 계산 함수 (D7)
 * 사용자 지정 규칙:
 * - 사용 횟수가 0이면 회당 비용 대신 "이번 달 사용하지 않음" 표시
 * - 0회 초과 시: 회당 비용 = 월 구독료 / 사용 횟수 (원 단위 반올림)
 */
export function calculateCostPerUse(monthlyAmount: number, usageCount: number): CostPerUseResult {
  const safeCount = Math.max(0, Math.floor(usageCount || 0));

  if (safeCount === 0) {
    return {
      usageCount: 0,
      costPerUse: null,
      statusLabel: '이번 달 사용하지 않음',
      isUnused: true,
    };
  }

  const cost = Math.round(monthlyAmount / safeCount);

  return {
    usageCount: safeCount,
    costPerUse: cost,
    statusLabel: `회당 ${cost.toLocaleString()}원`,
    isUnused: false,
  };
}
