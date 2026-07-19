import React, { useState, useEffect } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { toast } from 'react-hot-toast';
import { Bell, Check, Info, AlertTriangle } from 'lucide-react';

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <LoadingSpinner />;

  const iconConfig = {
    SUCCESS: { Icon: Check,         cls: 'bg-emerald-500/15 text-emerald-400' },
    WARNING: { Icon: AlertTriangle,  cls: 'bg-amber-500/15 text-amber-400' },
    INFO:    { Icon: Info,           cls: 'bg-blue-500/15 text-blue-400' },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Notifications</h1>
          <p className="text-muted mt-1">Stay updated on your donations and requests.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm font-medium text-blue-500 hover:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No notifications yet"
              description="When there's an update regarding your activity, it will appear here."
              icon={Bell}
            />
          </div>
        ) : (
          <ul className="divide-y divide-theme">
            {notifications.map(notification => {
              const { Icon, cls } = iconConfig[notification.type] || iconConfig.INFO;
              return (
                <li
                  key={notification.id}
                  className={`p-4 sm:p-6 transition-colors ${!notification.isRead ? 'bg-blue-500/5' : 'hover:bg-surface2/50'}`}
                >
                  <div className="flex gap-4">
                    <div className={`shrink-0 mt-1 h-10 w-10 rounded-full flex items-center justify-center ${cls}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-sm ${!notification.isRead ? 'font-bold text-primary' : 'font-medium text-primary'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-subtle shrink-0 ml-2">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm ${!notification.isRead ? 'text-muted' : 'text-subtle'}`}>
                        {notification.message}
                      </p>

                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="mt-3 text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
