import React, { useState } from 'react';
import { Flame, RefreshCw, CheckCircle2, Database, ExternalLink, ShieldCheck } from 'lucide-react';

interface FirebaseSyncBadgeProps {
  databaseName: string;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  totalDrawings: number;
  totalDepartments: number;
  onSync: () => Promise<void>;
}

export const FirebaseSyncBadge: React.FC<FirebaseSyncBadgeProps> = ({
  databaseName,
  isSyncing,
  lastSyncedAt,
  totalDrawings,
  totalDepartments,
  onSync,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  const handleTriggerSync = async () => {
    try {
      setSyncSuccessMessage(null);
      await onSync();
      setSyncSuccessMessage(`บันทึกข้อมูล ${totalDepartments} แผนก และ ${totalDrawings} ดรออิ้ง เข้าสู่ ${databaseName} สำเร็จแล้ว`);
      setTimeout(() => {
        setSyncSuccessMessage(null);
      }, 5000);
    } catch (e: any) {
      console.error('Firebase sync error:', e);
    }
  };

  return (
    <div className="relative">
      {/* Pill Button */}
      <button
        id="firebase-db-status-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition shadow-sm"
        title={`ฐานข้อมูลคลาวด์ Firebase: ${databaseName}`}
      >
        <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30 shrink-0" />
        <span className="hidden xl:inline font-mono">Firebase:</span>
        <span className="font-mono text-amber-200">{databaseName}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Firebase Firestore</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      เชื่อมต่อแล้ว
                    </span>
                  </div>
                  <p className="text-xs text-amber-300/80 font-mono tracking-wide">{databaseName}</p>
                </div>
              </div>
            </div>

            {/* Storage Info Details */}
            <div className="space-y-2 text-xs mb-4">
              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">ฐานข้อมูล (Database ID):</span>
                  <span className="font-mono font-bold text-amber-300">{databaseName}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">คอลเลกชันแผนก (Departments):</span>
                  <span className="font-semibold text-white">{totalDepartments} แผนก (SAS, PTS, OTS)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">คอลเลกชันดรออิ้ง (Drawings):</span>
                  <span className="font-semibold text-white">{totalDrawings} รายการ</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">ไฟล์แนบ PDF &amp; CAD:</span>
                  <span className="font-semibold text-emerald-400">บันทึกร่วมในเอกสาร Firestore</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">ซิงค์ล่าสุด:</span>
                  <span className="text-slate-200">{lastSyncedAt || 'เรียลไทม์ (Real-time)'}</span>
                </div>
              </div>

              {syncSuccessMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="text-[11px] leading-tight">{syncSuccessMessage}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="btn-sync-all-to-firebase"
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md ${
                  isSyncing
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-500/20'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'กำลังบันทึกลง Firebase...' : 'บันทึกข้อมูลทั้งหมดลง Firebase'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
