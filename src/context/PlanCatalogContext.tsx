import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PlanCatalogItem, BundleRule } from '../types';
import { INITIAL_PLAN_CATALOG, INITIAL_BUNDLE_RULES } from '../lib/defense/initialCatalog';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

interface PlanCatalogContextType {
  planCatalog: PlanCatalogItem[];
  bundleRules: BundleRule[];
  loading: boolean;
  addPlanItem: (item: Omit<PlanCatalogItem, 'id' | 'updatedAt'>) => Promise<void>;
  updatePlanItem: (id: string, updates: Partial<PlanCatalogItem>) => Promise<void>;
  deletePlanItem: (id: string) => Promise<void>;
  addBundleRule: (rule: Omit<BundleRule, 'id' | 'updatedAt'>) => Promise<void>;
  updateBundleRule: (id: string, updates: Partial<BundleRule>) => Promise<void>;
  deleteBundleRule: (id: string) => Promise<void>;
  catalogAgeLimitDays: number;
  setCatalogAgeLimitDays: (days: number) => void;
}

const PlanCatalogContext = createContext<PlanCatalogContextType | undefined>(undefined);

const STORAGE_PLANS_KEY = 'subit_plan_catalog';
const STORAGE_BUNDLES_KEY = 'subit_bundle_rules';
const STORAGE_AGE_LIMIT_KEY = 'subit_catalog_age_limit';

export const PlanCatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [planCatalog, setPlanCatalog] = useState<PlanCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLANS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_PLAN_CATALOG;
    } catch {
      return INITIAL_PLAN_CATALOG;
    }
  });

  const [bundleRules, setBundleRules] = useState<BundleRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BUNDLES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_BUNDLE_RULES;
    } catch {
      return INITIAL_BUNDLE_RULES;
    }
  });

  const [catalogAgeLimitDays, setCatalogAgeLimitDaysState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AGE_LIMIT_KEY);
      return saved ? Number(saved) : 45;
    } catch {
      return 45;
    }
  });

  const setCatalogAgeLimitDays = (days: number) => {
    setCatalogAgeLimitDaysState(days);
    localStorage.setItem(STORAGE_AGE_LIMIT_KEY, days.toString());
  };

  // 로컬 스토리지 동기화
  useEffect(() => {
    localStorage.setItem(STORAGE_PLANS_KEY, JSON.stringify(planCatalog));
  }, [planCatalog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_BUNDLES_KEY, JSON.stringify(bundleRules));
  }, [bundleRules]);

  // 요금표 추가
  const addPlanItem = async (item: Omit<PlanCatalogItem, 'id' | 'updatedAt'>) => {
    const newItem: PlanCatalogItem = {
      ...item,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    setPlanCatalog((prev) => [newItem, ...prev]);
  };

  // 요금표 수정 (요금 인상 시 C3 알림 트리거)
  const updatePlanItem = async (id: string, updates: Partial<PlanCatalogItem>) => {
    const existing = planCatalog.find((p) => p.id === id);
    const now = new Date().toISOString();

    const updatedItem: PlanCatalogItem = existing
      ? { ...existing, ...updates, updatedAt: now }
      : ({} as PlanCatalogItem);

    setPlanCatalog((prev) => prev.map((p) => (p.id === id ? updatedItem : p)));

    // C3: 요금이 이전보다 올랐을 경우 요금 인상 알림 생성
    if (existing && updates.amount && updates.amount > existing.amount) {
      if (user) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'price_increase',
          title: `[요금 인상 안내] ${existing.serviceName}`,
          body: `${existing.serviceName} (${existing.planName}) 요금이 ${existing.amount.toLocaleString()}원에서 ${updates.amount.toLocaleString()}원으로 인상되었습니다. 줄이기 화면에서 대안 요금제를 확인하세요.`,
          idempotency_key: `price_increase:${existing.id}:${now}`,
          scheduled_at: now,
          sent_at: now,
          is_read: false,
        });
      }
      await refreshNotifications();
    }
  };

  // 요금표 삭제
  const deletePlanItem = async (id: string) => {
    setPlanCatalog((prev) => prev.filter((p) => p.id !== id));
  };

  // 결합 규칙 추가
  const addBundleRule = async (rule: Omit<BundleRule, 'id' | 'updatedAt'>) => {
    const newRule: BundleRule = {
      ...rule,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    setBundleRules((prev) => [newRule, ...prev]);
  };

  // 결합 규칙 수정
  const updateBundleRule = async (id: string, updates: Partial<BundleRule>) => {
    setBundleRules((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b))
    );
  };

  // 결합 규칙 삭제
  const deleteBundleRule = async (id: string) => {
    setBundleRules((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <PlanCatalogContext.Provider
      value={{
        planCatalog,
        bundleRules,
        loading: false,
        addPlanItem,
        updatePlanItem,
        deletePlanItem,
        addBundleRule,
        updateBundleRule,
        deleteBundleRule,
        catalogAgeLimitDays,
        setCatalogAgeLimitDays,
      }}
    >
      {children}
    </PlanCatalogContext.Provider>
  );
};

export const usePlanCatalog = () => {
  const context = useContext(PlanCatalogContext);
  if (!context) {
    throw new Error('usePlanCatalog must be used within a PlanCatalogProvider');
  }
  return context;
};
