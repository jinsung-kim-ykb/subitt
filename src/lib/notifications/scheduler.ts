import { Subscription, AppNotification, NotificationType } from '../../types';
import { subDays, format, parseISO, isBefore, startOfDay } from 'date-fns';

export interface SchedulerOptions {
  notificationDaysBefore?: number[]; // 기본 [3, 1]
  now?: Date;
}

/**
 * 멱등성 키 생성 (SPEC 8장: 중복 발송 방지)
 * 포맷: sub:{subscriptionId}:{type}:{scheduledDate}
 */
export function generateIdempotencyKey(
  subscriptionId: string,
  type: NotificationType,
  scheduledDate: string
): string {
  return `sub:${subscriptionId}:${type}:${scheduledDate}`;
}

/**
 * 특정 구독에 대한 발송 예정 알림 목록 계산
 */
export function buildScheduledNotifications(
  sub: Subscription,
  options: SchedulerOptions = {}
): AppNotification[] {
  if (sub.status !== 'active') return [];

  const daysBefore = options.notificationDaysBefore || [3, 1];
  const now = options.now || new Date();
  const today = startOfDay(now);
  const notifications: AppNotification[] = [];

  // 1. 무료체험 종료 알림 (A5)
  if (sub.isFreeTrial && sub.trialEndDate) {
    const trialEnd = startOfDay(parseISO(sub.trialEndDate));
    for (const days of daysBefore) {
      const scheduledDate = subDays(trialEnd, days);
      const scheduledStr = format(scheduledDate, 'yyyy-MM-dd');

      // 이미 날짜가 지난 과거 알림은 생성하지 않음
      if (isBefore(scheduledDate, today)) continue;

      const type: NotificationType = days === 3 ? 'trial_d3' : 'trial_d1';
      const key = generateIdempotencyKey(sub.id, type, scheduledStr);

      notifications.push({
        id: crypto.randomUUID(),
        userId: sub.userId,
        subscriptionId: sub.id,
        type,
        title: `[무료체험 종료 ${days}일 전] ${sub.serviceName}`,
        body: `${days}일 후 무료체험이 종료되고 ${Math.round(sub.amount).toLocaleString('ko-KR')}원이 자동 결제됩니다.`,
        idempotencyKey: key,
        scheduledAt: `${scheduledStr}T09:00:00+09:00`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
    return notifications;
  }

  // 2. 일반 정기 결제 예정 알림 (C1)
  if (sub.nextBillingDate) {
    const nextBilling = startOfDay(parseISO(sub.nextBillingDate));
    for (const days of daysBefore) {
      const scheduledDate = subDays(nextBilling, days);
      const scheduledStr = format(scheduledDate, 'yyyy-MM-dd');

      if (isBefore(scheduledDate, today)) continue;

      const type: NotificationType = days === 3 ? 'billing_d3' : 'billing_d1';
      const key = generateIdempotencyKey(sub.id, type, scheduledStr);

      notifications.push({
        id: crypto.randomUUID(),
        userId: sub.userId,
        subscriptionId: sub.id,
        type,
        title: `[결제 예정 ${days}일 전] ${sub.serviceName}`,
        body: `${days}일 후 ${Math.round(sub.amount).toLocaleString('ko-KR')}원이 결제될 예정입니다.`,
        idempotencyKey: key,
        scheduledAt: `${scheduledStr}T09:00:00+09:00`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return notifications;
}

/**
 * 결제일이 수정되었을 때 알림 재스케줄링 (SPEC 8장)
 * - 이미 발송된 알림(sentAt 존재)은 절대 삭제하지 않음
 * - 아직 발송되지 않은 기존 예정 알림은 취소
 * - 새로운 결제일 기준 알림 생성
 * - 중복 idempotencyKey 검증
 */
export function rescheduleSubscriptionNotifications(
  sub: Subscription,
  existingNotifications: AppNotification[],
  options: SchedulerOptions = {}
): AppNotification[] {
  // 1. 이미 발송된 알림 및 다른 구독의 알림은 그대로 유지
  const preserved = existingNotifications.filter(
    (n) => n.subscriptionId !== sub.id || Boolean(n.sentAt)
  );

  // 2. 새 결제일 기준 예정 알림 생성
  const newlyScheduled = buildScheduledNotifications(sub, options);

  // 3. 중복 방지 (기존 목록에 이미 존재하는 idempotencyKey 배제)
  const existingKeys = new Set(preserved.map((n) => n.idempotencyKey));
  const finalNew = newlyScheduled.filter((n) => !existingKeys.has(n.idempotencyKey));

  return [...preserved, ...finalNew];
}
