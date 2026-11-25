import React, { createContext, useContext, useState, useEffect } from 'react';
import { CancellationGuide, CostPerUseResult, PaymentChannel } from '../types';
import { INITIAL_CANCELLATION_GUIDES, findCancellationGuide } from '../lib/cancellation/initialGuides';
import { calculateCostPerUse } from '../lib/cancellation/costPerUse';

interface CancellationContextType {
  guides: CancellationGuide[];
  addGuide: (guide: Omit<CancellationGuide, 'id' | 'updatedAt'>) => CancellationGuide;
  updateGuide: (id: string, updates: Partial<CancellationGuide>) => void;
  deleteGuide: (id: string) => void;
  getGuide: (serviceName: string, channel?: PaymentChannel) => CancellationGuide | undefined;
  recordUsage: (subscriptionId: string, count: number) => void;
  getUsage: (subscriptionId: string, monthlyAmount: number) => CostPerUseResult;
  getRawUsageCount: (subscriptionId: string) => number;
}

const CancellationContext = createContext<CancellationContextType | undefined>(undefined);

const GUIDES_STORAGE_KEY = 'subit_cancellation_guides';
const USAGE_STORAGE_KEY = 'subit_usage_checkins';

export const CancellationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guides, setGuides] = useState<CancellationGuide[]>(() => {
    try {
      const saved = localStorage.getItem(GUIDES_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load cancellation guides', e);
    }
    return INITIAL_CANCELLATION_GUIDES;
  });

  const [usageCheckIns, setUsageCheckIns] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(USAGE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load usage checkins', e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(guides));
    } catch (e) {
      console.error(e);
    }
  }, [guides]);

  useEffect(() => {
    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usageCheckIns));
    } catch (e) {
      console.error(e);
    }
  }, [usageCheckIns]);

  const currentYearMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const addGuide = (data: Omit<CancellationGuide, 'id' | 'updatedAt'>) => {
    const newGuide: CancellationGuide = {
      ...data,
      id: `guide_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setGuides((prev) => [newGuide, ...prev]);
    return newGuide;
  };

  const updateGuide = (id: string, updates: Partial<CancellationGuide>) => {
    setGuides((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              ...updates,
              updatedAt: new Date().toISOString(), // 고치면 갱신일 자동 기록
            }
          : g
      )
    );
  };

  const deleteGuide = (id: string) => {
    setGuides((prev) => prev.filter((g) => g.id !== id));
  };

  const getGuide = (serviceName: string, channel: PaymentChannel = 'web') => {
    return findCancellationGuide(guides, serviceName, channel);
  };

  const recordUsage = (subscriptionId: string, count: number) => {
    const key = `${subscriptionId}_${currentYearMonth()}`;
    setUsageCheckIns((prev) => ({
      ...prev,
      [key]: Math.max(0, count),
    }));
  };

  const getRawUsageCount = (subscriptionId: string) => {
    const key = `${subscriptionId}_${currentYearMonth()}`;
    return usageCheckIns[key] !== undefined ? usageCheckIns[key] : 1; // 기본 1회
  };

  const getUsage = (subscriptionId: string, monthlyAmount: number): CostPerUseResult => {
    const count = getRawUsageCount(subscriptionId);
    return calculateCostPerUse(monthlyAmount, count);
  };

  return (
    <CancellationContext.Provider
      value={{
        guides,
        addGuide,
        updateGuide,
        deleteGuide,
        getGuide,
        recordUsage,
        getUsage,
        getRawUsageCount,
      }}
    >
      {children}
    </CancellationContext.Provider>
  );
};

export const useCancellation = () => {
  const context = useContext(CancellationContext);
  if (!context) {
    throw new Error('useCancellation must be used within a CancellationProvider');
  }
  return context;
};
