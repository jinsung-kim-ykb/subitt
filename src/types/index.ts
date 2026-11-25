export type Category = '영상' | '음악' | '쇼핑 멤버십' | 'AI' | '기타';
export type BillingCycle = 'monthly' | 'yearly';
export type RegistrationMethod = 'manual' | 'sms' | 'capture';
export type SubscriptionStatus = 'active' | 'paused' | 'canceled';

export interface Subscription {
  id: string;
  userId: string;
  serviceName: string;
  planName?: string;
  category: Category;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  billingDay?: number;
  nextBillingDate: string;
  paymentMethodMemo?: string;
  isFreeTrial: boolean;
  trialEndDate?: string;
  postTrialAmount?: number;
  registrationMethod: RegistrationMethod;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: Category;
  merchantAliases: string[];
  defaultCycle: BillingCycle;
  defaultAmount: number;
  defaultPlanName: string;
  color: string;
}

export interface Profile {
  id: string;
  displayName: string;
  email?: string;
  notificationDaysBefore: number[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLog {
  id: string;
  subscriptionId?: string;
  userId: string;
  amount: number;
  currency: string;
  paidAt: string;
  registrationMethod: RegistrationMethod;
  isCanceled: boolean;
  createdAt: string;
}
