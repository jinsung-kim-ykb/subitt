import { Party, PartyMember, PublicPartyView, SplitMethod } from '../../types';

export interface SplitResult {
  hostAmount: number;
  memberAmount: number;
  allocations: {
    name: string;
    isHost: boolean;
    amount: number;
  }[];
}

/**
 * 파티원 분담 금액 계산 함수
 * 사용자 결정 규칙:
 * - 똑같이 나누기(1/N) 시 10원 단위 내림 처리
 * - 나누어떨어지지 않는 자투리 금액은 파티장이 잔여 부담
 * (예: 17,000원 3인 -> 멤버 각 5,660원, 파티장 5,680원 / 총합 17,000원)
 */
export function calculatePartySplit(
  totalAmount: number,
  memberNames: { name: string; isHost: boolean }[],
  splitMethod: SplitMethod = 'equal',
  customAmounts?: number[]
): SplitResult {
  const count = memberNames.length;
  if (count <= 0) {
    return { hostAmount: 0, memberAmount: 0, allocations: [] };
  }

  if (splitMethod === 'custom' && customAmounts && customAmounts.length === count) {
    const allocations = memberNames.map((m, idx) => ({
      name: m.name,
      isHost: m.isHost,
      amount: customAmounts[idx] || 0,
    }));
    const hostAlloc = allocations.find((a) => a.isHost) || allocations[0];
    const memberAlloc = allocations.find((a) => !a.isHost) || allocations[0];

    return {
      hostAmount: hostAlloc.amount,
      memberAmount: memberAlloc.amount,
      allocations,
    };
  }

  // equal (1/N 똑같이 나누기)
  if (count === 1) {
    return {
      hostAmount: totalAmount,
      memberAmount: 0,
      allocations: [{ name: memberNames[0].name, isHost: true, amount: totalAmount }],
    };
  }

  // 일반 멤버는 10원 단위 내림
  const otherMemberCount = count - 1;
  const rawPerPerson = totalAmount / count;
  const memberAmount = Math.floor(rawPerPerson / 10) * 10;
  
  // 파티장은 총액에서 타 멤버 부담액 합을 뺀 나머지(자투리 부담)
  const hostAmount = totalAmount - memberAmount * otherMemberCount;

  const allocations = memberNames.map((m) => ({
    name: m.name,
    isHost: m.isHost,
    amount: m.isHost ? hostAmount : memberAmount,
  }));

  return {
    hostAmount,
    memberAmount,
    allocations,
  };
}

/**
 * 정산 요청 메시지 생성기 (E3)
 * 클립보드 복사 및 카카오톡/문자 공유용 텍스트
 */
export function generateSettlementMessage(
  party: Party,
  targetMember?: PartyMember,
  baseUrl: string = window?.location?.origin || 'https://subit.app'
): string {
  const inviteUrl = `${baseUrl}/party/invite/${party.inviteToken}`;
  const amountStr = targetMember
    ? `${targetMember.allocatedAmount.toLocaleString()}원`
    : party.splitMethod === 'equal' && party.members.length > 1
    ? `${party.members.find((m) => !m.isHost)?.allocatedAmount.toLocaleString() || '1/N'}원`
    : '분담 금액';

  const accountInfo = party.paymentAccountInfo
    ? `🏦 송금처: ${party.paymentAccountInfo}`
    : '🏦 송금처: 파티장에게 문의 또는 계좌 확인';

  return `[SUBIT 파티 정산 안내]
📢 '${party.serviceName}' 이번 달 구독료 정산 요청입니다.

💰 정산 금액: ${amountStr}
📅 정산 기준일: 매월 ${party.billingDay}일
${accountInfo}

👇 정산 현황 확인 및 송금 후 '완료' 체크:
${inviteUrl}`;
}

/**
 * 미납 재요청 메시지 생성기 (E5)
 */
export function generateReminderMessage(
  party: Party,
  unpaidMember: PartyMember,
  baseUrl: string = window?.location?.origin || 'https://subit.app'
): string {
  const inviteUrl = `${baseUrl}/party/invite/${party.inviteToken}`;
  const accountInfo = party.paymentAccountInfo ? `\n🏦 송금처: ${party.paymentAccountInfo}` : '';

  return `[SUBIT 정산 재요청]
${unpaidMember.name}님, '${party.serviceName}' 이번 달 구독료(${unpaidMember.allocatedAmount.toLocaleString()}원) 정산이 아직 확인되지 않았습니다.

확인 후 송금 부탁드려요!${accountInfo}
👉 납부 현황 확인: ${inviteUrl}`;
}

/**
 * 공개 초대 뷰용 데이터 격리 추출기 (E2, S09)
 * 파티장의 다른 구독, 다른 파티, 개인정보가 노출되지 않도록 엄격히 필터링
 */
export function extractPublicPartyView(party: Party): PublicPartyView {
  return {
    serviceName: party.serviceName,
    totalAmount: party.totalAmount,
    billingDay: party.billingDay,
    paymentAccountInfo: party.paymentAccountInfo,
    inviteToken: party.inviteToken,
    members: party.members.map((m) => ({
      id: m.id,
      name: m.name,
      isHost: m.isHost,
      allocatedAmount: m.allocatedAmount,
      isPaid: m.isPaid,
      paidAt: m.paidAt,
    })),
    updatedAt: party.updatedAt,
  };
}

/**
 * 파티 납부 및 미납 현황 점검
 */
export function getPartySettlementStatus(party: Party) {
  const nonHostMembers = party.members.filter((m) => !m.isHost);
  const unpaidMembers = nonHostMembers.filter((m) => !m.isPaid);
  const paidMembers = nonHostMembers.filter((m) => m.isPaid);
  const isFullyPaid = nonHostMembers.length > 0 && unpaidMembers.length === 0;

  return {
    totalNonHostCount: nonHostMembers.length,
    paidCount: paidMembers.length,
    unpaidCount: unpaidMembers.length,
    unpaidMembers,
    paidMembers,
    isFullyPaid,
  };
}
