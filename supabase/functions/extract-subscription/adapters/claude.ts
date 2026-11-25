import { AiAdapter, ExtractionInput, ExtractedItem } from './types.ts';

/**
 * Claude Haiku 5.5 어댑터 (Anthropic Messages API)
 * 원문 저장/학습 금지 헤더 포함
 */
export const claudeAdapter: AiAdapter = {
  name: 'claude',

  async extract(input: ExtractionInput): Promise<ExtractedItem[]> {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is missing.');
    }

    const systemPrompt = `당신은 구독 결제 텍스트 및 영수증/캡처에서 구독 정보를 정확히 추출하는 전문가입니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 설명 텍스트는 일절 금지합니다.
[
  {
    "serviceName": "서비스명",
    "planName": "요금제명",
    "category": "영상" | "음악" | "쇼핑 멤버십" | "AI" | "기타",
    "amount": 숫자(원화 환산),
    "currency": "KRW",
    "billingCycle": "monthly" | "yearly",
    "nextBillingDate": "YYYY-MM-DD",
    "isFreeTrial": boolean,
    "trialEndDate": "YYYY-MM-DD",
    "postTrialAmount": 숫자,
    "confidence": {
      "serviceName": 0.0~1.0,
      "amount": 0.0~1.0,
      "billingDate": 0.0~1.0,
      "overall": 0.0~1.0
    }
  }
]`;

    const content: any[] = [];
    if (input.maskedText) {
      content.push({ type: 'text', text: `[결제 문자 텍스트]:\n${input.maskedText}` });
    }
    if (input.imageBase64List) {
      for (const b64 of input.imageBase64List) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: b64.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        });
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const rawJsonText = data.content?.[0]?.text || '[]';
    return JSON.parse(rawJsonText);
  }
};
