import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, Smartphone, X } from 'lucide-react';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  triggerContext?: 'first_registration' | 'manual';
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export function detectDevice(): 'ios' | 'android' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

export const AddToHomeScreenPrompt: React.FC<Props> = ({
  isOpen = true,
  onClose,
  triggerContext = 'first_registration',
}) => {
  const [device, setDevice] = useState<'ios' | 'android' | 'desktop'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    setDevice(detectDevice());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallAndroid = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setVisible(false);
        onClose?.();
      }
      setDeferredPrompt(null);
    } else {
      alert('브라우저 메뉴(⋮)에서 [홈 화면에 추가] 또는 [앱 설치]를 선택해 주세요.');
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
            <Smartphone className="w-5 h-5" />
          </div>
          <button
            onClick={() => {
              setVisible(false);
              onClose?.();
            }}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800">
            {triggerContext === 'first_registration' ? '구독이 성공적으로 등록되었습니다!' : '홈 화면에 추가하기'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {device === 'ios'
              ? '아이폰은 홈 화면에 앱을 추가해야만 결제일 및 무료체험 종료 알림을 정상 수신할 수 있습니다.'
              : '홈 화면에 앱을 추가하면 실시간 결제일 알림과 빠른 실행이 가능합니다.'}
          </p>
        </div>

        {/* OS별 맞춤 안내 */}
        {device === 'ios' ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-700">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                1
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                하단 사파리 바의 <Share className="w-4 h-4 text-blue-500 inline" /> <b>공유 버튼</b>을 누릅니다.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                2
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                메뉴에서 <PlusSquare className="w-4 h-4 text-slate-700 inline" /> <b>'홈 화면에 추가'</b>를 선택합니다.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                3
              </span>
              <span>홈 화면에 생긴 SUBIT 아이콘으로 실행하면 웹 푸시 설정이 활성화됩니다!</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleInstallAndroid}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <PlusSquare className="w-4 h-4" /> 지금 홈 화면에 추가하기
            </button>
            <p className="text-[11px] text-center text-slate-400">
              크롬 브라우저 우측 상단 메뉴(⋮)에서도 설치할 수 있습니다.
            </p>
          </div>
        )}

        <button
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 font-medium"
        >
          나중에 하기
        </button>
      </div>
    </div>
  );
};
