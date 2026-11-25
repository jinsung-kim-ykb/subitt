import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParty } from '../context/PartyContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { SplitMethod } from '../types';
import { calculatePartySplit, getPartySettlementStatus } from '../lib/party/partyCalculator';

export const PartyListPage: React.FC = () => {
  const navigate = useNavigate();
  const { parties, createParty } = useParty();
  const { subscriptions } = useSubscriptions();
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [totalAmount, setTotalAmount] = useState(17000);
  const [billingDay, setBillingDay] = useState(15);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [paymentAccountInfo, setPaymentAccountInfo] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>(['김철수', '이영희']);
  const [customAmounts, setCustomAmounts] = useState<number[]>([5000, 5000]);

  // 구독 선택 시 자동 입력
  const handleSelectSubscription = (subId: string) => {
    setSelectedSubId(subId);
    const sub = subscriptions.find((s) => s.id === subId);
    if (sub) {
      setServiceName(sub.serviceName);
      setTotalAmount(sub.amount);
      setBillingDay(sub.billingDay || 1);
    }
  };

  const handleAddMember = () => {
    setMemberNames([...memberNames, `멤버 ${memberNames.length + 1}`]);
    setCustomAmounts([...customAmounts, 0]);
  };

  const handleRemoveMember = (idx: number) => {
    if (memberNames.length <= 1) return;
    setMemberNames(memberNames.filter((_, i) => i !== idx));
    setCustomAmounts(customAmounts.filter((_, i) => i !== idx));
  };

  // 실시간 분담금 계산 미리보기
  const allMembers = [
    { name: '나 (파티장)', isHost: true },
    ...memberNames.map((name) => ({ name, isHost: false })),
  ];

  const previewSplit = calculatePartySplit(
    totalAmount,
    allMembers,
    splitMethod,
    splitMethod === 'custom' ? [totalAmount - customAmounts.reduce((a, b) => a + b, 0), ...customAmounts] : undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || totalAmount <= 0) {
      alert('서비스명과 금액을 올바르게 입력해주세요.');
      return;
    }

    const membersPayload = [
      { name: '나 (파티장)', isHost: true },
      ...memberNames.map((name, idx) => ({
        name,
        isHost: false,
        customAmount: splitMethod === 'custom' ? customAmounts[idx] : undefined,
      })),
    ];

    const newParty = createParty({
      userId: user?.id || 'mock-user-1',
      subscriptionId: selectedSubId || 'custom-sub',
      serviceName,
      totalAmount,
      billingDay,
      splitMethod,
      paymentAccountInfo,
      members: membersPayload,
    });

    setIsModalOpen(false);
    navigate(`/party/${newParty.id}`);
  };

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">👥 파티 정산 (S08)</h1>
          <p className="text-xs text-slate-500 mt-1">친구, 지인과 함께 쓰는 구독료를 투명하게 정산하세요.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs px-3 py-2 rounded-lg shadow-sm"
        >
          + 파티 만들기
        </button>
      </div>

      {/* 보안 및 주의 안내 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
        <p className="font-semibold flex items-center gap-1">
          <span>🔒</span> 안전한 정산 원칙
        </p>
        <p className="text-slate-600">
          • 계정 비밀번호 공유나 모르는 사람과의 파티 매칭을 일절 지원하지 않습니다.<br />
          • 송금은 각자의 금융 앱(카카오페이, 토스, 은행)에서 직접 진행됩니다.
        </p>
      </div>

      {/* 파티 목록 */}
      {parties.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-3">
          <span className="text-4xl block">🤝</span>
          <p className="text-sm font-medium text-slate-600">등록된 파티가 없습니다.</p>
          <p className="text-xs text-slate-400">넷플릭스, 디즈니+ 등 함께 결제하는 파티를 만들어보세요!</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 bg-brand-600 text-white text-xs px-4 py-2 rounded-lg font-medium"
          >
            첫 파티 만들기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {parties.map((party) => {
            const status = getPartySettlementStatus(party);
            return (
              <div
                key={party.id}
                onClick={() => navigate(`/party/${party.id}`)}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-brand-300 cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{party.serviceName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      총 {party.totalAmount.toLocaleString()}원 • 매월 {party.billingDay}일 결제
                    </p>
                  </div>
                  {status.isFullyPaid ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold">
                      전원 납부 완료 🎉
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-semibold">
                      {status.unpaidCount}명 미납
                    </span>
                  )}
                </div>

                {/* 멤버별 납부 상태 요약 뱃지 */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {party.members.map((m) => (
                    <span
                      key={m.id}
                      className={`text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        m.isPaid
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-rose-50 text-rose-600 font-medium border border-rose-200'
                      }`}
                    >
                      <span>{m.isPaid ? '✓' : '⏳'}</span>
                      <span>{m.name}</span>
                      <span className="text-slate-400">({m.allocatedAmount.toLocaleString()}원)</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 새 파티 만들기 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-[400px] rounded-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-base text-slate-800">✨ 새 파티 만들기 (E1)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* 내 구독에서 선택 */}
              {subscriptions.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">내 구독에서 불러오기 (선택)</label>
                  <select
                    value={selectedSubId}
                    onChange={(e) => handleSelectSubscription(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50"
                  >
                    <option value="">-- 직접 입력 또는 선택 --</option>
                    {subscriptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.serviceName} ({s.amount.toLocaleString()}원 / 매월 {s.billingDay || 1}일)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 서비스명 및 총 금액 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">서비스명</label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="예: 넷플릭스 프리미엄"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">총 구독료 (원)</label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    required
                    step={10}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* 정산일 및 송금처 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">매월 정산 기준일</label>
                  <input
                    type="number"
                    value={billingDay}
                    min={1}
                    max={31}
                    onChange={(e) => setBillingDay(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">분담 방식</label>
                  <select
                    value={splitMethod}
                    onChange={(e) => setSplitMethod(e.target.value as SplitMethod)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50"
                  >
                    <option value="equal">1/N 똑같이 나누기</option>
                    <option value="custom">직접 금액 지정</option>
                  </select>
                </div>
              </div>

              {/* 정산 송금 계좌 / 카카오페이 링크 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">송금처 (계좌번호 또는 송금 링크)</label>
                <input
                  type="text"
                  value={paymentAccountInfo}
                  onChange={(e) => setPaymentAccountInfo(e.target.value)}
                  placeholder="예: 카카오페이 송금 링크 또는 신한 110-xxx"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* 파티원 입력 */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">함께하는 멤버 (총 {allMembers.length}명)</label>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="text-brand-600 font-semibold hover:underline"
                  >
                    + 멤버 추가
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-700">👑 나 (파티장)</span>
                    <span className="text-brand-600 font-bold">{previewSplit.hostAmount.toLocaleString()}원</span>
                  </div>

                  {memberNames.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const next = [...memberNames];
                          next[idx] = e.target.value;
                          setMemberNames(next);
                        }}
                        className="flex-1 border border-slate-300 rounded-lg p-2"
                        placeholder="멤버 이름"
                      />
                      {splitMethod === 'custom' && (
                        <input
                          type="number"
                          value={customAmounts[idx] || 0}
                          onChange={(e) => {
                            const next = [...customAmounts];
                            next[idx] = Number(e.target.value);
                            setCustomAmounts(next);
                          }}
                          className="w-24 border border-slate-300 rounded-lg p-2 text-right"
                          placeholder="금액"
                        />
                      )}
                      <span className="text-slate-600 font-medium text-[11px] w-16 text-right">
                        {previewSplit.allocations[idx + 1]?.amount.toLocaleString()}원
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* 분담금 안내 규칙 요약 */}
                {splitMethod === 'equal' && (
                  <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                    💡 <strong>자투리 처리:</strong> 멤버는 10원 단위 내림(
                    {previewSplit.memberAmount.toLocaleString()}원), 파티장이 잔여 차액(
                    {previewSplit.hostAmount.toLocaleString()}원)을 부담합니다.
                  </p>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-lg font-bold"
                >
                  파티 만들기 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
