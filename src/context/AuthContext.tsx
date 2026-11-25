import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { localDb } from '../lib/db';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithKakao: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithKakao = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin },
    });
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const signInWithEmail = async (email: string) => {
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured && user) {
        // 1. Supabase 서버 데이터 영구 삭제 RPC 호출
        const { error } = await supabase.rpc('delete_user_account');
        if (error) {
          console.warn('RPC delete_user_account failed, falling back to sign out:', error);
        }
      }

      // 2. 기기 내 로컬 사본 IndexedDB 및 캐시 전체 초기화
      try {
        await localDb.clearAllData();
      } catch (dbErr) {
        console.warn('Local DB clear failed:', dbErr);
      }

      // 3. 로컬 스토리지에 남아있는 파티/추천/설정 캐시 정리
      localStorage.removeItem('subit_plan_catalog');
      localStorage.removeItem('subit_bundle_rules');
      localStorage.removeItem('subit_cancellation_guides');
      localStorage.removeItem('subit_parties');

      // 4. 세션 종료
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '회원 탈퇴 중 오류가 발생했습니다.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithKakao,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
