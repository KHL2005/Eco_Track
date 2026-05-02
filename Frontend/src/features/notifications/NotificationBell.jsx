import { useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import * as notifApi from '../../api/notificationsApi';
import { timeAgo } from '../../utils/formatters';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'unread', user?.userId],
    queryFn: () => notifApi.getUnreadByUser(user?.userId).then(r => r.data).catch(() => []),
    enabled: !!user?.userId,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id) => notifApi.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => notifApi.markAllRead(user?.userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-earth-100 text-bark-600 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-bark-400/10 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bark-400/10">
            <span className="font-semibold text-bark-800 text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={() => markAll.mutate()} className="text-xs text-forest-600 hover:text-forest-700">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-bark-400 hover:text-bark-600"><X size={16} /></button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-bark-400">No new notifications</div>
            ) : (
              notifications.map((n) => (
                <div key={n.notificationId} className="px-4 py-3 hover:bg-earth-100 border-b border-bark-400/5 flex gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-forest-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-bark-800 leading-snug">{n.message}</p>
                    <p className="text-xs text-bark-400 mt-0.5">{timeAgo(n.createdDate)}</p>
                  </div>
                  <button onClick={() => markRead.mutate(n.notificationId)} className="text-bark-400 hover:text-forest-600 flex-shrink-0">
                    <Check size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

