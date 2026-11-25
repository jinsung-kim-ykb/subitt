import { PlanCatalogItem, BundleRule } from '../../types';

/**
 * 4단계 초기 요금표 예시 데이터 (사용자 요청: 예시 라벨 표기)
 * 넷플릭스, 유튜브 프리미엄, 멜론, 스포티파이, 클로드 Pro, 어도비
 */
export const INITIAL_PLAN_CATALOG: PlanCatalogItem[] = [
  // 넷플릭스
  {
    id: 'plan-netflix-premium',
    serviceId: 'netflix',
    serviceName: '넷플릭스',
    planName: '프리미엄 (4K+4인)',
    category: '영상',
    amount: 17000,
    currency: 'KRW',
    billingCycle: 'monthly',
    features: '4K 화질, 동시접속 4인',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-netflix-standard',
    serviceId: 'netflix',
    serviceName: '넷플릭스',
    planName: '스탠다드 (FHD+2인)',
    category: '영상',
    amount: 13500,
    currency: 'KRW',
    billingCycle: 'monthly',
    features: 'FHD 화질, 동시접속 2인',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-netflix-ad',
    serviceId: 'netflix',
    serviceName: '넷플릭스',
    planName: '광고형 스탠다드',
    category: '영상',
    amount: 5500,
    currency: 'KRW',
    billingCycle: 'monthly',
    features: '시간당 4~5분 광고 포함, 동시접속 2인',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },

  // 유튜브 프리미엄
  {
    id: 'plan-youtube-monthly',
    serviceId: 'youtube',
    serviceName: '유튜브 프리미엄',
    planName: '개인 월간 멤버십',
    category: '영상',
    amount: 14900,
    currency: 'KRW',
    billingCycle: 'monthly',
    features: '광고 제거, 백그라운드 재생, 유튜브 뮤직 포함',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-youtube-yearly',
    serviceId: 'youtube',
    serviceName: '유튜브 프리미엄',
    planName: '개인 연간 멤버십 (연간 결제)',
    category: '영상',
    amount: 149000, // 월 환산 약 12,416원 (월 2,484원 절감)
    currency: 'KRW',
    billingCycle: 'yearly',
    features: '1년 단위 일괄 결제, 15% 할인',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },

  // 멜론
  {
    id: 'plan-melon-club',
    serviceId: 'melon',
    serviceName: '멜론',
    planName: '스트리밍 클럽',
    category: '음악',
    amount: 10900,
    currency: 'KRW',
    billingCycle: 'monthly',
    features: '무제한 듣기 (모바일+PC)',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },

  // 스포티파이
  {
    id: 'plan-spotify-individual',
    serviceId: 'spotify',
    serviceName: '스포티파이',
    planName: '개인 Premium',
    category: '음악',
    amount: 10900,
    currency: 'KRW',
    billingCycle: 'monthly',
    features: '1개 계정 무제한 스트리밍',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-spotify-duo',
    serviceId: 'spotify',
    serviceName: '스포티파이',
    planName: '듀오 Premium (2인 공유 시 1인 기준)',
    category: '음악',
    amount: 8175, // 듀오 총 16,350원 (1인당 8,175원)
    currency: 'KRW',
    billingCycle: 'monthly',
    features: '동일 주소지 2인 공유 요금제',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },

  // 클로드 (Anthropic)
  {
    id: 'plan-claude-pro',
    serviceId: 'claude',
    serviceName: 'Claude Pro',
    planName: 'Claude Pro',
    category: 'AI',
    amount: 27600, // $20 기준
    currency: 'KRW',
    billingCycle: 'monthly',
    features: 'Claude 3.5 Sonnet 무제한급 이용, Projects 기능',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },

  // 어도비 (Adobe)
  {
    id: 'plan-adobe-all-apps',
    serviceId: 'adobe',
    serviceName: '어도비 Creative Cloud',
    planName: '모든 앱 플랜',
    category: '기타',
    amount: 61600,
    currency: 'KRW',
    billingCycle: 'monthly',
    features: '포토샵, 일러스트레이터, 프리미어 등 20+ 앱',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan-adobe-photography',
    serviceId: 'adobe',
    serviceName: '어도비 Creative Cloud',
    planName: '포토그래피 플랜 (포토샵+라이트룸)',
    category: '기타',
    amount: 11000, // 월 50,600원 절감 대안
    currency: 'KRW',
    billingCycle: 'monthly',
    features: '사진/이미지 작업 위주 사용자용',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
];

/**
 * 4단계 결합 및 제휴 할인 규칙 예시 데이터
 */
export const INITIAL_BUNDLE_RULES: BundleRule[] = [
  {
    id: 'bundle-youtube-uplus',
    serviceId: 'youtube',
    serviceName: '유튜브 프리미엄',
    bundleName: '유독(U+통신사) 유튜브 결합 할인',
    provider: 'LG유플러스',
    discountedAmount: 9900,
    originalAmount: 14900,
    condition: '유플러스 모바일 이용자 전용 부가서비스',
    actionUrl: 'https://www.lguplus.com',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bundle-melon-skt',
    serviceId: 'melon',
    serviceName: '멜론',
    bundleName: 'SKT T멤버십 제휴 할인 (30% 할인)',
    provider: 'SKT',
    discountedAmount: 7630,
    originalAmount: 10900,
    condition: 'T멤버십 VIP/골드 등급 적용',
    actionUrl: 'https://www.sktmembership.co.kr',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bundle-netflix-kt',
    serviceId: 'netflix',
    serviceName: '넷플릭스',
    bundleName: 'KT 5G 요금제 넷플릭스 초이스',
    provider: 'KT',
    discountedAmount: 8500,
    originalAmount: 13500,
    condition: '5G 초이스 요금제 결합 시',
    actionUrl: 'https://www.kt.com',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
];
