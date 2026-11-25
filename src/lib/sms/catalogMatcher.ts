import { ServiceCatalogItem } from '../../types';
import { ExtractedSmsItem } from './types';

/**
 * 추출된 가맹점명을 카탈로그와 매칭하여 서비스명, 카테고리, 기본 주기를 보강 (SPEC 6장 3번)
 */
export function matchCatalogItem(
  extracted: ExtractedSmsItem,
  catalog: ServiceCatalogItem[]
): ExtractedSmsItem {
  const normMerchant = extracted.merchantName.trim().toUpperCase().replace(/\s+/g, '');

  for (const item of catalog) {
    const normName = item.name.toUpperCase().replace(/\s+/g, '');

    // 1. 서비스 정식 명칭과 일치 여부
    if (normMerchant.includes(normName) || normName.includes(normMerchant)) {
      return {
        ...extracted,
        matchedServiceName: item.name,
        category: item.category,
        planName: item.defaultPlanName,
        billingCycle: item.defaultCycle,
        confidence: Math.max(extracted.confidence, 0.95)
      };
    }

    // 2. 가맹점 별칭(merchantAliases) 매칭 여부
    for (const alias of item.merchantAliases) {
      const normAlias = alias.toUpperCase().replace(/\s+/g, '');
      if (normMerchant.includes(normAlias) || normAlias.includes(normMerchant)) {
        return {
          ...extracted,
          matchedServiceName: item.name,
          category: item.category,
          planName: item.defaultPlanName,
          billingCycle: item.defaultCycle,
          confidence: Math.max(extracted.confidence, 0.95)
        };
      }
    }
  }

  // 카탈로그에 없는 가맹점인 경우: 결제 주기는 미정(사용자 확인 필요)
  return {
    ...extracted,
    matchedServiceName: extracted.merchantName,
    category: '기타',
    confidence: Math.min(extracted.confidence, 0.75) // 확신도 낮음
  };
}
