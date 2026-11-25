import React, { useState } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { formatKRW } from '../lib/calculations';

export const ListPage: React.FC = () => {
  const { subscriptions } = useSubscriptions();
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'free_trial'>('all');
  const navigate = useNavigate();

  const filtered = subscriptions.filter((s) => {
    if (filter === 'active') return s.status === 'active' && !s.isFreeTrial;
    if (filter === 'paused') return s.status === 'paused';
    if (filter === 'free_trial') return s.isFreeTrial;
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold text-slate-800">구독 목록</h1>
        <button
          onClick={() => navigate('/register')}
          className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-indigo-700"
        >
          + 추가
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full font-medium ${
            filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          전체 ({subscriptions.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-full font-medium ${
            filter === 'active' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          구독 중
        </button>
        <button
          onClick={() => setFilter('free_trial')}
          className={`px-3 py-1.5 rounded-full font-medium ${
            filter === 'free_trial' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          무료체험
        </button>
        <button
          onClick={() => setFilter('paused')}
          className={`px-3 py-1.5 rounded-full font-medium ${
            filter === 'paused' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          해지/정지
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">항목이 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sub) => (
            <div
              key={sub.id}
              onClick={() => navigate(`/detail/${sub.id}`)}
              className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-300 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{sub.serviceName}</span>
                  {sub.isFreeTrial && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">
                      무료체험
                    </span>
                  )}
                  {sub.status === 'paused' && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded">
                      일시정지
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {sub.billingCycle === 'monthly' ? '매월' : '매년'} • {sub.paymentMethodMemo || '결제수단 미지정'}
                </p>
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
    </div>
  );
};
