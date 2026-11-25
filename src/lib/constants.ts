import { ServiceCatalogItem } from '../types';

export const APP_NAME = import.meta.env.VITE_APP_NAME || '구독비서';
export const CATEGORIES = ['영상', '음악', '쇼핑 멤버십', 'AI', '기타'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  '영상': '#EF4444',
  '음악': '#10B981',
  '쇼핑 멤버십': '#3B82F6',
  'AI': '#8B5CF6',
  '기타': '#6B7280'
};

export const INITIAL_CATALOG: ServiceCatalogItem[] = [
  { id: 'netflix', name: '넷플릭스', category: '영상', merchantAliases: ['넷플릭스', 'NETFLIX'], defaultCycle: 'monthly', defaultAmount: 13500, defaultPlanName: '스탠다드', color: '#E50914' },
  { id: 'disney', name: '디즈니플러스', category: '영상', merchantAliases: ['디즈니', '디즈니+', 'DISNEY'], defaultCycle: 'monthly', defaultAmount: 11500, defaultPlanName: '스탠다드', color: '#113CCF' },
  { id: 'tving', name: '티빙', category: '영상', merchantAliases: ['티빙', 'TVING'], defaultCycle: 'monthly', defaultAmount: 9500, defaultPlanName: '스탠다드', color: '#FF153C' },
  { id: 'youtube-premium', name: '유튜브 프리미엄', category: '영상', merchantAliases: ['구글', '유튜브', 'YOUTUBE', 'GOOGLE'], defaultCycle: 'monthly', defaultAmount: 14900, defaultPlanName: '개인 멤버십', color: '#FF0000' },
  { id: 'coupang-wow', name: '쿠팡 와우', category: '쇼핑 멤버십', merchantAliases: ['쿠팡', 'COUPANG'], defaultCycle: 'monthly', defaultAmount: 7890, defaultPlanName: '와우 멤버십', color: '#00A0E9' },
  { id: 'naver-plus', name: '네이버플러스', category: '쇼핑 멤버십', merchantAliases: ['네이버', 'NAVER'], defaultCycle: 'monthly', defaultAmount: 4900, defaultPlanName: '월간 이용권', color: '#03C75A' },
  { id: 'spotify', name: '스포티파이', category: '음악', merchantAliases: ['스포티파이', 'SPOTIFY'], defaultCycle: 'monthly', defaultAmount: 10900, defaultPlanName: '개인 Premium', color: '#1DB954' },
  { id: 'melon', name: '멜론', category: '음악', merchantAliases: ['멜론', 'MELON', '카카오엠'], defaultCycle: 'monthly', defaultAmount: 10900, defaultPlanName: '스트리밍 클럽', color: '#00CD3C' },
  { id: 'chatgpt-plus', name: 'ChatGPT Plus', category: 'AI', merchantAliases: ['OPENAI', 'CHATGPT'], defaultCycle: 'monthly', defaultAmount: 29000, defaultPlanName: 'Plus 플랜', color: '#10A37F' },
  { id: 'claude-pro', name: 'Claude Pro', category: 'AI', merchantAliases: ['ANTHROPIC', 'CLAUDE'], defaultCycle: 'monthly', defaultAmount: 29000, defaultPlanName: 'Pro 플랜', color: '#D97757' }
];
