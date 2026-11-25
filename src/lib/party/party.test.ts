import { describe, it, expect } from 'vitest';
import {
  calculatePartySplit,
  generateSettlementMessage,
  generateReminderMessage,
  extractPublicPartyView,
  getPartySettlementStatus,
} from './partyCalculator';
import { Party } from '../../types';

describe('5단계 파티 정산 - 분담금 계산 및 자투리 처리 (E1)', () => {
  it('17,000원 3명 똑같이 나누기 시 멤버 5,660원, 파티장이 자투리 부담(5,680원)하여 총합이 정확히 일치한다', () => {
    const members = [
      { name: '파티장', isHost: true },
      { name: '김철수', isHost: false },
      { name: '이영희', isHost: false },
    ];
    const result = calculatePartySplit(17000, members, 'equal');

    expect(result.memberAmount).toBe(5660); // 10원 단위 내림
    expect(result.hostAmount).toBe(5680); // 파티장 자투리 부담
    const totalAllocated = result.allocations.reduce((sum, a) => sum + a.amount, 0);
    expect(totalAllocated).toBe(17000);
  });

  it('10,000원 3명 나누기 시 멤버 3,330원, 파티장 3,340원으로 총합 10,000원이 일치한다', () => {
    const members = [
      { name: '호스트', isHost: true },
      { name: '멤버1', isHost: false },
      { name: '멤버2', isHost: false },
    ];
    const result = calculatePartySplit(10000, members, 'equal');

    expect(result.memberAmount).toBe(3330);
    expect(result.hostAmount).toBe(3340);
    expect(result.hostAmount + result.memberAmount * 2).toBe(10000);
  });

  it('딱 나누어떨어지는 12,000원 4명 나누기 시 모두 3,000원으로 균등 분담된다', () => {
    const members = [
      { name: '호스트', isHost: true },
      { name: 'A', isHost: false },
      { name: 'B', isHost: false },
      { name: 'C', isHost: false },
    ];
    const result = calculatePartySplit(12000, members, 'equal');

    expect(result.memberAmount).toBe(3000);
    expect(result.hostAmount).toBe(3000);
    expect(result.allocations.every((a) => a.amount === 3000)).toBe(true);
  });

  it('금액 직접 지정(custom) 시 각 멤버별 지정 금액이 정확히 반영된다', () => {
    const members = [
      { name: '호스트', isHost: true },
      { name: 'A', isHost: false },
    ];
    const result = calculatePartySplit(15000, members, 'custom', [10000, 5000]);

    expect(result.allocations[0].amount).toBe(10000);
    expect(result.allocations[1].amount).toBe(5000);
  });
});

describe('5단계 초대 링크 데이터 격리 검증 (E2, S09)', () => {
  const mockParty: Party = {
    id: 'party_123',
    userId: 'user_host_secret_999',
    subscriptionId: 'sub_netflix_secret_456',
    serviceName: '넷플릭스',
    totalAmount: 17000,
    splitMethod: 'equal',
    billingDay: 15,
    paymentAccountInfo: '카카오페이 송금 링크: https://qr.kakaopay.com/xxx',
    inviteToken: 'invite_token_abc789',
    members: [
      { id: 'm1', partyId: 'party_123', name: '나(파티장)', isHost: true, allocatedAmount: 5680, isPaid: true },
      { id: 'm2', partyId: 'party_123', name: '김철수', isHost: false, allocatedAmount: 5660, isPaid: false },
    ],
    createdAt: '2026-11-25T00:00:00Z',
    updatedAt: '2026-11-25T00:00:00Z',
  };

  it('공개 뷰(extractPublicPartyView)에는 파티장의 userId나 subscriptionId 등 비공개 식별자가 누출되지 않는다', () => {
    const publicView = extractPublicPartyView(mockParty);

    // 공개 뷰에 필수 항목 존재
    expect(publicView.serviceName).toBe('넷플릭스');
    expect(publicView.totalAmount).toBe(17000);
    expect(publicView.billingDay).toBe(15);
    expect(publicView.paymentAccountInfo).toContain('카카오페이');
    expect(publicView.inviteToken).toBe('invite_token_abc789');
    expect(publicView.members).toHaveLength(2);

    // 파티장의 고유 식별자 격리 확인
    expect((publicView as any).userId).toBeUndefined();
    expect((publicView as any).subscriptionId).toBeUndefined();
    expect((publicView as any).otherSubscriptions).toBeUndefined();
    expect((publicView as any).otherParties).toBeUndefined();
  });
});

describe('5단계 정산 요청 및 알림 메시지 생성 (E3, E5)', () => {
  const mockParty: Party = {
    id: 'party_123',
    userId: 'user_host',
    subscriptionId: 'sub_1',
    serviceName: '디즈니+',
    totalAmount: 13900,
    splitMethod: 'equal',
    billingDay: 20,
    paymentAccountInfo: '토스 1000-1234-5678 (홍길동)',
    inviteToken: 'disney_token_xyz',
    members: [
      { id: 'm1', partyId: 'party_123', name: '파티장', isHost: true, allocatedAmount: 6950, isPaid: true },
      { id: 'm2', partyId: 'party_123', name: '박지민', isHost: false, allocatedAmount: 6950, isPaid: false },
    ],
    createdAt: '2026-11-25T00:00:00Z',
    updatedAt: '2026-11-25T00:00:00Z',
  };

  it('정산 요청 메시지에 서비스명, 금액, 정산일, 송금처, 초대 링크가 모두 포함된다', () => {
    const message = generateSettlementMessage(mockParty, mockParty.members[1], 'https://subit.app');

    expect(message).toContain('디즈니+');
    expect(message).toContain('6,950원');
    expect(message).toContain('20일');
    expect(message).toContain('토스 1000-1234-5678 (홍길동)');
    expect(message).toContain('https://subit.app/party/invite/disney_token_xyz');
  });

  it('미납 멤버가 있을 때 재요청 메시지가 생성되고 미납 상태가 올바르게 감지된다', () => {
    const status = getPartySettlementStatus(mockParty);
    expect(status.totalNonHostCount).toBe(1);
    expect(status.paidCount).toBe(0);
    expect(status.unpaidCount).toBe(1);
    expect(status.isFullyPaid).toBe(false);

    const reminder = generateReminderMessage(mockParty, status.unpaidMembers[0], 'https://subit.app');
    expect(reminder).toContain('박지민님');
    expect(reminder).toContain('디즈니+');
    expect(reminder).toContain('6,950원');
  });
});
