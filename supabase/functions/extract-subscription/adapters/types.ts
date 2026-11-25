export type ExtractedCaptureType =
  | 'app_store'
  | 'card_history'
  | 'receipt_email'
  | 'trial_screen';

export interface ExtractedItem {
  serviceName: string;
  planName?: string;
  category: '영상' | '음악' | '쇼핑 멤버십' | 'AI' | '기타';
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string; // YYYY-MM-DD
  isFreeTrial: boolean;
  trialEndDate?: string;
  postTrialAmount?: number;
  confidence: {
    serviceName: number; // 0.0 ~ 1.0
    amount: number;
    billingDate: number;
    overall: number;
  };
  notes?: string;
}

export interface ExtractionInput {
  maskedText?: string;
  imageBase64List?: string[];
  captureTypeHint?: ExtractedCaptureType;
}

export interface AiAdapter {
  name: string;
  extract(input: ExtractionInput): Promise<ExtractedItem[]>;
}
