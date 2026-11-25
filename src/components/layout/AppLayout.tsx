import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-brand-100 selection:text-brand-700">
      <div className="w-full max-w-[430px] min-h-screen bg-white flex flex-col shadow-lg relative">
        <main className="flex-1 pb-20 overflow-y-auto">
          <Outlet />
        </main>
        
        {/* 모바일 하단 네비게이션 바 */}
        <nav className="fixed bottom-0 w-full max-w-[430px] h-16 bg-white border-t border-slate-200 flex items-center justify-around z-20">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 h-full text-xs ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <span className="text-xl">🏠</span>
            <span>홈</span>
          </NavLink>
          <NavLink
            to="/list"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-xs ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <span className="text-xl">📑</span>
            <span>구독</span>
          </NavLink>
          <NavLink
            to="/party"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-xs ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <span className="text-xl">👥</span>
            <span>파티</span>
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-xs ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <span className="text-xl">➕</span>
            <span>등록</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 h-full text-xs ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <span className="text-xl">👤</span>
            <span>내정보</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};
