import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useParty } from '../context/PartyContext';
import { extractPublicPartyView } from '../lib/party/partyCalculator';

export const PartyInvitePage: React.FC = () => {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const { getPartyByInviteToken, toggleMemberPaid } = useParty();

  const [toast, setToast] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const party = inviteToken ? getPartyByInviteToken(inviteToken) : undefined;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (!party) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-[400px] w-full p-6 rounded-2xl shadow text-center space-y-3">
          <span className="text-4xl block">🔍</span>
          <h1 className="text-base font-bold text-slate-800">유효하지 않은 파티 링크입니다</h1>
          <p className="text-xs text-slate-500">
            초대 링크가 만료되었거나 올바르지 않습니다. 파티장에게 새 링크를 요청해주세요.
          </p>
          <Link
            to="/"
            className="inline-block bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            SUBIT 홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  // 보안 데이터 격리 적용: 파티장의 개인 식별자나 타 구독이 없는 Public View 생성
  const publicView = extractPublicPartyView(party);

  const handleCopyAccount = async () => {
    if (!publicView.paymentAccountInfo) return;
    try {
      await navigator.clipboard.writeText(publicView.paymentAccountInfo);
      showToast('🏦 송금처 정보가 복사되었습니다!');
    } catch {
      showToast('복사에 실패했습니다.');
    }
  };

  const handleMarkSelfPaid = (memberId: string) => {
    toggleMemberPaid(party.id, memberId, true);
    showToast('🎉 송금 완료로 표시되었습니다! 파티장에게 전달됩니다.');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-brand-100 selection:text-brand-700">
      <div className="w-full max-w-[430px] min-h-screen bg-white flex flex-col shadow-lg relative p-4 space-y-4">
        {/* 토스트 메시지 */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg z-50 animate-bounce">
            {toast}
          </div>
        )}

        {/* 상단 브랜딩 헤더 */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">💳</span>
            <span className="font-extrabold text-brand-600 tracking-tight text-base">SUBIT</span>
            <span className="text-xs text-slate-400 font-medium">| 파티 정산</span>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            비회원 공개 뷰 (S09)
          </span>
        </div>

        {/* 데이터 격리 보장 배너 */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 flex items-center gap-2">
          <span>🔒</span>
          <span>안전한 파티: 본 파티의 정산 정보만 안전하게 표시됩니다.</span>
        </div>

        {/* 파티 정산 개요 카드 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="text-center py-2">
            <span className="text-xs text-brand-600 font-bold bg-brand-50 px-2.5 py-1 rounded-full">
              이번 달 구독료 분담
            </span>
            <h1 className="text-2xl font-black text-slate-800 mt-2">{publicView.serviceName}</h1>
            <p className="text-xs text-slate-500 mt-1">
              총 구독료: {publicView.totalAmount.toLocaleString()}원 • 매월 {publicView.billingDay}일 결제
            </p>
          </div>

          {/* 송금처 안내 및 원클릭 복사 */}
          {publicView.paymentAccountInfo ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">🏦 파티장 송금처</span>
                <button
                  onClick={handleCopyAccount}
                  className="text-[11px] text-brand-600 hover:text-brand-700 font-bold"
                >
                  계좌 복사
                </button>
              </div>
              <p className="text-xs text-slate-800 font-mono bg-white p-2 rounded-lg border border-slate-200 break-all select-all">
                {publicView.paymentAccountInfo}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-xl text-center">
              송금처 정보는 파티장에게 직접 문의해주세요.
            </div>
          )}
        </div>

        {/* 멤버별 분담 현황 및 본인 송금 완료 체크 (E4) */}
        <div className="space-y-2">
          <h2 className="font-bold text-sm text-slate-800 flex items-center justify-between">
            <span>파티원 납부 현황</span>
            <span className="text-xs font-normal text-slate-500">
              총 {publicView.members.length}명
            </span>
          </h2>

          <div className="space-y-2">
            {publicView.members.map((member) => (
              <div
                key={member.id}
                className={`border rounded-xl p-3 flex items-center justify-between transition-all ${
                  member.isPaid ? 'bg-slate-50 border-slate-200' : 'bg-white border-brand-200 shadow-sm'
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
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        완료 ✓
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        송금 대기
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    분담금: <strong className="text-slate-800">{member.allocatedAmount.toLocaleString()}원</strong>
                  </p>
                </div>

                {/* 멤버 본인 송금 완료 버튼 (E4) */}
                <div>
                  {!member.isHost && !member.isPaid && (
                    <button
                      onClick={() => handleMarkSelfPaid(member.id)}
                      className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      송금 완료했어요!
                    </button>
                  )}
                  {member.isPaid && (
                    <span className="text-xs text-emerald-600 font-semibold">납부 확인됨</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 내 구독도 관리하기 유도 푸터 */}
        <div className="mt-auto pt-6 text-center border-t space-y-2">
          <p className="text-xs text-slate-500">
            나도 매달 나가는 구독료를 아끼고 싶다면?
          </p>
          <Link
            to="/"
            className="block w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl transition-all"
          >
            SUBIT 시작하기 (무료)
          </Link>
        </div>
      </div>
    </div>
  );
};
