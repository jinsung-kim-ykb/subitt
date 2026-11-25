import React, { useMemo } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useNotifications } from '../context/NotificationContext';
import { usePlanCatalog } from '../context/PlanCatalogContext';
import { useParty } from '../context/PartyContext';
import { calculateTotals, convertToItemUnits, formatKRW } from '../lib/calculations';
import { calculateDefenseOpportunities } from '../lib/calculations/defense';
import { PaymentCalendar } from '../components/calendar/PaymentCalendar';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { subscriptions, loading } = useSubscriptions();
  const { unreadCount } = useNotifications();
  const { planCatalog, bundleRules, catalogAgeLimitDays } = usePlanCatalog();
  const { parties } = useParty();
  const navigate = useNavigate();

  // 1. 기본 지출 요약
  const totals = calculateTotals(subscriptions);
  const itemUnits = convertToItemUnits(totals.monthlyTotalKRW);

  // 2. 단일 계산 원천: 구독료 절감 기회 계산 (D6, SPEC 7장)
  // 관리 화면에서 수정한 요금표와 설정이 실시간으로 여기에 100% 동일하게 반영됨
  const defenseSummary = useMemo(() => {
    return calculateDefenseOpportunities(
      subscriptions,
      planCatalog,
      bundleRules,
      { maxCatalogAgeDays: catalogAgeLimitDays }
    );
  }, [subscriptions, planCatalog, bundleRules, catalogAgeLimitDays]);

  if (loading) {
    return <div className="p-6 text-center text-slate-400">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {/* 최상단 헤더 */}
      <header className="flex justify-between items-center py-2">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">SUBIT</h1>
        <div className="flex items-center gap-2">
          {/* 알림함 아이콘 (C6) */}
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 text-slate-600 hover:text-slate-900 relative rounded-full hover:bg-slate-100"
            aria-label="알림함"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            + 추가
          </button>
        </div>
      </header>

      {/* D6: 홈 화면 최상단 절감액 합계 배너 (구독료 방어 제안과 100% 일치) */}
      {defenseSummary.totalMonthlySavings > 0 && (
        <section
          onClick={() => navigate('/defense')}
          className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md cursor-pointer hover:opacity-95 transition flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>구독료 줄이기 기회 발견!</span>
            </div>
            <p className="text-lg font-black tracking-tight">
              매월 {formatKRW(defenseSummary.totalMonthlySavings)}원 줄일 수 있어요
            </p>
            <p className="text-[11px] text-emerald-100">
              {defenseSummary.opportunitiesCount}개의 맞춤 요금제 및 결합 할인 확인하기
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-200 shrink-0" />
        </section>
      )}

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

      {/* 결제 캘린더 (달력 뷰 & D-Day 알림) */}
      <PaymentCalendar subscriptions={subscriptions} />

      {/* 5단계: 파티 정산 바로가기 배너 */}
      <section
        onClick={() => navigate('/party')}
        className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between cursor-pointer hover:border-blue-300 transition shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg shadow-sm">
            👥
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">친구와 함께 쓰는 구독 파티 정산</p>
            <p className="text-[11px] text-slate-500">
              {parties.length > 0
                ? `${parties.length}개 파티 정산 진행 중 • 정산 현황 확인`
                : '1/N 똑같이 나누고 링크 하나로 정산 요청'}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-blue-600">관리 →</span>
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
                        {sub.isFreeTrial
                          ? '무료체험 중'
                          : `매월 ${sub.billingDay || (sub.nextBillingDate ? parseInt(sub.nextBillingDate.split('-')[2], 10) : 1) || 1}일 결제`}
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
