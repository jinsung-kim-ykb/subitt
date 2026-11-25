import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { subscribeToWebPush, unsubscribeWebPush } from '../lib/push';
import { AddToHomeScreenPrompt } from '../components/pwa/AddToHomeScreenPrompt';
import { Bell, Smartphone, ShieldCheck, ChevronRight, Sparkles, UserX, AlertTriangle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, signOut, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [showA2HSPrompt, setShowA2HSPrompt] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTogglePush = async () => {
    setIsPushLoading(true);
    try {
      if (!pushEnabled) {
        await subscribeToWebPush(user?.id || 'guest');
        setPushEnabled(true);
        alert('웹 푸시 알림이 활성화되었습니다! 결제일 3일 전과 1일 전에 푸시를 보내드립니다.');
      } else {
        await unsubscribeWebPush(user?.id || 'guest');
        setPushEnabled(false);
        alert('웹 푸시 알림이 해제되었습니다.');
      }
    } catch (err: any) {
      if (err.message === 'IOS_STANDALONE_REQUIRED') {
        setShowA2HSPrompt(true);
      } else if (err.message === 'PERMISSION_DENIED') {
        alert('브라우저 설정에서 알림 권한을 허용해 주세요.');
      } else {
        alert('푸시 알림 설정 중 오류가 발생했습니다: ' + err.message);
      }
    } finally {
      setIsPushLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-bold text-slate-800">내 정보 및 설정</h1>

      {/* 사용자 프로필 카드 */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
            {user ? user.email?.[0].toUpperCase() || 'U' : 'G'}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {user ? user.email : '게스트 사용자 (오프라인 모드)'}
            </p>
            <p className="text-xs text-slate-400">
              {user ? '클라우드 동기화 켜짐' : '기기 로컬에만 데이터 저장 중'}
            </p>
          </div>
        </div>

        {!user ? (
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            로그인하고 여러 기기에서 동기화하기
          </button>
        ) : (
          <button
            onClick={signOut}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            로그아웃
          </button>
        )}
      </div>

      {/* 3단계: 알림 설정 (C5) */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          알림 설정 (C5)
        </h2>

        <div className="flex justify-between items-center text-xs">
          <div>
            <p className="font-semibold text-slate-700">웹 푸시 알림 받기</p>
            <p className="text-slate-400 text-[11px]">결제일 3일 전, 1일 전 오전 9시에 발송</p>
          </div>
          <button
            onClick={handleTogglePush}
            disabled={isPushLoading}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
              pushEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform"></div>
          </button>
        </div>

        <button
          onClick={() => setShowA2HSPrompt(true)}
          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4 text-indigo-600" />
          홈 화면에 추가 안내 (iOS/Android)
        </button>
      </div>

      {/* 4단계: 구독료 줄이기 & 운영자 관리 (H1) */}
      <div className="space-y-2">
        <button
          onClick={() => navigate('/defense')}
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between hover:border-emerald-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">구독료 줄이기</p>
              <p className="text-xs text-slate-400">요금제 전환 및 통신사 결합 할인 찾기</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between hover:border-indigo-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">운영자 관리 화면 (H1)</p>
              <p className="text-xs text-slate-400">요금표 및 결합 규칙 편집, 요금 인상 테스트</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => navigate('/privacy')}
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between hover:border-slate-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              📜
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">개인정보 처리방침 (초안)</p>
              <p className="text-xs text-slate-400">수집 항목, 비저장 원칙 및 해외 이전 안내</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {user && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full p-4 bg-white border border-rose-200 rounded-2xl shadow-sm flex items-center justify-between hover:border-rose-400 transition text-rose-600"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <UserX className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-rose-600">회원 탈퇴</p>
                <p className="text-xs text-rose-400">구독 데이터 및 서버 정보 영구 삭제</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </button>
        )}
      </div>

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[360px] w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">정말 탈퇴하시겠습니까?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                탈퇴 시 등록된 모든 구독 내역, 파티 정산, 알림 기록이 <strong>서버와 기기에서 즉시 영구 삭제(Cascade Delete)</strong>되며 복구할 수 없습니다.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  const res = await deleteAccount();
                  setIsDeleting(false);
                  setShowDeleteModal(false);
                  if (res.success) {
                    alert('회원 탈퇴 및 개인정보 삭제가 완료되었습니다.');
                    navigate('/');
                  } else {
                    alert('탈퇴 처리 중 오류가 발생했습니다: ' + res.error);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 font-bold"
              >
                {isDeleting ? '삭제 중...' : '영구 탈퇴'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showA2HSPrompt && (
        <AddToHomeScreenPrompt
          isOpen={true}
          onClose={() => setShowA2HSPrompt(false)}
          triggerContext="manual"
        />
      )}
    </div>
  );
};
