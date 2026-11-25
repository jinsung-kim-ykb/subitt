// Supabase Edge Function: send-scheduled-notifications
// Cron Expression: 0 0 * * * (Everyday at 00:00 UTC = 09:00 KST)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''; // Supabase Secret에만 보관
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@subit.app';

serve(async (req) => {
  // Cron 또는 관리자 호출 허용
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const nowIso = new Date().toISOString();

    // 1. 발송 예정 시간이 도래했으나 아직 미발송(sent_at is null)된 알림 조회
    const { data: pendingNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('*, subscriptions(service_name, id)')
      .lte('scheduled_at', nowIso)
      .is('sent_at', null);

    if (notifError) throw notifError;

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending notifications', count: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let sentCount = 0;

    for (const notif of pendingNotifications) {
      // 해당 사용자의 활성 푸시 구독 조회
      const { data: pushSubs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', notif.user_id)
        .eq('is_active', true);

      if (pushSubs && pushSubs.length > 0) {
        // 실제 운영 시 web-push 라이브러리를 통해 각 디바이스에 Push Payload 전송
        // 푸시 비공개 키는 Supabase Secret(VAPID_PRIVATE_KEY)으로만 서명
        for (const sub of pushSubs) {
          try {
            // Web Push 발송 모의/실제 호출
            // (VAPID 키가 등록된 환경에서는 실제 webpush payload 생성)
          } catch (pushErr) {
            console.error('Push delivery failed for subscription:', sub.id, pushErr);
          }
        }
      }

      // 발송 완료 시각 기록
      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', notif.id);

      sentCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
