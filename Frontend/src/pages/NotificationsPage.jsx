import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Bell, Check, Archive, Trash2 } from 'lucide-react';
import * as notifApi from '../api/notificationsApi';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/formatters';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'all', user?.userId],
    queryFn: () => notifApi.getNotificationsByUser(user?.userId).then(r => r.data).catch(() => []),
    enabled: !!user?.userId,
  });

  const markRead = useMutation({
    mutationFn: (id) => notifApi.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const archive = useMutation({
    mutationFn: (id) => notifApi.markAsArchived(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const del = useMutation({
    mutationFn: (id) => notifApi.deleteNotification(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Deleted'); },
  });

  const markAll = useMutation({
    mutationFn: () => notifApi.markAllRead(user?.userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications.filter(n => n.status === 'UNREAD');

  const categoryColor = { ISSUE: 'bg-orange-100 text-orange-600', EMISSION: 'bg-purple-100 text-purple-600', PROJECT: 'bg-green-100 text-green-700', COMPLIANCE: 'bg-blue-100 text-blue-600' };

  return (
    <DashboardLayout>
      <PageHeader title="Notifications" description={`${unread.length} unread`}
        action={unread.length > 0 && <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>Mark all read</Button>}
      />

      {isLoading ? (
        <LoadingSkeleton rows={5} cols={1} />
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.notificationId}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${n.status === 'UNREAD' ? 'bg-white border-forest-600/20 shadow-sm' : 'bg-earth-50 border-bark-400/10'}`}>
              <div className="flex-shrink-0 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[n.category] || 'bg-gray-100 text-gray-600'}`}>
                  {n.category}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.status === 'UNREAD' ? 'font-medium text-bark-800' : 'text-bark-600'}`}>{n.message}</p>
                <p className="text-xs text-bark-400 mt-0.5">{timeAgo(n.createdDate)}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {n.status === 'UNREAD' && (
                  <button onClick={() => markRead.mutate(n.notificationId)} className="p-1.5 rounded-lg hover:bg-earth-100 text-bark-400 hover:text-forest-600 transition-colors" title="Mark read">
                    <Check size={14} />
                  </button>
                )}
                <button onClick={() => archive.mutate(n.notificationId)} className="p-1.5 rounded-lg hover:bg-earth-100 text-bark-400 hover:text-bark-600 transition-colors" title="Archive">
                  <Archive size={14} />
                </button>
                <button onClick={() => del.mutate(n.notificationId)} className="p-1.5 rounded-lg hover:bg-danger-light text-bark-400 hover:text-danger transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

