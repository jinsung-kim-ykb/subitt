import { AiAdapter, ExtractionInput, ExtractedItem } from './types.ts';

/**
 * Gemini 3.5 Flash-Lite / 2.5 Flash 어댑터 (Google AI Studio / Vertex)
 */
export const geminiAdapter: AiAdapter = {
  name: 'gemini',

  async extract(input: ExtractionInput): Promise<ExtractedItem[]> {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }

    const promptText = `구독 결제 내역이나 캡처 이미지에서 구독 정보를 추출하여 JSON 배열로 반환하세요.
형식:
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

    const parts: any[] = [{ text: promptText }];
    if (input.maskedText) {
      parts.push({ text: `입력 텍스트:\n${input.maskedText}` });
    }
    if (input.imageBase64List) {
      for (const b64 of input.imageBase64List) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: b64.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        });
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    return JSON.parse(rawJsonText);
  }
};
