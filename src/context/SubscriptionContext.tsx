import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Subscription, ServiceCatalogItem } from '../types';
import { localDb } from '../lib/db';
import { supabase } from '../lib/supabase';
import { INITIAL_CATALOG } from '../lib/constants';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  subscriptions: Subscription[];
  catalog: ServiceCatalogItem[];
  loading: boolean;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Subscription>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  syncData: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadLocal = useCallback(async () => {
    try {
      const list = await localDb.getAllSubscriptions();
      setSubscriptions(list);
    } catch (err) {
      console.error('Failed to load local subscriptions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncData = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Process sync queue
      const queue = await localDb.getSyncQueue();
      for (const item of queue) {
        if (item.action === 'create' || item.action === 'update') {
          await supabase.from('subscriptions').upsert({
            id: item.data.id,
            user_id: user.id,
            service_name: item.data.serviceName,
            category: item.data.category,
            amount: item.data.amount,
            currency: item.data.currency,
            cycle: item.data.billingCycle,
            billing_day: item.data.billingDay,
            next_billing_date: item.data.nextBillingDate,
            payment_method: item.data.paymentMethodMemo,
            is_free_trial: item.data.isFreeTrial,
            trial_end_date: item.data.trialEndDate,
            status: item.data.status,
            created_at: item.data.createdAt,
            updated_at: item.data.updatedAt,
          });
        } else if (item.action === 'delete') {
          await supabase.from('subscriptions').delete().eq('id', item.id);
        }
        await localDb.removeSyncQueueItem(item.id);
      }

      // 2. Fetch remote and merge
      const { data: remoteSubs, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (!error && remoteSubs) {
        for (const remote of remoteSubs) {
          const local = await localDb.getSubscription(remote.id);
          const mappedRemote: Subscription = {
            id: remote.id,
            userId: remote.user_id,
            serviceName: remote.service_name,
            category: remote.category,
            amount: Number(remote.amount),
            currency: remote.currency || 'KRW',
            billingCycle: remote.cycle || 'monthly',
            billingDay: remote.billing_day,
            nextBillingDate: remote.next_billing_date || '',
            paymentMethodMemo: remote.payment_method,
            isFreeTrial: Boolean(remote.is_free_trial),
            trialEndDate: remote.trial_end_date,
            registrationMethod: 'manual',
            status: remote.status || 'active',
            createdAt: remote.created_at,
            updatedAt: remote.updated_at,
          };
          if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
            await localDb.putSubscription(mappedRemote);
          }
        }
      }
      await loadLocal();
    } catch (err) {
      console.warn('Sync failed, working offline:', err);
    }
  }, [user, loadLocal]);

  useEffect(() => {
    loadLocal().then(() => {
      if (user) syncData();
    });
  }, [user, loadLocal, syncData]);

  const addSubscription = async (subData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Subscription> => {
    const now = new Date().toISOString();
    const newSub: Subscription = {
      ...subData,
      id: crypto.randomUUID(),
      userId: user?.id || 'guest',
      createdAt: now,
      updatedAt: now,
    };

    await localDb.putSubscription(newSub);
    setSubscriptions((prev) => [...prev, newSub]);

    if (user) {
      await localDb.addToSyncQueue({ id: newSub.id, action: 'create', data: newSub });
      syncData();
    }
    return newSub;
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    const existing = await localDb.getSubscription(id);
    if (!existing) return;

    const updated: Subscription = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await localDb.putSubscription(updated);
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? updated : s)));

    if (user) {
      await localDb.addToSyncQueue({ id, action: 'update', data: updated });
      syncData();
    }
  };

  const deleteSubscription = async (id: string) => {
    await localDb.deleteSubscription(id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));

    if (user) {
      await localDb.addToSyncQueue({ id, action: 'delete', data: null });
      syncData();
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        catalog: INITIAL_CATALOG,
        loading,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        syncData,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
};
