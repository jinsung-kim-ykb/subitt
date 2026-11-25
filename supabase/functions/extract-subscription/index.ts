// Supabase Edge Function: extract-subscription (AGENTS.md 5장, SPEC 6장)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { ExtractionInput } from './adapters/types.ts';
import { mockAdapter } from './adapters/mock.ts';
import { claudeAdapter } from './adapters/claude.ts';
import { geminiAdapter } from './adapters/gemini.ts';
import { gptAdapter } from './adapters/gpt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // CORS 프리플라이트
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const input: ExtractionInput = await req.json();

    // AGENTS.md 6장 보안 규칙:
    // 원문 문자와 이미지를 데이터베이스, 저장소, 로그에 남기지 않습니다!
    // (req body 및 input 객체는 콘솔 로그에 출력하지 않음)

    // 환경 변수 AI_PROVIDER 하나로 제공자 교체 (기본값: mock)
    const providerName = (Deno.env.get('AI_PROVIDER') || 'mock').toLowerCase();

    let adapter = mockAdapter;
    if (providerName === 'claude') {
      adapter = claudeAdapter;
    } else if (providerName === 'gemini') {
      adapter = geminiAdapter;
    } else if (providerName === 'gpt') {
      adapter = gptAdapter;
    }

    const items = await adapter.extract(input);

    return new Response(JSON.stringify({ success: true, provider: adapter.name, items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    // 에러 발생 시에도 민감 정보는 마스킹하고 메시지만 반환
    return new Response(
      JSON.stringify({ success: false, error: error.message || '추출 중 오류가 발생했습니다.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
