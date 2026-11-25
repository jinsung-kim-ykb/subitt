import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { NotificationProvider } from './context/NotificationContext';
import { PlanCatalogProvider } from './context/PlanCatalogContext';
import { PartyProvider } from './context/PartyContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ListPage } from './pages/ListPage';
import { DetailPage } from './pages/DetailPage';
import { RegisterPage } from './pages/RegisterPage';
import { ConfirmPage } from './pages/ConfirmPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { DefensePage } from './pages/DefensePage';
import { AdminPage } from './pages/AdminPage';
import { PartyListPage } from './pages/PartyListPage';
import { PartyDetailPage } from './pages/PartyDetailPage';
import { PartyInvitePage } from './pages/PartyInvitePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <NotificationProvider>
            <PlanCatalogProvider>
              <PartyProvider>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  {/* 비회원 공개 초대 링크 뷰 (E2, S09) - 독립 레이아웃으로 철저한 정보 격리 */}
                  <Route path="/party/invite/:inviteToken" element={<PartyInvitePage />} />

                  <Route element={<AppLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/list" element={<ListPage />} />
                    <Route path="/detail/:id" element={<DetailPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/confirm" element={<ConfirmPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/defense" element={<DefensePage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/party" element={<PartyListPage />} />
                    <Route path="/party/:id" element={<PartyDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </PartyProvider>
            </PlanCatalogProvider>
          </NotificationProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
