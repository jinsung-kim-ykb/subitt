import { ExtractedSmsItem, SmsParser } from './types';
import { shinhanParser } from './parsers/shinhan';
import { kbParser } from './parsers/kb';
import { hyundaiParser } from './parsers/hyundai';
import { samsungParser } from './parsers/samsung';
import { genericParser } from './parsers/generic';
import { matchCatalogItem } from './catalogMatcher';
import { ServiceCatalogItem } from '../../types';

// 카드사 파서 목록 (순차 매칭)
const registeredParsers: SmsParser[] = [
  shinhanParser,
  kbParser,
  hyundaiParser,
  samsungParser
];

/**
 * 한 건의 문자 파싱
 */
export function parseSingleSms(text: string, catalog: ServiceCatalogItem[] = []): ExtractedSmsItem | null {
  const cleanText = text.trim();
  if (!cleanText) return null;

  // 1. 카드사 전용 파서 매칭
  for (const parser of registeredParsers) {
    if (parser.canParse(cleanText)) {
      const parsed = parser.parse(cleanText);
      if (parsed) {
        return matchCatalogItem(parsed, catalog);
      }
    }
  }

  // 2. 카드사 전용 파서에 걸리지 않으면 일반 파서 시도
  const genericParsed = genericParser.parse(cleanText);
  if (genericParsed) {
    return matchCatalogItem(genericParsed, catalog);
  }

  return null;
}

/**
 * 여러 건의 문자가 포함된 텍스트를 건별로 분리하여 파싱 (SPEC 4장 A1)
 * [Web발신] 또는 빈 줄 2개 이상 기준으로 분리
 */
export function parseMultiSms(rawText: string, catalog: ServiceCatalogItem[] = []): ExtractedSmsItem[] {
  // [Web발신] 기준으로 먼저 나누거나, 없으면 이중 개행으로 분리
  let chunks: string[] = [];

  if (rawText.includes('[Web발신]')) {
    chunks = rawText
      .split('[Web발신]')
      .map(c => c.trim())
      .filter(Boolean)
      .map(c => `[Web발신]\n${c}`);
  } else {
    chunks = rawText
      .split(/\n\s*\n/)
      .map(c => c.trim())
      .filter(Boolean);
  }

  const results: ExtractedSmsItem[] = [];

  for (const chunk of chunks) {
    const item = parseSingleSms(chunk, catalog);
    if (item) {
      results.push(item);
    }
  }

  return results;
}
