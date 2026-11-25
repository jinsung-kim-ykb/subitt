import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-bold text-slate-800">내 정보 및 설정</h1>

      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xl font-bold">
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
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl shadow-sm"
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

      <div className="space-y-2 text-xs text-slate-500">
        <p className="font-semibold text-slate-700">앱 정보</p>
        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
          <div className="flex justify-between">
            <span>버전</span>
            <span>v0.2.0 (2단계 등록 자동화)</span>
          </div>
          <div className="flex justify-between">
            <span>기준 환율</span>
            <span>1 USD = 1,380 KRW (옵션 A)</span>
          </div>
          <div className="flex justify-between">
            <span>개인정보 가림 처리</span>
            <span>카드번호/성명/잔액 기기 내 즉시 마스킹</span>
          </div>
        </div>
      </div>
    </div>
  );
};
