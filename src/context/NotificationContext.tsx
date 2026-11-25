import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppNotification } from '../types';
import { useAuth } from './AuthContext';
import { useSubscriptions } from './SubscriptionContext';
import { supabase } from '../lib/supabase';
import {
  buildScheduledNotifications,
  rescheduleSubscriptionNotifications,
} from '../lib/notifications/scheduler';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addNotification: (
    notif: Omit<AppNotification, 'id' | 'isRead' | 'createdAt' | 'idempotencyKey' | 'userId'> & {
      userId?: string;
    }
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { subscriptions } = useSubscriptions();

  // 알림 동기화 및 로컬 생성
  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let currentNotifs: AppNotification[] = [];

      // 1. Supabase 원격 알림 조회
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('scheduled_at', { ascending: false });

        if (!error && data) {
          currentNotifs = data.map((n) => ({
            id: n.id,
            userId: n.user_id,
            subscriptionId: n.subscription_id,
            type: n.type,
            title: n.title,
            body: n.body,
            idempotencyKey: n.idempotency_key,
            scheduledAt: n.scheduled_at,
            sentAt: n.sent_at,
            isRead: n.is_read,
            createdAt: n.created_at,
          }));
        }
      }

      // 2. 현재 활성 구독들에 대해 누락된 알림 스케줄링 (클라이언트 오프라인/동기화 보정)
      for (const sub of subscriptions) {
        currentNotifs = rescheduleSubscriptionNotifications(sub, currentNotifs);
      }

      // 최신순 정렬
      currentNotifs.sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );

      setNotifications(currentNotifs);

      // 원격 DB 저장 (로그인 시)
      if (user) {
        for (const notif of currentNotifs) {
          await supabase.from('notifications').upsert({
            id: notif.id,
            user_id: user.id,
            subscription_id: notif.subscriptionId,
            type: notif.type,
            title: notif.title,
            body: notif.body,
            idempotency_key: notif.idempotencyKey,
            scheduled_at: notif.scheduledAt,
            sent_at: notif.sentAt,
            is_read: notif.isRead,
          }, { onConflict: 'idempotency_key' });
        }
      }
    } catch (err) {
      console.warn('Failed to refresh notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, subscriptions]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    if (user) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    }
  };

  const addNotification = (
    notif: Omit<AppNotification, 'id' | 'isRead' | 'createdAt' | 'idempotencyKey' | 'userId'> & {
      userId?: string;
    }
  ) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: notif.userId || user?.id || 'mock-user-1',
      idempotencyKey: `manual_${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
