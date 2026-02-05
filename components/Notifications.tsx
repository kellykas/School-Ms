import React from 'react';
import { X, Check, Bell, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
}

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ isOpen, onClose, notifications, onMarkRead, onMarkAllRead }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-14 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          Notifications
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs">{notifications.filter(n => !n.read).length} New</span>
        </h3>
        <div className="flex gap-1">
            <button onClick={onMarkAllRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 hover:bg-indigo-50 rounded transition-colors" title="Mark all as read">
                Mark all read
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X size={18} />
            </button>
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell size={24} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">We'll let you know when something arrives.</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                    <div key={n.id} className={`p-4 hover:bg-gray-50 transition-all relative group cursor-pointer ${n.read ? 'opacity-60 bg-white' : 'bg-indigo-50/10'}`}>
                        <div className="flex gap-3">
                            <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 shadow-sm border border-white ${
                                n.type === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                                n.type === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                                n.type === 'ALERT' ? 'bg-red-100 text-red-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                                {n.type === 'SUCCESS' ? <CheckCircle size={16} /> :
                                 n.type === 'WARNING' ? <AlertTriangle size={16} /> :
                                 n.type === 'ALERT' ? <Info size={16} /> :
                                 <Info size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className={`text-sm font-semibold truncate pr-2 ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</h4>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center bg-white px-1.5 py-0.5 rounded border border-gray-100">
                                        <Clock size={10} className="mr-1" />{n.time}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                            </div>
                            {!n.read && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-full transition-all bg-white shadow-md border border-gray-100 transform scale-90 hover:scale-100"
                                    title="Mark as read"
                                >
                                    <Check size={14} />
                                </button>
                            )}
                            {!n.read && (
                                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-500 group-hover:opacity-0 transition-opacity" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
      <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
        <button className="text-xs font-bold text-gray-600 hover:text-indigo-600 transition-colors flex items-center justify-center w-full py-1">
            View All Activity <span className="ml-1">→</span>
        </button>
      </div>
    </div>
  );
}

export default Notifications;