import { Subscription, Category } from '../types';
import { differenceInDays, parseISO, isAfter, isBefore, endOfMonth, startOfDay } from 'date-fns';

export function calculateMonthlyEquivalent(subscription: Subscription): number {
  if (subscription.status !== 'active') return 0;
  if (subscription.isFreeTrial) return 0;
  if (subscription.billingCycle === 'yearly') {
    return Math.round(subscription.amount / 12);
  }
  return subscription.amount;
}

export function calculateYearlyEquivalent(subscription: Subscription): number {
  if (subscription.status !== 'active') return 0;
  if (subscription.isFreeTrial) return 0;
  if (subscription.billingCycle === 'yearly') {
    return subscription.amount;
  }
  return subscription.amount * 12;
}

export function calculateTotalSpend(subscriptions: Subscription[]): { monthlyTotal: number; yearlyTotal: number } {
  const activeSubs = subscriptions.filter(s => s.status === 'active' && !s.isFreeTrial);
  const monthlyTotal = activeSubs.reduce((acc, sub) => acc + calculateMonthlyEquivalent(sub), 0);
  const yearlyTotal = activeSubs.reduce((acc, sub) => acc + calculateYearlyEquivalent(sub), 0);
  return { monthlyTotal, yearlyTotal };
}

export function calculateRemainingThisMonth(subscriptions: Subscription[], referenceDate: Date = new Date()): number {
  const today = startOfDay(referenceDate);
  const monthEnd = endOfMonth(today);

  return subscriptions
    .filter(s => s.status === 'active' && !s.isFreeTrial)
    .filter(s => {
      if (!s.nextBillingDate) return false;
      const billingDate = startOfDay(parseISO(s.nextBillingDate));
      return !isBefore(billingDate, today) && !isAfter(billingDate, monthEnd);
    })
    .reduce((acc, sub) => acc + sub.amount, 0);
}

export interface UpcomingPayment {
  subscription: Subscription;
  daysRemaining: number;
  displayDate: string;
}

export function getUpcomingPayments(subscriptions: Subscription[], referenceDate: Date = new Date()): UpcomingPayment[] {
  const today = startOfDay(referenceDate);

  return subscriptions
    .filter(s => s.status === 'active')
    .map(s => {
      const billingDate = startOfDay(parseISO(s.nextBillingDate));
      return {
        subscription: s,
        daysRemaining: differenceInDays(billingDate, today),
        displayDate: s.nextBillingDate
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export interface CategorySpend {
  category: Category;
  amount: number;
  percentage: number;
  count: number;
}

export function calculateCategorySpend(subscriptions: Subscription[]): CategorySpend[] {
  const activeSubs = subscriptions.filter(s => s.status === 'active' && !s.isFreeTrial);
  const total = activeSubs.reduce((acc, s) => acc + calculateMonthlyEquivalent(s), 0);
  const map = new Map<Category, { amount: number; count: number }>();

  for (const sub of activeSubs) {
    const prev = map.get(sub.category) || { amount: 0, count: 0 };
    map.set(sub.category, {
      amount: prev.amount + calculateMonthlyEquivalent(sub),
      count: prev.count + 1
    });
  }

  const result: CategorySpend[] = [];
  map.forEach((value, category) => {
    result.push({
      category,
      amount: value.amount,
      percentage: total > 0 ? Math.round((value.amount / total) * 100) : 0,
      count: value.count
    });
  });

  return result.sort((a, b) => b.amount - a.amount);
}

export function formatCurrency(amount: number, currency: string = 'KRW'): string {
  const formatted = Math.round(amount).toLocaleString('ko-KR');
  return currency === 'KRW' ? `${formatted}원` : `${currency} ${formatted}`;
}

export function formatKRW(amount: number): string {
  return Math.round(amount).toLocaleString('ko-KR');
}

export function convertToItemUnits(amountKRW: number) {
  return {
    coffee: Math.floor(amountKRW / 4500),
    chicken: Math.floor(amountKRW / 20000),
    pizza: Math.floor(amountKRW / 25000),
  };
}

export function calculateTotals(subscriptions: Subscription[]) {
  const { monthlyTotal, yearlyTotal } = calculateTotalSpend(subscriptions);
  return {
    monthlyTotalKRW: monthlyTotal,
    yearlyTotalKRW: yearlyTotal,
  };
}

