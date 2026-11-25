import React, { createContext, useContext, useState, useEffect } from 'react';
import { Party, PartyMember, SplitMethod } from '../types';
import { calculatePartySplit, generateReminderMessage } from '../lib/party/partyCalculator';
import { useNotifications } from './NotificationContext';

interface PartyContextType {
  parties: Party[];
  createParty: (params: {
    userId: string;
    subscriptionId: string;
    serviceName: string;
    totalAmount: number;
    billingDay: number;
    splitMethod: SplitMethod;
    paymentAccountInfo?: string;
    members: { name: string; isHost: boolean; customAmount?: number }[];
  }) => Party;
  updateParty: (id: string, updates: Partial<Party>) => void;
  deleteParty: (id: string) => void;
  toggleMemberPaid: (partyId: string, memberId: string, isPaid?: boolean) => void;
  getParty: (id: string) => Party | undefined;
  getPartyByInviteToken: (inviteToken: string) => Party | undefined;
  getPartyBySubscriptionId: (subscriptionId: string) => Party | undefined;
  triggerUnpaidNotification: (partyId: string) => { unpaidCount: number; message: string };
}

const PartyContext = createContext<PartyContextType | undefined>(undefined);

const STORAGE_KEY = 'subit_parties';

// 초기 예시 데이터 (테스트 및 둘러보기용)
const INITIAL_DEMO_PARTIES: Party[] = [
  {
    id: 'party_demo_netflix',
    userId: 'mock-user-1',
    subscriptionId: 'sub_netflix_demo',
    serviceName: '넷플릭스 프리미엄',
    totalAmount: 17000,
    splitMethod: 'equal',
    billingDay: 15,
    paymentAccountInfo: '카카오페이 송금 링크 또는 신한 110-123-456789 (홍길동)',
    inviteToken: 'demo-netflix-invite',
    members: [
      { id: 'm_host', partyId: 'party_demo_netflix', name: '나 (파티장)', isHost: true, allocatedAmount: 5680, isPaid: true },
      { id: 'm_2', partyId: 'party_demo_netflix', name: '김철수', isHost: false, allocatedAmount: 5660, isPaid: true, paidAt: '2026-11-20T10:00:00Z' },
      { id: 'm_3', partyId: 'party_demo_netflix', name: '이영희', isHost: false, allocatedAmount: 5660, isPaid: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const PartyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [parties, setParties] = useState<Party[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load parties from storage', e);
    }
    return INITIAL_DEMO_PARTIES;
  });

  const { addNotification } = useNotifications();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parties));
    } catch (e) {
      console.error('Failed to save parties', e);
    }
  }, [parties]);

  const createParty = (params: {
    userId: string;
    subscriptionId: string;
    serviceName: string;
    totalAmount: number;
    billingDay: number;
    splitMethod: SplitMethod;
    paymentAccountInfo?: string;
    members: { name: string; isHost: boolean; customAmount?: number }[];
  }): Party => {
    const partyId = `party_${Date.now()}`;
    const inviteToken = `inv_${Math.random().toString(36).substring(2, 10)}`;

    const customAmounts = params.splitMethod === 'custom'
      ? params.members.map((m) => m.customAmount || 0)
      : undefined;

    const split = calculatePartySplit(
      params.totalAmount,
      params.members.map((m) => ({ name: m.name, isHost: m.isHost })),
      params.splitMethod,
      customAmounts
    );

    const partyMembers: PartyMember[] = params.members.map((m, idx) => ({
      id: `member_${Date.now()}_${idx}`,
      partyId,
      name: m.name,
      isHost: m.isHost,
      allocatedAmount: split.allocations[idx]?.amount || 0,
      isPaid: m.isHost, // 파티장은 본인 결제이므로 기본 true
      paidAt: m.isHost ? new Date().toISOString() : undefined,
    }));

    const newParty: Party = {
      id: partyId,
      userId: params.userId,
      subscriptionId: params.subscriptionId,
      serviceName: params.serviceName,
      totalAmount: params.totalAmount,
      splitMethod: params.splitMethod,
      billingDay: params.billingDay,
      paymentAccountInfo: params.paymentAccountInfo,
      inviteToken,
      members: partyMembers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setParties((prev) => [newParty, ...prev]);
    return newParty;
  };

  const updateParty = (id: string, updates: Partial<Party>) => {
    setParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  };

  const deleteParty = (id: string) => {
    setParties((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleMemberPaid = (partyId: string, memberId: string, isPaid?: boolean) => {
    setParties((prev) =>
      prev.map((party) => {
        if (party.id !== partyId) return party;
        return {
          ...party,
          members: party.members.map((m) => {
            if (m.id !== memberId) return m;
            const nextPaid = isPaid !== undefined ? isPaid : !m.isPaid;
            return {
              ...m,
              isPaid: nextPaid,
              paidAt: nextPaid ? new Date().toISOString() : undefined,
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const getParty = (id: string) => {
    return parties.find((p) => p.id === id);
  };

  const getPartyByInviteToken = (inviteToken: string) => {
    return parties.find((p) => p.inviteToken === inviteToken);
  };

  const getPartyBySubscriptionId = (subscriptionId: string) => {
    return parties.find((p) => p.subscriptionId === subscriptionId);
  };

  /**
   * 미납 알림 트리거 (E5)
   * 미납 멤버가 있을 때 파티장에게 앱 내 알림 생성 및 재요청 메시지 반환
   */
  const triggerUnpaidNotification = (partyId: string) => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) return { unpaidCount: 0, message: '' };

    const unpaidMembers = party.members.filter((m) => !m.isHost && !m.isPaid);
    if (unpaidMembers.length === 0) {
      return { unpaidCount: 0, message: '모든 파티원이 납부를 완료했습니다!' };
    }

    const unpaidNames = unpaidMembers.map((m) => m.name).join(', ');
    const reminderMsg = generateReminderMessage(party, unpaidMembers[0]);

    addNotification({
      type: 'general',
      title: `[미납 알림] '${party.serviceName}' 정산 확인 필요`,
      body: `${unpaidMembers.length}명(${unpaidNames})이 아직 구독료를 송금하지 않았습니다. 재요청 메시지를 보내보세요!`,
      scheduledAt: new Date().toISOString(),
      subscriptionId: party.subscriptionId,
    });

    return {
      unpaidCount: unpaidMembers.length,
      message: reminderMsg,
    };
  };

  return (
    <PartyContext.Provider
      value={{
        parties,
        createParty,
        updateParty,
        deleteParty,
        toggleMemberPaid,
        getParty,
        getPartyByInviteToken,
        getPartyBySubscriptionId,
        triggerUnpaidNotification,
      }}
    >
      {children}
    </PartyContext.Provider>
  );
};

export const useParty = () => {
  const context = useContext(PartyContext);
  if (!context) {
    throw new Error('useParty must be used within a PartyProvider');
  }
  return context;
};
