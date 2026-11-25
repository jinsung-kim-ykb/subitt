import React, { useState } from 'react';
import { PaymentChannel } from '../../types';
import { useCancellation } from '../../context/CancellationContext';

interface CancellationModalProps {
  serviceName: string;
  defaultChannel?: PaymentChannel;
  isOpen: boolean;
  onClose: () => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  serviceName,
  defaultChannel = 'web',
  isOpen,
  onClose,
}) => {
  const { getGuide } = useCancellation();
  const [activeChannel, setActiveChannel] = useState<PaymentChannel>(defaultChannel);

  if (!isOpen) return null;

  const guide = getGuide(serviceName, activeChannel);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white w-full max-w-[420px] rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🚪</span>
            <h2 className="font-bold text-base text-slate-800">{serviceName} 해지 가이드 (F1)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        {/* 결제 경로 탭 (F1: 웹 직접결제, 앱스토어, 구글플레이) */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveChannel('web')}
            className={`py-2 rounded-lg transition-all ${
              activeChannel === 'web'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            웹 직접 결제
          </button>
          <button
            onClick={() => setActiveChannel('appstore')}
            className={`py-2 rounded-lg transition-all ${
              activeChannel === 'appstore'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Apple 앱스토어
          </button>
          <button
            onClick={() => setActiveChannel('googleplay')}
            className={`py-2 rounded-lg transition-all ${
              activeChannel === 'googleplay'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Google Play
          </button>
        </div>

        {/* 가이드 내용 */}
        {guide ? (
          <div className="space-y-4 text-xs">
            {/* 가이드 메타 배지 */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                {guide.isExample && (
                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                    예시 가이드
                  </span>
                )}
                <span>
                  갱신일: {new Date(guide.updatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </span>
              </div>
            </div>

            {/* 바로가기 버튼 */}
            {guide.directCancelUrl && (
              <a
                href={guide.directCancelUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full bg-slate-900 hover:bg-black text-white text-center py-2.5 rounded-xl font-bold shadow-sm transition-all"
              >
                공식 해지/구독 관리 페이지 이동 ↗
              </a>
            )}

            {/* 단계별 절차 안내 */}
            <div className="space-y-2 pt-1">
              <h3 className="font-bold text-slate-700 text-xs">단계별 해지 방법</h3>
              <div className="space-y-2">
                {guide.steps.map((step) => (
                  <div key={step.stepNumber} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {step.stepNumber}
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">{step.title}</p>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 주의사항 */}
            {guide.cautionNote && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>⚠️</span> 해지 전 주의사항
                </p>
                <p className="text-slate-600">{guide.cautionNote}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-2 text-xs">
            <span className="text-3xl block">ℹ️</span>
            <p className="font-semibold text-slate-700">해당 결제 경로의 등록된 가이드가 없습니다.</p>
            <p className="text-[11px] text-slate-400">
              운영자가 가이드를 등록 중이거나 일반 고객센터를 통해 해지가 가능합니다.
            </p>
          </div>
        )}

        {/* 닫기 버튼 */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl font-semibold text-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
