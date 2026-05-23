import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { MdClose, MdWarning, MdAccessTime, MdCalendarToday, MdNotificationsNone, MdDoneAll } from 'react-icons/md';

const typeConfig = {
  overdue:   { icon: MdWarning,       bg: 'bg-red-100 dark:bg-red-900/30',       color: 'text-red-600 dark:text-red-400',       dot: 'bg-red-500' },
  due_today: { icon: MdAccessTime,    bg: 'bg-orange-100 dark:bg-orange-900/30', color: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  due_soon:  { icon: MdCalendarToday, bg: 'bg-yellow-100 dark:bg-yellow-900/30', color: 'text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500' },
  due_week:  { icon: MdCalendarToday, bg: 'bg-blue-100 dark:bg-blue-900/30',     color: 'text-blue-600 dark:text-blue-400',     dot: 'bg-blue-400' },
};

const NotificationPanel = ({ onClose }) => {
  const { notifications, unreadCount, markAllRead, markRead, isRead } = useNotifications();
  const navigate  = useNavigate();
  const panelRef  = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleClick = (n) => { markRead(n.id); onClose(); navigate('/debts'); };

  return (
    <div ref={panelRef} className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
          {unreadCount > 0 && (
            <span className="min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
              <MdDoneAll size={14} /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            <MdClose size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <MdNotificationsNone size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No pending debt alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {notifications.map((n) => {
              const cfg  = typeConfig[n.type] || typeConfig.due_week;
              const Icon = cfg.icon;
              const read = isRead(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold ${!read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>{n.title}</p>
                      {!read && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 text-center">
          <button onClick={() => { onClose(); navigate('/debts'); }} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            View all debts →
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
