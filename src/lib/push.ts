import { supabase } from './supabase';
import { isStandalone, detectDevice } from '../components/pwa/AddToHomeScreenPrompt';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZ_FqSnjSbDebZfxBodOu056V3BpKkvEkU2hZn0';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * 웹 푸시 구독 요청 및 등록
 */
export async function subscribeToWebPush(userId: string): Promise<boolean> {
  const device = detectDevice();

  // iOS 16.4+는 홈 화면에 추가된 PWA(Standalone)에서만 푸시 지원
  if (device === 'ios' && !isStandalone()) {
    throw new Error('IOS_STANDALONE_REQUIRED');
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('PUSH_NOT_SUPPORTED');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('PERMISSION_DENIED');
  }

  const registration = await navigator.serviceWorker.ready;
  let pushSub = await registration.pushManager.getSubscription();

  if (!pushSub) {
    pushSub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const p256dh = pushSub.getKey('p256dh');
  const auth = pushSub.getKey('auth');

  if (!p256dh || !auth) {
    throw new Error('KEYS_MISSING');
  }

  const keysP256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dh))));
  const keysAuth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(auth))));

  // Supabase push_subscriptions 테이블에 저장
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: pushSub.endpoint,
    keys_p256dh: keysP256dh,
    keys_auth: keysAuth,
    device_type: device,
    is_active: true,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('Failed to save push subscription to DB:', error);
  }

  return true;
}

/**
 * 푸시 구독 해제
 */
export async function unsubscribeWebPush(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const pushSub = await registration.pushManager.getSubscription();
  if (pushSub) {
    await pushSub.unsubscribe();
    await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('endpoint', pushSub.endpoint);
  }
  return true;
}
