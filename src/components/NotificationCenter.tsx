import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Volume2, X, ArrowRight } from 'lucide-react';
import { NotificationAlert } from '../types';
import { soundEffects } from '../services/sound';

interface NotificationCenterProps {
  notifications: NotificationAlert[];
  onSelectDrawing: (drawingId: string) => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onSelectDrawing,
  onMarkAsRead,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
        title="การแจ้งเตือนแบบเรียลไทม์"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 text-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white">
                การแจ้งเตือนฝ่ายผลิตแบบเรียลไทม์ ({notifications.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => soundEffects.playUrgentAlert()}
                className="p-1 rounded text-slate-400 hover:text-amber-300"
                title="ทดสอบเสียงกระดิ่งแจ้งเตือน"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                ยังไม่มีการแจ้งเตือนใหม่ในขณะนี้
              </div>
            ) : (
              notifications.map((n) => {
                const isUrgent = n.severity === 'URGENT_CHANGE';
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      onMarkAsRead(n.id);
                      onSelectDrawing(n.drawingId);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isUrgent
                        ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/50'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isUrgent ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span className="font-bold text-xs text-white leading-snug">
                          {n.title}
                        </span>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono-num font-bold text-blue-400">
                        {n.drawingCode} • {n.version}
                      </span>
                      <span className="font-mono-num">{n.timestamp}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
