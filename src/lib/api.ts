import { supabase, isSupabaseConfigured } from './supabase';
import { maskSensitiveData } from './masking';

export interface ExtractedCandidate {
  serviceName: string;
  planName?: string;
  category: '영상' | '음악' | '쇼핑 멤버십' | 'AI' | '기타';
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  isFreeTrial: boolean;
  trialEndDate?: string;
  postTrialAmount?: number;
  confidence: number; // 0.0 ~ 1.0
  isCancellation?: boolean;
}

/**
 * Edge Function을 통한 AI 구독 추출 호출 (AGENTS.md 5장)
 * 브라우저에는 API 키가 전혀 없고 Supabase Edge Function을 경유함
 */
export async function extractWithAi(
  params: {
    rawText?: string;
    imageBase64List?: string[];
    captureTypeHint?: 'app_store' | 'card_history' | 'receipt_email' | 'trial_screen';
  }
): Promise<ExtractedCandidate[]> {
  // 1. 텍스트가 있는 경우 개인정보 가림(Masking) 필수 적용 (AGENTS.md 7장)
  let maskedText: string | undefined = undefined;
  if (params.rawText) {
    const masked = maskSensitiveData(params.rawText);
    maskedText = masked.maskedText;
  }

  // 2. Supabase가 연결되어 있는 경우 Edge Function 호출
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('extract-subscription', {
        body: {
          maskedText,
          imageBase64List: params.imageBase64List,
          captureTypeHint: params.captureTypeHint
        }
      });

      if (!error && data?.items) {
        return data.items.map((it: any) => ({
          serviceName: it.serviceName,
          planName: it.planName,
          category: it.category || '기타',
          amount: it.amount || 0,
          currency: it.currency || 'KRW',
          billingCycle: it.billingCycle || 'monthly',
          nextBillingDate: it.nextBillingDate || new Date().toISOString().split('T')[0],
          isFreeTrial: Boolean(it.isFreeTrial),
          trialEndDate: it.trialEndDate,
          postTrialAmount: it.postTrialAmount,
          confidence: it.confidence?.overall || 0.85
        }));
      }
    } catch (e) {
      console.warn('Edge function invoke failed, using local fallback:', e);
    }
  }

  // 3. 로컬/체험 모드 Mock Fallback (키 없이도 바로 작동 확인 가능)
  if (params.captureTypeHint === 'trial_screen') {
    return [
      {
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
        confidence: 0.94
      }
    ];
  }

  if (params.captureTypeHint === 'app_store') {
    return [
      {
        serviceName: 'YouTube Premium',
        planName: '개인 멤버십',
        category: '영상',
        amount: 14900,
        currency: 'KRW',
        billingCycle: 'monthly',
        nextBillingDate: '2026-12-10',
        isFreeTrial: false,
        confidence: 0.97
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
        confidence: 0.96
      }
    ];
  }

  // 기본 단일 캡처/텍스트 응답
  return [
    {
      serviceName: '스포티파이',
      planName: '개인 Premium',
      category: '음악',
      amount: 10900,
      currency: 'KRW',
      billingCycle: 'monthly',
      nextBillingDate: '2026-12-18',
      isFreeTrial: false,
      confidence: 0.92
    }
  ];
}
