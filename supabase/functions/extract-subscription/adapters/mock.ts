import { AiAdapter, ExtractionInput, ExtractedItem } from './types.ts';

/**
 * 모의 제공자 (Mock Adapter - AGENTS.md 5장)
 * API 키 없이 로컬 개발 및 테스트를 즉시 수행할 수 있도록 정해진 정확한 결과를 반환
 */
export const mockAdapter: AiAdapter = {
  name: 'mock',

  async extract(input: ExtractionInput): Promise<ExtractedItem[]> {
    const results: ExtractedItem[] = [];

    // 1. 텍스트 입력이 있는 경우
    if (input.maskedText) {
      const text = input.maskedText;
      if (text.includes('넷플릭스') || text.includes('NETFLIX')) {
        results.push({
          serviceName: '넷플릭스',
          planName: '스탠다드',
          category: '영상',
          amount: 13500,
          currency: 'KRW',
          billingCycle: 'monthly',
          nextBillingDate: '2026-12-25',
          isFreeTrial: false,
          confidence: {
            serviceName: 0.98,
            amount: 0.95,
            billingDate: 0.9,
            overall: 0.94
          }
        });
      } else if (text.includes('디즈니') || text.includes('DISNEY')) {
        results.push({
          serviceName: '디즈니플러스',
          planName: '스탠다드',
          category: '영상',
          amount: 11500,
          currency: 'KRW',
          billingCycle: 'monthly',
          nextBillingDate: '2026-12-25',
          isFreeTrial: false,
          confidence: {
            serviceName: 0.95,
            amount: 0.95,
            billingDate: 0.9,
            overall: 0.93
          }
        });
      } else {
        // 알 수 없는 일반 결제 텍스트 시뮬레이션
        results.push({
          serviceName: '미분류 구독 서비스',
          category: '기타',
          amount: 9900,
          currency: 'KRW',
          billingCycle: 'monthly',
          nextBillingDate: '2026-12-25',
          isFreeTrial: false,
          confidence: {
            serviceName: 0.65, // 확신도가 낮아 S04에서 수정 유도
            amount: 0.85,
            billingDate: 0.6,
            overall: 0.7
          }
        });
      }
    }

    // 2. 캡처 이미지 입력이 있는 경우 (SPEC 6장의 4가지 캡처 종류 시뮬레이션)
    if (input.imageBase64List && input.imageBase64List.length > 0) {
      if (input.captureTypeHint === 'trial_screen') {
        // 무료체험 캡처 (A5)
        results.push({
          serviceName: '밀리의서재',
          planName: '전자책 정기구독',
          category: '기타',
          amount: 0,
          currency: 'KRW',
          billingCycle: 'monthly',
          nextBillingDate: '2026-12-05',
          isFreeTrial: true,
          trialEndDate: '2026-12-05',
          postTrialAmount: 9900,
          confidence: {
            serviceName: 0.92,
            amount: 0.99,
            billingDate: 0.91,
            overall: 0.94
          }
        });
      } else if (input.captureTypeHint === 'app_store') {
        // 앱스토어 다중 구독 캡처 (A2: 이미지 한 장에서 여러 건 추출)
        results.push(
          {
            serviceName: 'YouTube Premium',
            planName: '개인 멤버십',
            category: '영상',
            amount: 14900,
            currency: 'KRW',
            billingCycle: 'monthly',
            nextBillingDate: '2026-12-10',
            isFreeTrial: false,
            confidence: { serviceName: 0.99, amount: 0.98, billingDate: 0.95, overall: 0.97 }
          },
          {
            serviceName: 'iCloud+ (50GB)',
            planName: '50GB 플랜',
            category: '기타',
            amount: 1100,
            currency: 'KRW',
            billingCycle: 'monthly',
            nextBillingDate: '2026-12-01',
            isFreeTrial: false,
            confidence: { serviceName: 0.95, amount: 0.99, billingDate: 0.95, overall: 0.96 }
          }
        );
      } else {
        // 기본 캡처 영수증
        results.push({
          serviceName: '스포티파이',
          planName: '개인 Premium',
          category: '음악',
          amount: 10900,
          currency: 'KRW',
          billingCycle: 'monthly',
          nextBillingDate: '2026-12-18',
          isFreeTrial: false,
          confidence: { serviceName: 0.93, amount: 0.95, billingDate: 0.88, overall: 0.92 }
        });
      }
    }

    return results;
  }
};
