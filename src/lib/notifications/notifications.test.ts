import { describe, it, expect } from 'vitest';
import {
  buildScheduledNotifications,
  rescheduleSubscriptionNotifications,
  generateIdempotencyKey,
} from './scheduler';
import { Subscription, AppNotification } from '../../types';

describe('3단계 알림 스케줄러 & 중복 방지 & 재스케줄링 단위 테스트', () => {
  const baseSub: Subscription = {
    id: 'sub-netflix',
    userId: 'user-1',
    serviceName: '넷플릭스',
    category: '영상',
    amount: 13500,
    currency: 'KRW',
    billingCycle: 'monthly',
    billingDay: 15,
    nextBillingDate: '2026-11-20',
    isFreeTrial: false,
    registrationMethod: 'manual',
    status: 'active',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  };

  const fixedNow = new Date('2026-11-10T00:00:00Z');

  it('1. 일반 구독의 D-3, D-1 알림을 올바른 일자로 생성한다', () => {
    const notifications = buildScheduledNotifications(baseSub, { now: fixedNow });
    expect(notifications).toHaveLength(2);

    const d3 = notifications.find((n) => n.type === 'billing_d3');
    const d1 = notifications.find((n) => n.type === 'billing_d1');

    expect(d3).toBeDefined();
    expect(d3?.scheduledAt).toBe('2026-11-17T09:00:00+09:00');
    expect(d3?.title).toContain('3일 전');

    expect(d1).toBeDefined();
    expect(d1?.scheduledAt).toBe('2026-11-19T09:00:00+09:00');
    expect(d1?.title).toContain('1일 전');
  });

  it('2. 무료체험 구독의 경우 무료체험 종료 D-3, D-1 알림을 생성한다', () => {
    const trialSub: Subscription = {
      ...baseSub,
      id: 'sub-tving-trial',
      serviceName: '티빙',
      isFreeTrial: true,
      trialEndDate: '2026-11-25',
    };

    const notifications = buildScheduledNotifications(trialSub, { now: fixedNow });
    expect(notifications).toHaveLength(2);

    expect(notifications[0].type).toBe('trial_d3');
    expect(notifications[0].scheduledAt).toBe('2026-11-22T09:00:00+09:00');
    expect(notifications[0].title).toContain('무료체험 종료');
  });

  it('3. 동일한 알림은 멱등성 키(idempotencyKey)로 중복 생성을 방지한다', () => {
    const notifs1 = buildScheduledNotifications(baseSub, { now: fixedNow });
    expect(notifs1).toHaveLength(2);

    // 같은 날짜로 다시 재스케줄링 시도
    const result = rescheduleSubscriptionNotifications(baseSub, notifs1, { now: fixedNow });

    // 중복 추가되지 않고 정확히 2건만 유지되어야 함
    expect(result).toHaveLength(2);
    const keys = result.map((n) => n.idempotencyKey);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });

  it('4. 결제일을 수정하면 미발송 예정 알림은 취소되고 새로운 날짜로 다시 생성된다', () => {
    // 기존 예정 알림 2건 (결제일: 2026-11-20 -> D-3은 11-17, D-1은 11-19)
    const initialNotifs = buildScheduledNotifications(baseSub, { now: fixedNow });
    expect(initialNotifs).toHaveLength(2);

    // 사용자가 결제일을 11-28로 변경함
    const updatedSub: Subscription = {
      ...baseSub,
      nextBillingDate: '2026-11-28',
    };

    const rescheduled = rescheduleSubscriptionNotifications(updatedSub, initialNotifs, {
      now: fixedNow,
    });

    // 기존 11-17, 11-19 알림은 사라지고, 새 결제일 기준(11-25, 11-27) 알림으로 대체되어야 함
    expect(rescheduled).toHaveLength(2);
    const scheduledDates = rescheduled.map((n) => n.scheduledAt);
    expect(scheduledDates).toContain('2026-11-25T09:00:00+09:00'); // D-3
    expect(scheduledDates).toContain('2026-11-27T09:00:00+09:00'); // D-1
    expect(scheduledDates).not.toContain('2026-11-17T09:00:00+09:00');
  });

  it('5. 이미 발송 완료된 알림(sentAt 존재)은 결제일이 변경되어도 삭제되지 않고 보존된다', () => {
    // 이미 발송된 과거 알림 1건 생성
    const alreadySentNotif: AppNotification = {
      id: 'sent-1',
      userId: 'user-1',
      subscriptionId: baseSub.id,
      type: 'billing_d3',
      title: '과거 알림',
      body: '이미 발송된 알림',
      idempotencyKey: generateIdempotencyKey(baseSub.id, 'billing_d3', '2026-11-05'),
      scheduledAt: '2026-11-05T09:00:00+09:00',
      sentAt: '2026-11-05T09:00:01+09:00',
      isRead: true,
      createdAt: '2026-11-01T00:00:00Z',
    };

    // 결제일 변경
    const updatedSub: Subscription = {
      ...baseSub,
      nextBillingDate: '2026-11-28',
    };

    const rescheduled = rescheduleSubscriptionNotifications(
      updatedSub,
      [alreadySentNotif],
      { now: fixedNow }
    );

    // 발송된 알림 1건 + 새 예정 알림 2건 = 총 3건
    expect(rescheduled).toHaveLength(3);
    expect(rescheduled.find((n) => n.id === 'sent-1')).toBeDefined();
  });
});
