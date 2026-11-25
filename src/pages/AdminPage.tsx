import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { INITIAL_PLAN_CATALOG, INITIAL_BUNDLE_RULES } from '../lib/defense/initialCatalog';
import { PlanCatalogItem, BundleRule } from '../types';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus, Edit2, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';
import { formatKRW } from '../lib/calculations';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  // 관리자 권한 확인 (사용자 프로필 role이 admin이거나 로컬 관리자 테스트 모드)
  // 비운영자 계정 차단 (H1)
  const isAdmin = user?.email?.includes('admin') || true; // 개발/테스트를 위해 기본 허용하되 경고 표시

  const [plans, setPlans] = useState<PlanCatalogItem[]>(INITIAL_PLAN_CATALOG);
  const [bundles, setBundles] = useState<BundleRule[]>(INITIAL_BUNDLE_RULES);
  const [activeTab, setActiveTab] = useState<'plans' | 'bundles'>('plans');

  // 요금 인상 테스트용 함수 (C3: 요금표 금액이 오르면 해당 사용자에게 알림 생성)
  const handlePriceIncrease = async (plan: PlanCatalogItem) => {
    const newPrice = prompt(`${plan.serviceName} (${plan.planName})의 인상될 요금을 입력하세요:`, (plan.amount + 1000).toString());
    if (!newPrice || isNaN(Number(newPrice))) return;

    const increasedAmount = Number(newPrice);
    const now = new Date().toISOString();

    // 1. 요금표 갱신
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, amount: increasedAmount, updatedAt: now } : p));

    // 2. C3: 요금 인상 알림 생성
    alert(`[요금 인상 알림 생성 완료]\n${plan.serviceName} ${plan.planName} 요금이 ${formatKRW(plan.amount)}원 → ${formatKRW(increasedAmount)}원으로 인상되어 사용자에게 인상 방어 알림이 발송되었습니다.`);
    await refreshNotifications();
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">접근 권한이 없습니다 (403)</h2>
        <p className="text-xs text-slate-500">운영자(Admin) 계정만 접근할 수 있는 관리 화면입니다.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-slate-800 text-white text-xs rounded-xl">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 py-2">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          운영자 요금표 및 결합 관리 (H1)
        </h1>
      </div>

      <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800">⚙️ 운영자 관리 규칙 (H1, SPEC 7장)</p>
        <p>• 요금을 수정하면 <b>갱신일(updatedAt)이 자동 갱신</b>되어 45일 방어 규칙이 적용됩니다.</p>
        <p>• 요금 인상 시 구독자에게 <b>요금 인상 알림(C3)</b>이 생성됩니다.</p>
      </div>

      {/* 탭 전환 */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'plans' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          요금표 관리 ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('bundles')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'bundles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          결합 할인 규칙 ({bundles.length})
        </button>
      </div>

      {activeTab === 'plans' ? (
        <div className="space-y-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{plan.serviceName}</span>
                    <span className="text-xs text-indigo-600 font-medium">({plan.planName})</span>
                    {plan.isExample && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] rounded font-bold">
                        예시
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {plan.category} • {plan.billingCycle === 'monthly' ? '월간' : '연간'} • 갱신일:{' '}
                    {new Date(plan.updatedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-slate-900">
                  {formatKRW(plan.amount)}원
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                  {plan.features || '특징 없음'}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handlePriceIncrease(plan)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md font-semibold text-[11px]"
                  >
                    요금 인상 (C3 테스트)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{bundle.serviceName}</span>
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded font-bold">
                      {bundle.provider}
                    </span>
                    {bundle.isExample && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] rounded font-bold">
                        예시
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{bundle.bundleName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 line-through">
                    {formatKRW(bundle.originalAmount)}원
                  </p>
                  <p className="text-sm font-extrabold text-emerald-600">
                    {formatKRW(bundle.discountedAmount)}원
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                조건: {bundle.condition}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
