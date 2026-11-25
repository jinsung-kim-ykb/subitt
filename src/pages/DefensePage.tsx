import React, { useState, useMemo } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { usePlanCatalog } from '../context/PlanCatalogContext';
import { calculateDefenseOpportunities } from '../lib/calculations/defense';
import { formatKRW } from '../lib/calculations';
import { useNavigate } from 'react-router-dom';
import {
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  EyeOff,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react';

export const DefensePage: React.FC = () => {
  const { subscriptions } = useSubscriptions();
  const { planCatalog, bundleRules, catalogAgeLimitDays } = usePlanCatalog();
  const navigate = useNavigate();

  // "해당 없음" 처리한 제안 ID 목록 (로컬 상태 및 필요 시 DB 연동)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('subit_dismissed_recommendations');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const handleDismiss = (recId: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(recId);
      localStorage.setItem('subit_dismissed_recommendations', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleResetDismissed = () => {
    setDismissedIds(new Set());
    localStorage.removeItem('subit_dismissed_recommendations');
  };

  // 단일 계산 원천 함수 호출 (홈 화면과 완전히 동일한 옵션)
  const defenseSummary = useMemo(() => {
    return calculateDefenseOpportunities(
      subscriptions,
      planCatalog,
      bundleRules,
      {
        dismissedRecommendationIds: dismissedIds,
        maxCatalogAgeDays: catalogAgeLimitDays,
      }
    );
  }, [subscriptions, planCatalog, bundleRules, dismissedIds, catalogAgeLimitDays]);

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-800">
            ←
          </button>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-600" />
            구독료 줄이기
          </h1>
        </div>
        {dismissedIds.size > 0 && (
          <button
            onClick={handleResetDismissed}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            숨긴 제안 초기화 ({dismissedIds.size})
          </button>
        )}
      </div>

      {/* 절감 요약 카드 (홈 화면과 100% 일치) */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-md">
        <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-medium">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>발견된 매월 절감 기회</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight">
            {formatKRW(defenseSummary.totalMonthlySavings)}
          </span>
          <span className="text-xs text-emerald-200">원 / 월 절약 가능</span>
        </div>
        <p className="text-xs text-emerald-200 mt-1">
          연간으로 환산 시 약 {formatKRW(defenseSummary.totalMonthlySavings * 12)}원을 지킬 수 있습니다.
        </p>
      </section>

      {/* 중복 구독 경고 배너 (규칙 2) */}
      {defenseSummary.duplicateWarnings.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            중복 지출 의심 구독 발견
          </h2>
          {defenseSummary.duplicateWarnings.map((warn, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1"
            >
              <p className="font-bold text-amber-900">
                [{warn.category}] 서비스가 2개 이상 구독 중입니다.
              </p>
              <p className="text-amber-800">
                구독 중: <b>{warn.services.join(', ')}</b> (월 합계 {formatKRW(warn.monthlyTotal)}원)
              </p>
              <p className="text-[11px] text-amber-700">
                비슷한 서비스를 동시에 결제 중인지 확인하고 한쪽을 일시정지하거나 번갈아 이용해보세요.
              </p>
            </div>
          ))}
        </section>
      )}

      {/* 맞춤형 절감 제안 목록 (규칙 1, 3, 4, 5) */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-600" />
          서비스별 최적 절감 제안 ({defenseSummary.recommendations.length}건)
        </h2>

        {defenseSummary.recommendations.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <p className="text-sm font-semibold text-slate-600">현재 구독은 매우 효율적입니다!</p>
            <p className="text-xs text-slate-400">
              새로운 통신사 제휴 할인이나 광고형 요금제가 출시되면 즉시 알려드립니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {defenseSummary.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 hover:border-emerald-300 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{rec.serviceName}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                        {rec.type === 'plan_downgrade'
                          ? '요금제 전환'
                          : rec.type === 'bundle'
                          ? '결합/제휴 할인'
                          : '연간 전환'}
                      </span>
                      {rec.isExample && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded">
                          예시 데이터
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{rec.title}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-600">
                      -{formatKRW(rec.monthlySavings)}원
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ 월 절감</span>
                  </div>
                </div>

                {/* 요금 비교 박스 */}
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div className="text-slate-500">
                    <p className="text-[10px] text-slate-400">현재 플랜</p>
                    <p className="font-semibold">{formatKRW(rec.currentAmount)}원</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="text-emerald-700 text-right">
                    <p className="text-[10px] text-emerald-600 font-medium">{rec.recommendedPlan}</p>
                    <p className="font-bold">{formatKRW(rec.recommendedAmount)}원</p>
                  </div>
                </div>

                {/* 조건 및 갱신일 */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[200px]">
                    {rec.condition ? `조건: ${rec.condition}` : '특이 조건 없음'}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3" />
                    {new Date(rec.catalogUpdatedAt).toLocaleDateString('ko-KR')} 갱신
                  </span>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  {rec.actionUrl && (
                    <a
                      href={rec.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                    >
                      변경 경로 열기 <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDismiss(rec.id)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg flex items-center gap-1"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> 해당 없음
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
