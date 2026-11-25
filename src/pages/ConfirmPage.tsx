import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../context/SubscriptionContext';
import { ExtractedCandidate } from '../lib/api';
import { ArrowLeft, CheckCircle2, AlertTriangle, Trash2, Edit2, Sparkles, XCircle } from 'lucide-react';
import { formatCurrency } from '../lib/calculations';
import { CATEGORIES } from '../lib/constants';
import { Category, BillingCycle } from '../types';

export const ConfirmPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscriptions, addSubscription, updateSubscription } = useSubscriptions();

  const candidatesFromState = (location.state?.candidates as ExtractedCandidate[]) || [];
  const source = location.state?.source || 'manual';

  const [items, setItems] = useState<ExtractedCandidate[]>(candidatesFromState);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    navigate('/register');
    return null;
  }

  // 항목 삭제
  const handleRemoveItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    if (next.length === 0) {
      navigate('/register');
    } else {
      setItems(next);
    }
  };

  // 항목 값 수정
  const handleUpdateItem = (index: number, updates: Partial<ExtractedCandidate>) => {
    setItems(prev =>
      prev.map((it, i) => (i === index ? { ...it, ...updates, confidence: 1.0 } : it))
    );
  };

  // 일괄 확정 처리 (A4, SPEC 6장)
  const handleConfirmAll = async () => {
    setIsSubmitting(true);
    try {
      for (const item of items) {
        // 1. 취소 문자인 경우 (SPEC 6장 5번)
        if (item.isCancellation) {
          const matchExisting = subscriptions.find(
            s => s.serviceName.trim().toLowerCase() === item.serviceName.trim().toLowerCase()
          );
          if (matchExisting) {
            // 기존 구독을 해지(canceled) 상태로 업데이트
            await updateSubscription(matchExisting.id, {
              status: 'canceled'
            });
          }
          continue;
        }

        // 2. 이미 존재하는 구독인 경우 (A4: 중복 합치기)
        const matchExisting = subscriptions.find(
          s => s.serviceName.trim().toLowerCase() === item.serviceName.trim().toLowerCase()
        );

        if (matchExisting) {
          await updateSubscription(matchExisting.id, {
            amount: item.amount,
            billingCycle: item.billingCycle,
            nextBillingDate: item.nextBillingDate,
            planName: item.planName || matchExisting.planName,
            category: item.category
          });
        } else {
          // 3. 신규 구독 등록
          await addSubscription({
            serviceName: item.serviceName,
            planName: item.planName,
            category: item.category,
            amount: item.amount,
            currency: item.currency,
            billingCycle: item.billingCycle,
            nextBillingDate: item.nextBillingDate,
            isFreeTrial: item.isFreeTrial,
            trialEndDate: item.trialEndDate,
            postTrialAmount: item.postTrialAmount,
            registrationMethod: source === 'sms' ? 'sms' : (source === 'capture' ? 'capture' : 'manual'),
            status: 'active'
          });
        }
      }

      navigate('/subscriptions', { replace: true });
    } catch (e) {
      alert('저장 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">추출 결과 확인 (S04)</h1>
          <p className="text-xs text-slate-400">
            총 {items.length}건이 감지되었습니다. 내용을 확인하고 일괄 등록하세요.
          </p>
        </div>
      </div>

      {/* 목록 형태의 등록 후보 리스트 */}
      <div className="space-y-4">
        {items.map((item, index) => {
          const isLowConfidence = item.confidence < 0.8;
          const isExisting = subscriptions.some(
            s => s.serviceName.trim().toLowerCase() === item.serviceName.trim().toLowerCase()
          );

          return (
            <div
              key={index}
              className={`bg-white rounded-2xl border p-4 shadow-sm transition relative ${
                item.isCancellation
                  ? 'border-rose-200 bg-rose-50/20'
                  : isLowConfidence
                  ? 'border-amber-400 ring-2 ring-amber-100'
                  : 'border-slate-100'
              }`}
            >
              {/* 상단 배지 영역 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  {item.isCancellation ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center space-x-1">
                      <XCircle className="w-3 h-3" />
                      <span>결제 취소 건</span>
                    </span>
                  ) : isLowConfidence ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>확인 및 수정 필요</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      인식 완료 (확신도 {Math.round(item.confidence * 100)}%)
                    </span>
                  )}

                  {isExisting && !item.isCancellation && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      기존 구독 갱신
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                    title="직접 수정"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="제외"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 편집 모드 */}
              {editingIndex === index ? (
                <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">서비스명</label>
                    <input
                      type="text"
                      value={item.serviceName}
                      onChange={e => handleUpdateItem(index, { serviceName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">금액 (원)</label>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={e => handleUpdateItem(index, { amount: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">결제 주기</label>
                      <select
                        value={item.billingCycle}
                        onChange={e => handleUpdateItem(index, { billingCycle: e.target.value as BillingCycle })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                      >
                        <option value="monthly">매월</option>
                        <option value="yearly">매년</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">결제일</label>
                    <input
                      type="date"
                      value={item.nextBillingDate}
                      onChange={e => handleUpdateItem(index, { nextBillingDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold"
                  >
                    수정 완료
                  </button>
                </div>
              ) : (
                /* 카드 내용 보기 모드 */
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-bold text-slate-800">{item.serviceName}</span>
                      {item.isFreeTrial && (
                        <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">
                          무료체험
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.isFreeTrial ? `종료일: ${item.trialEndDate}` : `다음 결제: ${item.nextBillingDate}`}
                      {item.planName && ` · ${item.planName}`}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {item.isCancellation ? `-${formatCurrency(item.amount)}` : formatCurrency(item.amount)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {item.billingCycle === 'monthly' ? '매월' : '매년'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 일괄 확정 버튼 */}
      <div className="pt-2 space-y-2">
        <button
          onClick={handleConfirmAll}
          disabled={isSubmitting}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 transition active:scale-[0.99]"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm">{isSubmitting ? '저장 중...' : `${items.length}건 전체 확정하고 등록하기`}</span>
        </button>

        <button
          onClick={() => navigate('/register')}
          className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600"
        >
          취소하고 다시 등록하기
        </button>
      </div>
    </div>
  );
};
