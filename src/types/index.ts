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
  role: 'user' | 'admin';
  notificationDaysBefore: number[]; // 기본 [3, 1]
  pushEnabled: boolean;
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

// --- 3단계. 알림 타입 ---
export type NotificationType =
  | 'billing_d3'
  | 'billing_d1'
  | 'trial_d3'
  | 'trial_d1'
  | 'price_increase'
  | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  subscriptionId?: string;
  type: NotificationType;
  title: string;
  body: string;
  idempotencyKey: string;
  scheduledAt: string; // ISO date-time
  sentAt?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  keysP256dh: string;
  keysAuth: string;
  deviceType: 'ios' | 'android' | 'desktop';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- 4단계. 구독료 방어 타입 ---
export interface PlanCatalogItem {
  id: string;
  serviceId: string;
  serviceName: string;
  planName: string;
  category: Category;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  features?: string;
  isExample: boolean;
  updatedAt: string;
}

export interface BundleRule {
  id: string;
  serviceId: string;
  serviceName: string;
  bundleName: string;
  provider: string; // 예: 통신사 결합(SKT, KT, LGU+), 네이버플러스, 카드사 제휴
  discountedAmount: number;
  originalAmount: number;
  condition: string; // 예: "5G 요금제 이용 시", "네이버 멤버십 구독자"
  actionUrl: string;
  isExample: boolean;
  updatedAt: string;
}

export type DefenseType = 'plan_downgrade' | 'bundle' | 'yearly_conversion' | 'duplicate_warning';

export interface DefenseRecommendation {
  id: string;
  subscriptionId: string;
  serviceName: string;
  type: DefenseType;
  title: string;
  currentPlan: string;
  currentAmount: number;
  recommendedPlan: string;
  recommendedAmount: number;
  monthlySavings: number; // 월 환산 절감액
  condition?: string;
  actionUrl?: string;
  catalogUpdatedAt: string;
  isDismissed: boolean;
  isExample: boolean;
}

export interface DefenseSummary {
  totalMonthlySavings: number; // 중복/상충 제거 후 실제 절감 가능 총액
  opportunitiesCount: number;
  recommendations: DefenseRecommendation[];
  duplicateWarnings: {
    category: Category;
    services: string[];
    monthlyTotal: number;
  }[];
}
