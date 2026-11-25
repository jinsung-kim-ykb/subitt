import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlanCatalog } from '../context/PlanCatalogContext';
import { useNotifications } from '../context/NotificationContext';
import { PlanCatalogItem, BundleRule, Category, BillingCycle } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  Sliders,
  Check,
  X,
} from 'lucide-react';
import { formatKRW } from '../lib/calculations';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const {
    planCatalog,
    bundleRules,
    addPlanItem,
    updatePlanItem,
    deletePlanItem,
    catalogAgeLimitDays,
    setCatalogAgeLimitDays,
  } = usePlanCatalog();
  const { refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  // 테스트를 위해 관리자 권한 상태를 토글할 수 있게 함 (H1 권한 검증용)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return localStorage.getItem('subit_test_admin_mode') !== 'false';
  });

  const toggleAdminMode = () => {
    const next = !isAdminMode;
    setIsAdminMode(next);
    localStorage.setItem('subit_test_admin_mode', next.toString());
  };

  const [activeTab, setActiveTab] = useState<'plans' | 'bundles' | 'settings'>('plans');

  // 신규 요금제 추가 폼 상태
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('영상');
  const [newAmount, setNewAmount] = useState<number>(10000);
  const [newCycle, setNewCycle] = useState<BillingCycle>('monthly');
  const [newFeatures, setNewFeatures] = useState('');

  // 간편 등록: 디즈니플러스 세트 자동 채우기
  const handlePrefillDisney = () => {
    setNewServiceName('디즈니플러스');
    setNewPlanName('광고형 스탠다드');
    setNewCategory('영상');
    setNewAmount(7000);
    setNewCycle('monthly');
    setNewFeatures('광고 포함, 동시접속 2인');
    setIsAddingPlan(true);
  };

  const handleSaveNewPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newPlanName || !newAmount) return;

    await addPlanItem({
      serviceId: newServiceName.toLowerCase().replace(/\s+/g, '-'),
      serviceName: newServiceName,
      planName: newPlanName,
      category: newCategory,
      amount: Number(newAmount),
      currency: 'KRW',
      billingCycle: newCycle,
      features: newFeatures,
      isExample: false,
    });

    setIsAddingPlan(false);
    setNewServiceName('');
    setNewPlanName('');
    setNewAmount(10000);
    setNewFeatures('');
    alert(`[등록 완료] ${newServiceName} (${newPlanName} - ${formatKRW(newAmount)}원) 요금제가 등록되었습니다.\n이제 홈 화면과 줄이기 화면에 즉시 반영됩니다!`);
  };

  // 요금 인상 (C3: 요금표 금액이 오르면 해당 사용자에게 알림 생성)
  const handleIncreasePrice = async (plan: PlanCatalogItem) => {
    const input = prompt(
      `[요금 인상 테스트 (C3)]\n${plan.serviceName} (${plan.planName})의 인상 후 금액을 입력하세요:`,
      (plan.amount + 1000).toString()
    );
    if (!input || isNaN(Number(input))) return;

    const newAmount = Number(input);
    await updatePlanItem(plan.id, { amount: newAmount });
    alert(`[요금 인상 알림 생성]\n${plan.serviceName} 요금이 ${formatKRW(plan.amount)}원 → ${formatKRW(newAmount)}원으로 인상되었습니다.\n사용자 알림함에 인상 알림(C3)이 발송되었습니다.`);
  };

  // 비운영자 차단 뷰 (H1 요구사항)
  if (!isAdminMode) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
          403
        </div>
        <h2 className="text-lg font-black text-slate-800">운영자 전용 페이지입니다</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          운영자(Admin) 권한이 없는 계정은 요금표 및 결합 규칙 관리 화면에 접근할 수 없습니다 (SPEC H1).
        </p>

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <button
            onClick={toggleAdminMode}
            className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm"
          >
            운영자 모드로 전환하기 (테스트용)
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            운영자 관리 화면 (H1)
          </h1>
        </div>
        <button
          onClick={toggleAdminMode}
          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] rounded-lg font-medium"
        >
          권한 끄기 (403 테스트)
        </button>
      </div>

      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 space-y-1">
        <p className="font-bold">💡 실시간 동기화 안내</p>
        <p>
          여기서 요금을 추가하거나 수정하면 <b>갱신일이 자동 기록</b>되며, 사용자 계정의 <b>홈 화면 최상단 배너 및 줄이기 화면에 실시간으로 즉시 반영</b>됩니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'plans' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          요금표 ({planCatalog.length})
        </button>
        <button
          onClick={() => setActiveTab('bundles')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'bundles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          결합 규칙 ({bundleRules.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          방어 설정
        </button>
      </div>

      {activeTab === 'plans' && (
        <div className="space-y-3">
          {/* 상단 버튼들 */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddingPlan(true)}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> 새 요금제 등록
            </button>
            <button
              onClick={handlePrefillDisney}
              className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200"
            >
              디즈니 7,000원 채우기
            </button>
          </div>

          {/* 요금제 등록 모달/인라인 폼 */}
          {isAddingPlan && (
            <form
              onSubmit={handleSaveNewPlan}
              className="p-4 bg-white border-2 border-indigo-500 rounded-2xl shadow-lg space-y-3 animate-in fade-in"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">요금표 항목 추가</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingPlan(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-500 font-medium block mb-1">서비스명</label>
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="예: 디즈니플러스"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-medium block mb-1">플랜명</label>
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="예: 광고형 스탠다드"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-500 font-medium block mb-1">월/연 금액(원)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-medium block mb-1">카테고리</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="영상">영상</option>
                    <option value="음악">음악</option>
                    <option value="쇼핑 멤버십">쇼핑 멤버십</option>
                    <option value="AI">AI</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-medium text-xs block mb-1">특징 및 조건</label>
                <input
                  type="text"
                  value={newFeatures}
                  onChange={(e) => setNewFeatures(e.target.value)}
                  placeholder="예: 시간당 광고 4분, 동시접속 2인"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow hover:bg-indigo-700"
              >
                저장하기
              </button>
            </form>
          )}

          {/* 목록 */}
          <div className="space-y-2.5">
            {planCatalog.map((plan) => (
              <div
                key={plan.id}
                className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{plan.serviceName}</span>
                      <span className="text-xs text-indigo-600 font-medium">{plan.planName}</span>
                      {plan.isExample && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] rounded font-bold">
                          예시
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {plan.category} • {plan.billingCycle === 'monthly' ? '매월' : '매년'} • 갱신일:{' '}
                      {new Date(plan.updatedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatKRW(plan.amount)}원
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 text-[11px] truncate max-w-[180px]">
                    {plan.features || '특징 없음'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleIncreasePrice(plan)}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[11px] font-semibold flex items-center gap-1"
                    >
                      <TrendingUp className="w-3 h-3" /> 인상 (C3)
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`${plan.serviceName} ${plan.planName}을 삭제하시겠습니까?`)) {
                          deletePlanItem(plan.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bundles' && (
        <div className="space-y-2">
          {bundleRules.map((b) => (
            <div key={b.id} className="p-3.5 bg-white border rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-sm text-slate-800">{b.serviceName} ({b.provider})</span>
                <span className="font-extrabold text-emerald-600">{formatKRW(b.discountedAmount)}원</span>
              </div>
              <p className="text-xs text-slate-500">{b.bundleName}</p>
              <p className="text-[11px] text-slate-400">조건: {b.condition}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
            <Sliders className="w-4 h-4 text-indigo-600" />
            SPEC 7장 규칙 4: 요금표 갱신일 유효 기준일 설정
          </h3>
          <p className="text-slate-500 leading-relaxed">
            요금표의 갱신일이 이 기준 일수를 초과하면 오래된 요금 정보로 판단하여 구독료 줄이기 추천 및 합계에서 자동으로 제외됩니다.
          </p>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">기준 일수:</span>
            <input
              type="number"
              value={catalogAgeLimitDays}
              onChange={(e) => setCatalogAgeLimitDays(Number(e.target.value))}
              className="w-20 px-3 py-1.5 border rounded-lg font-bold text-indigo-600 text-sm"
              min="1"
            />
            <span className="text-slate-500 font-medium">일 (기본: 45일)</span>
          </div>
        </div>
      )}
    </div>
  );
};
