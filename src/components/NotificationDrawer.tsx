import React from 'react';
import { Bell, X, CheckCheck, AlertTriangle, Sparkles, Clock } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#FAF6EF]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#6FA79A]" />
            <h3 className="text-sm font-bold text-[#2C3E38]">
              Alerts & Reminders
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-[#578C80] font-semibold hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onSelectNotification?.(n);
                onClose();
              }}
              className={`p-3.5 rounded-2xl cursor-pointer transition-colors ${
                n.read ? 'bg-white hover:bg-[#FAF6EF]/60' : 'bg-[#F2F7F6]/80 hover:bg-[#E8F2F0]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {n.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-[#D9644F] shrink-0" />
                  ) : n.type === 'milestone' ? (
                    <Sparkles className="w-4 h-4 text-[#E8B04B] shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#6FA79A] shrink-0" />
                  )}
                  <h4 className="text-xs font-bold text-[#2C3E38]">{n.title}</h4>
                </div>
                <span className="text-[10px] text-[#5C736C] shrink-0">{n.timeAgo}</span>
              </div>
              <p className="text-xs text-[#4A645D] mt-1 pl-5 leading-relaxed">
                {n.message}
              </p>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#FAF6EF] text-[11px] text-[#6A857D] text-center border-t border-slate-100">
          Flarecast monitors weather and skin rhythms to alert you before flares peak.
        </div>
      </div>
    </div>
  );
};
