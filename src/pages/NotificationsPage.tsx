import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight, Clock, AlertTriangle } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notif: any) => {
    await markAsRead(notif.id);
    if (notif.type === 'price_increase') {
      navigate('/defense');
    } else if (notif.subscriptionId) {
      const isTrial = notif.type.startsWith('trial');
      navigate(`/detail/${notif.subscriptionId}${isTrial ? '?openCancel=true' : ''}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-800">
            ←
          </button>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            알림함
          </h1>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" /> 전체 읽음
          </button>
        )}
      </div>

      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 leading-relaxed">
        💡 웹 푸시를 켜지 않아도 다가오는 결제일과 무료체험 종료일 알림이 이곳에 자동으로 기록됩니다.
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">알림을 불러오는 중...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">도착한 알림이 없습니다.</p>
          <p className="text-xs text-slate-400">결제일 3일 전과 1일 전에 미리 알려드립니다.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => {
            const isTrial = notif.type.startsWith('trial');
            const isPriceIncrease = notif.type === 'price_increase';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                  notif.isRead
                    ? 'bg-white border-slate-100 opacity-75'
                    : 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/10'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPriceIncrease
                        ? 'bg-rose-100 text-rose-600'
                        : isTrial
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-indigo-100 text-indigo-600'
                    }`}
                  >
                    {isPriceIncrease ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{notif.body}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(notif.scheduledAt).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                {notif.subscriptionId && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 self-center" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
