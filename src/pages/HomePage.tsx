import React from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { calculateTotals, convertToItemUnits, formatKRW } from '../lib/calculations';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const { subscriptions, loading } = useSubscriptions();
  const navigate = useNavigate();

  if (loading) {
    return <div className="p-6 text-center text-slate-400">데이터를 불러오는 중...</div>;
  }

  const totals = calculateTotals(subscriptions);
  const itemUnits = convertToItemUnits(totals.monthlyTotalKRW);

  return (
    <div className="p-4 space-y-4">
      <header className="flex justify-between items-center py-2">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">SUBIT</h1>
        <button
          onClick={() => navigate('/register')}
          className="px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 shadow-sm"
        >
          + 구독 추가
        </button>
      </header>

      {/* 월 지출 요약 카드 */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-5 shadow-md">
        <p className="text-xs text-indigo-100 font-medium">이번 달 정기 결제 예상 금액</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight">
            {formatKRW(totals.monthlyTotalKRW)}
          </span>
          <span className="text-xs text-indigo-200">원 / 월</span>
        </div>
        <p className="text-xs text-indigo-200 mt-1">
          연간 환산 시 약 {formatKRW(totals.yearlyTotalKRW)}원
        </p>

        {/* 체감 단위 환산 (S02) */}
        <div className="mt-4 pt-3 border-t border-indigo-500/40 grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-[10px] text-indigo-200">☕ 아메리카노</p>
            <p className="text-sm font-bold mt-0.5">{itemUnits.coffee}잔</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-[10px] text-indigo-200">🍗 치킨</p>
            <p className="text-sm font-bold mt-0.5">{itemUnits.chicken}마리</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-[10px] text-indigo-200">🍕 피자</p>
            <p className="text-sm font-bold mt-0.5">{itemUnits.pizza}판</p>
          </div>
        </div>
      </section>

      {/* 다가오는 결제 일정 */}
      <section className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800">결제 예정 구독</h2>
          <button
            onClick={() => navigate('/list')}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            전체보기 ({subscriptions.filter((s) => s.status === 'active').length})
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-3">
            <p className="text-sm text-slate-500">등록된 구독 서비스가 없습니다.</p>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-indigo-700"
            >
              문자나 캡처로 3초 만에 등록하기
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {subscriptions
              .filter((s) => s.status === 'active')
              .slice(0, 4)
              .map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => navigate(`/detail/${sub.id}`)}
                  className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-300 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                      {sub.category === '영상' ? '🎬' : sub.category === '음악' ? '🎵' : sub.category === 'AI' ? '🤖' : '📦'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{sub.serviceName}</p>
                      <p className="text-xs text-slate-400">
                        {sub.isFreeTrial ? '무료체험 중' : `매월 ${sub.billingDay || 1}일 결제`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatKRW(sub.currency === 'USD' ? Math.round(sub.amount * 1380) : sub.amount)}원
                    </p>
                    {sub.currency === 'USD' && (
                      <p className="text-[10px] text-slate-400">${sub.amount}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
};
