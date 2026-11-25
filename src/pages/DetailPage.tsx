import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useParty } from '../context/PartyContext';
import { useCancellation } from '../context/CancellationContext';
import { formatKRW } from '../lib/calculations';
import { CancellationModal } from '../components/cancellation/CancellationModal';

export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { subscriptions, updateSubscription, deleteSubscription } = useSubscriptions();
  const { getPartyBySubscriptionId } = useParty();
  const { getUsage, recordUsage, getRawUsageCount } = useCancellation();
  const navigate = useNavigate();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(
    searchParams.get('openCancel') === 'true'
  );

  const sub = subscriptions.find((s) => s.id === id);
  const party = sub ? getPartyBySubscriptionId(sub.id) : undefined;

  if (!sub) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-slate-500">구독 정보를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/list')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs rounded-lg"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('이 구독을 삭제하시겠습니까?')) {
      await deleteSubscription(sub.id);
      navigate('/list');
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = sub.status === 'active' ? 'paused' : 'active';
    await updateSubscription(sub.id, { status: nextStatus });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-500 hover:text-slate-800"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-slate-800">구독 상세</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{sub.serviceName}</h2>
            <p className="text-xs text-slate-400 capitalize">{sub.category} • {sub.billingCycle}</p>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              sub.status === 'active'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {sub.status === 'active' ? '구독 중' : '정지됨'}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
          <span className="text-sm text-slate-500">결제 금액</span>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatKRW(sub.currency === 'USD' ? Math.round(sub.amount * 1380) : sub.amount)}원
            </span>
            {sub.currency === 'USD' && (
              <p className="text-xs text-slate-400">${sub.amount} (적용환율: 1,380원)</p>
            )}
          </div>
        </div>

        {sub.isFreeTrial && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold flex items-center gap-1">
                <span>⏳</span> 무료체험 기간 중
              </p>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-2 py-1 rounded text-[11px]"
              >
                해지 방법 확인
              </button>
            </div>
            <p>
              종료일: {sub.trialEndDate ? new Date(sub.trialEndDate).toLocaleDateString() : '미정'}
            </p>
          </div>
        )}

        <div className="space-y-2 pt-2 text-xs text-slate-600 border-t border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-400">결제 수단</span>
            <span className="font-medium">{sub.paymentMethodMemo || '미지정'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">정기 결제일</span>
            <span className="font-medium">매월 {sub.billingDay || 1}일</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">다음 결제 예정일</span>
            <span className="font-medium">{sub.nextBillingDate || '미정'}</span>
          </div>
        </div>
      </div>

      {/* 6단계: 이번 달 가성비 체크 (D7) */}
      {(() => {
        const monthlyAmount = sub.currency === 'USD' ? Math.round(sub.amount * 1380) : sub.amount;
        const costResult = getUsage(sub.id, monthlyAmount);
        const currentCount = getRawUsageCount(sub.id);

        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">📊</span>
                <h3 className="font-bold text-sm text-slate-800">이번 달 가성비 체크 (D7)</h3>
              </div>
              <span className="text-[11px] text-slate-400">월 1회 체크인</span>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs text-slate-500">이번 달 실제 이용 횟수</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => recordUsage(sub.id, Math.max(0, currentCount - 1))}
                    className="w-7 h-7 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm shadow-xs"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-base text-slate-800 w-8 text-center">
                    {currentCount}회
                  </span>
                  <button
                    onClick={() => recordUsage(sub.id, currentCount + 1)}
                    className="w-7 h-7 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500 mb-0.5">회당 체감 비용</p>
                {costResult.isUnused ? (
                  <span className="inline-block bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs px-2.5 py-1 rounded-lg">
                    이번 달 사용하지 않음
                  </span>
                ) : (
                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-sm px-2.5 py-1 rounded-lg">
                    {costResult.statusLabel}
                  </span>
                )}
              </div>
            </div>

            {/* 0회 미사용 시 해지 유도 안내 */}
            {costResult.isUnused && (
              <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold flex items-center gap-1">
                    <span>💡</span> 불필요한 고정 지출을 줄여보세요
                  </p>
                  <p className="text-[11px] text-slate-600">
                    이번 달 이용하지 않았다면 일시정지 또는 해지를 추천합니다.
                  </p>
                </div>
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs shrink-0"
                >
                  해지 가이드
                </button>
              </div>
            )}
          </div>
        );
      })()}

      <div className="space-y-2 pt-2">
        {/* 6단계: 해지 가이드 버튼 (F1) */}
        <button
          onClick={() => setIsCancelModalOpen(true)}
          className="w-full py-3 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>🚪</span>
          <span>해지 가이드 및 링크 확인 (F1)</span>
        </button>

        {party ? (
          <button
            onClick={() => navigate(`/party/${party.id}`)}
            className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl border border-blue-200 flex items-center justify-center gap-1.5"
          >
            <span>👥</span>
            <span>파티 정산 관리 ({party.members.length}명 진행 중)</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/party')}
            className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5"
          >
            <span>👥</span>
            <span>이 구독으로 파티 만들기</span>
          </button>
        )}

        <button
          onClick={handleToggleStatus}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
        >
          {sub.status === 'active' ? '일시정지 상태로 변경' : '구독 다시 시작'}
        </button>
        <button
          onClick={handleDelete}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-semibold rounded-xl"
        >
          구독 삭제
        </button>
      </div>

      {/* 6단계: 해지 가이드 모달 (F1) */}
      <CancellationModal
        serviceName={sub.serviceName}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
};
