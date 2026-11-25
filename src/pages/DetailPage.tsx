import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../context/SubscriptionContext';
import { formatKRW } from '../lib/calculations';

export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { subscriptions, updateSubscription, deleteSubscription } = useSubscriptions();
  const navigate = useNavigate();

  const sub = subscriptions.find((s) => s.id === id);

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
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <p className="font-bold">무료체험 기간 중</p>
            <p className="mt-1">
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

      <div className="space-y-2 pt-4">
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
    </div>
  );
};
