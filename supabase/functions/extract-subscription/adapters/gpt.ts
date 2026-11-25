import { AiAdapter, ExtractionInput, ExtractedItem } from './types.ts';

/**
 * GPT-5 mini / 4o-mini 어댑터 (OpenAI Chat Completions)
 */
export const gptAdapter: AiAdapter = {
  name: 'gpt',

  async extract(input: ExtractionInput): Promise<ExtractedItem[]> {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is missing.');
    }

    const userContent: any[] = [];
    if (input.maskedText) {
      userContent.push({ type: 'text', text: `입력 텍스트:\n${input.maskedText}` });
    }
    if (input.imageBase64List) {
      for (const b64 of input.imageBase64List) {
        const fullUrl = b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`;
        userContent.push({ type: 'image_url', image_url: { url: fullUrl } });
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 구독 결제 텍스트 및 캡처에서 구독 정보를 JSON 배열 형태로 정확히 추출하는 에이전트입니다. 반드시 JSON 포맷만 반환하세요.'
          },
          { role: 'user', content: userContent }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const rawJson = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(rawJson);
    return Array.isArray(parsed) ? parsed : (parsed.subscriptions || parsed.items || []);
  }
};
