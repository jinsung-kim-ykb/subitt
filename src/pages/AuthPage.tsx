import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  const { signInWithKakao, signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (err: any) {
      alert('로그인 링크 전송 실패: ' + err.message);
    }
  };

  return (
    <div className="p-6 flex flex-col justify-between min-h-screen">
      <div className="mt-12 text-center">
        <h1 className="text-3xl font-extrabold text-brand-600 tracking-tight">SUBIT</h1>
        <p className="text-sm text-slate-500 mt-2">숨어있는 구독료를 찾아 줄여드립니다</p>
      </div>

      <div className="space-y-4 my-8">
        <button
          onClick={signInWithKakao}
          className="w-full py-3.5 bg-[#FEE500] text-[#191919] font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm hover:opacity-95"
        >
          <span>💬</span> 카카오로 3초 만에 시작하기
        </button>
        <button
          onClick={signInWithGoogle}
          className="w-full py-3.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50"
        >
          <span>🌐</span> Google로 계속하기
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-xs text-slate-400">또는 이메일 간편로그인</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {sent ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-xl text-center">
            로그인 매직링크를 이메일로 전송했습니다!<br />메일함을 확인해 주세요.
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-slate-800 text-white font-medium rounded-xl text-sm hover:bg-slate-900"
            >
              이메일로 로그인
            </button>
          </form>
        )}
      </div>

      <div className="text-center pb-6">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-400 underline hover:text-slate-600"
        >
          로그인 없이 오프라인으로 둘러보기
        </button>
      </div>
    </div>
  );
};
