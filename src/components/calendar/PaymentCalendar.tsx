import React, { useState, useMemo } from 'react';
import { Subscription } from '../../types';
import { formatKRW } from '../../lib/calculations';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentCalendarProps {
  subscriptions: Subscription[];
}

// 금액 축약 표기 (예: 3400 -> 3.4천, 14000 -> 1.4만)
function formatShortAmount(amount: number): string {
  if (amount >= 10000) {
    const val = amount / 10000;
    return `${val % 1 === 0 ? val : val.toFixed(1)}만`;
  }
  if (amount >= 1000) {
    const val = amount / 1000;
    return `${val % 1 === 0 ? val : val.toFixed(1)}천`;
  }
  return `${amount}`;
}

export const PaymentCalendar: React.FC<PaymentCalendarProps> = ({ subscriptions }) => {
  const navigate = useNavigate();
  const today = new Date();
  
  // 현재 보고 있는 년/월 상태
  const [currentDate, setCurrentDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // 이전 달 / 다음 달 이동
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  const handleResetToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today.getDate());
  };

  // 활성 구독 중 이번 달 결제 대상 필터링 및 날짜별 매핑
  const activeSubs = useMemo(() => {
    return subscriptions.filter(s => s.status === 'active');
  }, [subscriptions]);

  // 각 일자(1~31)별 결제 구독 목록 계산
  const paymentsByDay = useMemo(() => {
    const map = new Map<number, Subscription[]>();
    activeSubs.forEach(sub => {
      let day = sub.billingDay;
      if (!day && sub.nextBillingDate) {
        const d = new Date(sub.nextBillingDate);
        if (!isNaN(d.getTime())) {
          day = d.getDate();
        }
      }
      if (!day) day = 1;

      const existing = map.get(day) || [];
      existing.push(sub);
      map.set(day, existing);
    });
    return map;
  }, [activeSubs]);

  // 이번 달 결제 예정 건수 및 총 결제 예정액
  const { totalCount, totalAmount } = useMemo(() => {
    let count = 0;
    let sum = 0;
    paymentsByDay.forEach(subs => {
      count += subs.length;
      subs.forEach(sub => {
        const amt = sub.currency === 'USD' ? Math.round(sub.amount * 1380) : sub.amount;
        sum += amt;
      });
    });
    return { totalCount: count, totalAmount: sum };
  }, [paymentsByDay]);

  // 달력 날짜 그리드 생성 (일~토)
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0(일) ~ 6(토)
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      day: number;
      isCurrentMonth: boolean;
      dateObj: Date;
    }> = [];

    // 1. 이전 달 날짜 채우기
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      cells.push({
        day: prevDay,
        isCurrentMonth: false,
        dateObj: new Date(currentYear, currentMonth - 1, prevDay)
      });
    }

    // 2. 이번 달 날짜 채우기
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({
        day: d,
        isCurrentMonth: true,
        dateObj: new Date(currentYear, currentMonth, d)
      });
    }

    // 3. 다음 달 날짜 채우기 (42칸 6주 맞춤)
    const remaining = 42 - cells.length;
    for (let nextDay = 1; nextDay <= (remaining < 7 ? remaining : remaining - 7); nextDay++) {
      cells.push({
        day: nextDay,
        isCurrentMonth: false,
        dateObj: new Date(currentYear, currentMonth + 1, nextDay)
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // 선택된 날짜의 구독 목록
  const selectedSubs = selectedDay ? paymentsByDay.get(selectedDay) || [] : [];

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
      {/* 캘린더 상단 헤더 (제목 + 월 이동) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-black text-slate-800">
            {currentMonth + 1}월 결제 캘린더
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl px-1.5 py-1 text-slate-600 text-xs font-semibold shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:text-slate-900 hover:bg-white rounded-md transition"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-1.5 text-xs text-slate-700 font-bold min-w-[76px] text-center">
            {currentYear}년 {currentMonth + 1}월
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:text-slate-900 hover:bg-white rounded-md transition"
            aria-label="다음 달"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />
          <button
            onClick={handleResetToday}
            title="오늘로 이동"
            className="p-1 hover:text-indigo-600 hover:bg-white rounded-md transition text-slate-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 서브 문구: 이번 달 결제 예정 N건 (총 NNN원) */}
      <p className="text-xs text-slate-500 font-medium">
        이번 달 결제 예정{' '}
        <span className="font-bold text-indigo-600">{totalCount}건</span>{' '}
        <span className="text-slate-400 font-normal">
          (총 {formatKRW(totalAmount)}원)
        </span>
      </p>

      {/* 요일 헤더 (일 ~ 토) */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 pt-1 pb-1 border-b border-slate-50">
        <div className="text-rose-400">일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div className="text-blue-500">토</div>
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {calendarCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={`other-${idx}`}
                className="h-14 flex flex-col items-center justify-start pt-1 text-slate-300 text-xs select-none"
              >
                <span>{cell.day}</span>
              </div>
            );
          }

          const daySubs = paymentsByDay.get(cell.day) || [];
          const hasPayments = daySubs.length > 0;
          const dayTotal = daySubs.reduce((acc, s) => {
            return acc + (s.currency === 'USD' ? Math.round(s.amount * 1380) : s.amount);
          }, 0);

          // D-Day 및 오늘 여부 판별
          const isCurrentYearMonth =
            currentYear === today.getFullYear() && currentMonth === today.getMonth();
          const isToday = isCurrentYearMonth && cell.day === today.getDate();
          const daysDiff = cell.day - today.getDate();
          const isUpcomingUrgent = isCurrentYearMonth && daysDiff > 0 && daysDiff <= 3;

          const isSelected = selectedDay === cell.day;

          // 배경 스타일 결정
          let badgeStyle = 'text-slate-700 hover:bg-slate-50';
          let dotColor = 'bg-slate-300';
          let subText = hasPayments ? formatShortAmount(dayTotal) : '';
          let subTextColor = 'text-slate-500 font-bold';

          if (hasPayments) {
            if (isUpcomingUrgent || isToday) {
              // 결제 임박 (D-Day / D-1 ~ D-3) -> 연핑크/레드
              badgeStyle = 'bg-rose-50 border border-rose-200 text-rose-700 shadow-2xs';
              dotColor = 'bg-rose-500';
              subText = isToday ? '오늘' : `D-${daysDiff}`;
              subTextColor = 'text-rose-600 font-black';
            } else if (cell.day % 3 === 0) {
              // 연초록
              badgeStyle = 'bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs';
              dotColor = 'bg-emerald-500';
              subTextColor = 'text-emerald-700 font-bold';
            } else {
              // 연파랑/인디고
              badgeStyle = 'bg-indigo-50/80 border border-indigo-100 text-indigo-900 shadow-2xs';
              dotColor = 'bg-indigo-500';
              subTextColor = 'text-indigo-600 font-bold';
            }
          }

          if (isSelected) {
            badgeStyle = 'ring-2 ring-indigo-600 ' + badgeStyle;
          }

          return (
            <button
              key={`day-${cell.day}`}
              type="button"
              onClick={() => setSelectedDay(isSelected ? null : cell.day)}
              className={`h-14 rounded-2xl flex flex-col items-center justify-between py-1 transition cursor-pointer ${
                hasPayments ? badgeStyle : 'hover:bg-slate-50'
              }`}
            >
              {/* 날짜 숫자 */}
              <span className={`text-xs font-semibold ${isToday ? 'text-indigo-600 font-black' : ''}`}>
                {cell.day}
              </span>

              {/* 결제 표시 점 */}
              {hasPayments && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              )}

              {/* 금액 또는 D-Day 텍스트 */}
              {hasPayments ? (
                <span className={`text-[10px] leading-tight tracking-tighter ${subTextColor}`}>
                  {subText}
                </span>
              ) : (
                <span className="h-3" />
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 날짜 상세 바텀 카드 */}
      {selectedDay && (
        <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">
              📅 {currentMonth + 1}월 {selectedDay}일 결제 예정
            </span>
            <span className="text-slate-400">
              총 {selectedSubs.length}건
            </span>
          </div>

          {selectedSubs.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 text-center bg-slate-50 rounded-xl">
              이 날 결제 예정인 구독이 없습니다.
            </p>
          ) : (
            <div className="space-y-1.5">
              {selectedSubs.map(sub => {
                const subAmount = sub.currency === 'USD' ? Math.round(sub.amount * 1380) : sub.amount;
                return (
                  <div
                    key={sub.id}
                    onClick={() => navigate(`/detail/${sub.id}`)}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">
                        {sub.category === '영상' ? '🎬' : sub.category === '음악' ? '🎵' : sub.category === 'AI' ? '🤖' : '📦'}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{sub.serviceName}</p>
                        <p className="text-[11px] text-slate-400">
                          {sub.planName || '기본 요금제'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">
                        {formatKRW(subAmount)}원
                      </p>
                      <span className="text-[10px] text-indigo-600 font-medium">상세보기 →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
