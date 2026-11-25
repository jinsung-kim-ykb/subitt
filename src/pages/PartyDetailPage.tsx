import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useParty } from '../context/PartyContext';
import {
  generateSettlementMessage,
  generateReminderMessage,
  getPartySettlementStatus,
} from '../lib/party/partyCalculator';

export const PartyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { parties, toggleMemberPaid, deleteParty, triggerUnpaidNotification } = useParty();

  const [copyToast, setCopyToast] = useState<string | null>(null);

  const party = parties.find((p) => p.id === id);

  if (!party) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-slate-500">파티 정보를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/party')}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs"
        >
          파티 목록으로 돌아가기
        </button>
      </div>
    );
  }

  const status = getPartySettlementStatus(party);
  const inviteUrl = `${window.location.origin}/party/invite/${party.inviteToken}`;

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 2500);
  };

  // E3. 정산 요청 메시지 복사
  const handleCopySettlementMessage = async () => {
    const text = generateSettlementMessage(party, undefined, window.location.origin);
    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 정산 요청 메시지가 복사되었습니다!');
    } catch {
      showToast('복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  };

  // E2. 초대 링크 복사
  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast('🔗 비회원 초대 링크가 복사되었습니다!');
    } catch {
      showToast('링크 복사에 실패했습니다.');
    }
  };

  // E5. 미납 알림 및 재요청 메시지 복사
  const handleTriggerUnpaid = async () => {
    const res = triggerUnpaidNotification(party.id);
    if (res.unpaidCount > 0) {
      await navigator.clipboard.writeText(res.message);
      showToast(`🚨 미납자 ${res.unpaidCount}명 알림 생성 및 재요청 메시지 복사 완료!`);
    } else {
      showToast(res.message);
    }
  };

  const handleShare = async () => {
    const text = generateSettlementMessage(party, undefined, window.location.origin);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[SUBIT] ${party.serviceName} 파티 정산`,
          text: text,
          url: inviteUrl,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopySettlementMessage();
    }
  };

  const handleDelete = () => {
    if (confirm('이 파티를 정말 삭제하시겠습니까?')) {
      deleteParty(party.id);
      navigate('/party');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 토스트 알림 */}
      {copyToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg z-50 animate-bounce">
          {copyToast}
        </div>
      )}

      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/party')}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <span>←</span> 파티 목록
        </button>
        <button
          onClick={handleDelete}
          className="text-xs text-rose-500 hover:text-rose-700"
        >
          파티 삭제
        </button>
      </div>

      {/* 파티 개요 카드 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
              {party.splitMethod === 'equal' ? '1/N 똑같이 나누기' : '직접 지정'}
            </span>
            <h1 className="text-xl font-bold text-slate-800 mt-1">{party.serviceName}</h1>
            <p className="text-xs text-slate-500">
              총 {party.totalAmount.toLocaleString()}원 • 매월 {party.billingDay}일 결제/정산
            </p>
          </div>
          {status.isFullyPaid ? (
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
              완납 🎉
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
              {status.unpaidCount}명 대기
            </span>
          )}
        </div>

        {party.paymentAccountInfo && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">🏦 송금처: </span>
            {party.paymentAccountInfo}
          </div>
        )}

        {/* 액션 버튼 그룹 (E2, E3, E5) */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <button
            onClick={handleCopySettlementMessage}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>📋</span> 정산 메시지 복사
          </button>
          <button
            onClick={handleCopyInviteLink}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <span>🔗</span> 초대 링크 복사
          </button>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={handleShare}
            className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-xl flex items-center justify-center gap-1"
          >
            <span>📲</span> 카카오톡/문자 공유
          </button>
          {status.unpaidCount > 0 && (
            <button
              onClick={handleTriggerUnpaid}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm"
            >
              <span>🚨</span> 미납 재요청 알림
            </button>
          )}
        </div>
      </div>

      {/* 멤버별 납부 관리 섹션 (E4) */}
      <div className="space-y-2">
        <h2 className="font-bold text-sm text-slate-800 flex items-center justify-between">
          <span>멤버별 납부 현황 (E4)</span>
          <span className="text-xs font-normal text-slate-500">
            완료 {status.paidCount + 1} / 전체 {party.members.length}명
          </span>
        </h2>

        <div className="space-y-2">
          {party.members.map((member) => (
            <div
              key={member.id}
              className={`bg-white border rounded-xl p-3 flex items-center justify-between shadow-sm transition-all ${
                member.isPaid ? 'border-slate-200' : 'border-amber-300 bg-amber-50/20'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-800">{member.name}</span>
                  {member.isHost && (
                    <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                      파티장
                    </span>
                  )}
                  {member.isPaid ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0.5 rounded font-bold">
                      납부완료
                    </span>
                  ) : (
                    <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] px-1.5 py-0.5 rounded font-bold">
                      미납
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  분담액: <strong className="text-slate-800">{member.allocatedAmount.toLocaleString()}원</strong>
                  {member.paidAt && (
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({new Date(member.paidAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} 납부)
                    </span>
                  )}
                </p>
              </div>

              {/* 납부 토글 버튼 (E4) */}
              <div className="flex items-center gap-1.5">
                {!member.isHost && !member.isPaid && (
                  <button
                    onClick={async () => {
                      const msg = generateReminderMessage(party, member, window.location.origin);
                      await navigator.clipboard.writeText(msg);
                      showToast(`${member.name}님 재요청 메시지 복사 완료!`);
                    }}
                    className="text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg border border-slate-200"
                  >
                    재요청
                  </button>
                )}
                <button
                  onClick={() => toggleMemberPaid(party.id, member.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    member.isPaid
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                  }`}
                >
                  {member.isPaid ? '납부 취소' : '납부 확인'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 비회원 초대 링크 안내 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1.5">
        <p className="font-semibold text-slate-700">💡 비회원 초대 링크 작동 방식 (E2, S09)</p>
        <p className="text-[11px] leading-relaxed">
          초대받은 멤버는 <strong>로그인 없이도</strong> 자신의 분담액과 계좌번호를 확인하고 직접 &apos;송금 완료&apos;를
          체크할 수 있습니다. 파티장의 다른 개인정보나 구독 내역은 일절 노출되지 않습니다.
        </p>
      </div>
    </div>
  );
};
