export interface ExtractedSmsItem {
  merchantName: string;
  matchedServiceName?: string;
  category?: '영상' | '음악' | '쇼핑 멤버십' | 'AI' | '기타';
  planName?: string;
  amount: number;
  currency: string;
  paidAt: string; // YYYY-MM-DD HH:mm 또는 YYYY-MM-DD
  isCancellation: boolean;
  cardCompany?: string;
  confidence: number; // 0.0 ~ 1.0 (SPEC 6장)
  rawSnippet: string;
  billingCycle?: 'monthly' | 'yearly';
}

export interface SmsParser {
  cardCompany: string;
  canParse(text: string): boolean;
  parse(text: string): ExtractedSmsItem | null;
}
