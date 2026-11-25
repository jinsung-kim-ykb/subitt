import { CancellationGuide, PaymentChannel } from '../../types';

export const INITIAL_CANCELLATION_GUIDES: CancellationGuide[] = [
  // 넷플릭스 예시
  {
    id: 'guide_netflix_web',
    serviceName: '넷플릭스',
    channel: 'web',
    directCancelUrl: 'https://www.netflix.com/youraccount',
    steps: [
      { stepNumber: 1, title: '넷플릭스 계정 페이지 접속', description: '넷플릭스 웹사이트 로그인 후 우측 상단 프로필 > [계정] 메뉴를 선택합니다.' },
      { stepNumber: 2, title: '멤버십 해지 클릭', description: '멤버십 & 결제 정보 섹션에서 [멤버십 해지] 버튼을 클릭합니다.' },
      { stepNumber: 3, title: '해지 완료 확정', description: '[해지 완료] 버튼을 눌러 다음 결제일부터 청구가 중단되도록 확정합니다.' },
    ],
    cautionNote: '해지하더라도 이번 결제 주기의 남은 기간까지는 시청이 유지됩니다.',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'guide_netflix_appstore',
    serviceName: '넷플릭스',
    channel: 'appstore',
    directCancelUrl: 'https://apps.apple.com/account/subscriptions',
    steps: [
      { stepNumber: 1, title: '아이폰 [설정] 앱 실행', description: '홈 화면에서 [설정] 앱을 열고 맨 위 본인 이름(Apple ID)을 탭합니다.' },
      { stepNumber: 2, title: '[구독] 메뉴 진입', description: '[구독] 항목을 누른 후 구독 목록에서 [넷플릭스]를 찾습니다.' },
      { stepNumber: 3, title: '구독 취소 선택', description: '[구독 취소]를 누르고 확인 팝업에서 승인합니다.' },
    ],
    cautionNote: 'Apple 결제 건은 넷플릭스 웹페이지가 아닌 Apple 계정에서만 해지할 수 있습니다.',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'guide_netflix_googleplay',
    serviceName: '넷플릭스',
    channel: 'googleplay',
    directCancelUrl: 'https://play.google.com/store/account/subscriptions',
    steps: [
      { stepNumber: 1, title: 'Google Play 스토어 열기', description: 'Play 스토어 앱 실행 후 우측 상단 프로필 아이콘을 누릅니다.' },
      { stepNumber: 2, title: '[결제 및 정기 결제] 선택', description: '[정기 결제] 탭으로 이동하여 [넷플릭스]를 선택합니다.' },
      { stepNumber: 3, title: '구독 취소 확정', description: '화면 하단 [구독 취소]를 누르고 사유 선택 후 확인을 누릅니다.' },
    ],
    cautionNote: 'Google Play 결제 건은 Play 스토어 정기결제 관리에서만 취소됩니다.',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },

  // 디즈니+ 예시
  {
    id: 'guide_disney_web',
    serviceName: '디즈니+',
    channel: 'web',
    directCancelUrl: 'https://www.disneyplus.com/account',
    steps: [
      { stepNumber: 1, title: '디즈니+ 계정 접속', description: '디즈니+ 로그인 후 프로필 > [계정] 메뉴로 들어갑니다.' },
      { stepNumber: 2, title: '멤버십 선택', description: '정기결제 섹션에서 본인의 구독 멤버십을 클릭합니다.' },
      { stepNumber: 3, title: '구독 취소 진행', description: '[구독 취소]를 누르고 계속 취소 버튼을 클릭하여 확정합니다.' },
    ],
    cautionNote: '통신사 결합(SKT, KT, LGU+) 상품인 경우 해당 통신사 고객센터나 부가서비스 페이지에서 해지해야 합니다.',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },

  // 유튜브 프리미엄 예시
  {
    id: 'guide_youtube_web',
    serviceName: '유튜브 프리미엄',
    channel: 'web',
    directCancelUrl: 'https://www.youtube.com/paid_memberships',
    steps: [
      { stepNumber: 1, title: '구매 항목 및 멤버십 접속', description: '유튜브 웹 또는 앱에서 프로필 아이콘 > [구매 항목 및 멤버십]을 선택합니다.' },
      { stepNumber: 2, title: '멤버십 관리', description: 'Premium 항목 옆 [멤버십 관리]를 클릭합니다.' },
      { stepNumber: 3, title: '비활성화 및 취소', description: '[비활성화]를 누른 후 [그대로 취소]를 선택하여 해지합니다.' },
    ],
    cautionNote: '아이폰 앱 내에서 결제한 경우 Apple ID 구독 관리에서 취소해야 합니다.',
    isExample: true,
    updatedAt: new Date().toISOString(),
  },
];

/**
 * 서비스명 및 결제 경로에 따른 해지 가이드 검색
 */
export function findCancellationGuide(
  guides: CancellationGuide[],
  serviceName: string,
  channel: PaymentChannel = 'web'
): CancellationGuide | undefined {
  const normName = serviceName.trim().toLowerCase();
  
  // 1. 서비스명 + 결제 채널 일치
  const exact = guides.find(
    (g) => g.serviceName.toLowerCase().includes(normName) || normName.includes(g.serviceName.toLowerCase())
  );
  if (!exact) return undefined;

  // 동일 서비스의 해당 채널 가이드 반환, 없으면 기본 채널 가이드 반환
  const channelMatch = guides.find(
    (g) =>
      (g.serviceName.toLowerCase().includes(normName) || normName.includes(g.serviceName.toLowerCase())) &&
      g.channel === channel
  );

  return channelMatch || exact;
}
