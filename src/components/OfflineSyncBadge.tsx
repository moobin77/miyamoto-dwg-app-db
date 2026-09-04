import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Cloud, ArrowUpDown } from 'lucide-react';
import { SyncStatus } from '../types';

interface OfflineSyncBadgeProps {
  syncStatus: SyncStatus;
  onToggleSimulatedOffline: () => void;
  onTriggerSync: () => Promise<void>;
}

export const OfflineSyncBadge: React.FC<OfflineSyncBadgeProps> = ({
  syncStatus,
  onToggleSimulatedOffline,
  onTriggerSync,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { isOnline, isSimulatedOffline, isSyncing, pendingCount, lastSyncedAt } = syncStatus;
  const effectivelyOnline = isOnline && !isSimulatedOffline;

  return (
    <div className="relative">
      {/* Visual Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
          effectivelyOnline
            ? pendingCount > 0
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
        }`}
      >
        {isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
        ) : effectivelyOnline ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-rose-400" />
        )}

        <span className="font-mono-num">
          {effectivelyOnline
            ? pendingCount > 0
              ? `รอซิงค์ (${pendingCount})`
              : 'คลาวด์เชื่อมต่อแล้ว'
            : 'โหมดออฟไลน์'}
        </span>

        {pendingCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-40 text-slate-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-white">สถานะการเชื่อมต่อและซิงค์ข้อมูล</h4>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                effectivelyOnline
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {effectivelyOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="py-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">การจัดเก็บในเครื่อง (Cache):</span>
              <span className="font-semibold text-emerald-400">บันทึก 100% (IndexedDB)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">รายการรอส่งขึ้นคลาวด์:</span>
              <span className="font-mono-num font-bold text-amber-300">
                {pendingCount} รายการ
              </span>
            </div>
            {lastSyncedAt && (
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>ซิงค์ล่าสุด:</span>
                <span className="font-mono-num text-slate-300">{lastSyncedAt}</span>
              </div>
            )}
          </div>

          {/* Sync Now Button */}
          {pendingCount > 0 && effectivelyOnline && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-2 mb-3"
            >
              <ArrowUpDown className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังส่งข้อมูล...' : 'ซิงค์ข้อมูลขึ้นคลาวด์ทันที'}</span>
            </button>
          )}

          {/* Simulated Offline Toggle for Testing in Factory */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                จำลองตัดเน็ตในโรงงาน
              </span>
              <span className="text-[10px] text-slate-400">
                ทดสอบการทำงานออฟไลน์ &amp; Auto-sync
              </span>
            </div>
            <button
              onClick={onToggleSimulatedOffline}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isSimulatedOffline ? 'bg-rose-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                  isSimulatedOffline ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
