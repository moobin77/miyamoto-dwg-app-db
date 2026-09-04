import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Drawing, DrawingVersion } from '../types';

interface RevisionAlertBannerProps {
  drawing: Drawing;
  activeVersion: DrawingVersion;
  onSwitchToLatest: () => void;
}

export const RevisionAlertBanner: React.FC<RevisionAlertBannerProps> = ({
  drawing,
  activeVersion,
  onSwitchToLatest,
}) => {
  // If active version is not the latest version on the cloud server
  const isLatest = activeVersion.version === drawing.currentVersion;
  if (isLatest) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between border-b border-amber-700 animate-pulse z-30">
      <div className="flex items-center gap-3">
        <div className="p-1 rounded-md bg-amber-700/80">
          <AlertOctagon className="w-5 h-5 text-amber-200" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider bg-amber-900/50 px-2 py-0.5 rounded text-amber-200">
              คำเตือนการผลิต: แบบฉบับเก่า
            </span>
            <span className="text-xs font-semibold">
              คุณกำลังดู {activeVersion.version} แต่ระบบคลาวด์มีฉบับล่าสุดคือ {drawing.currentVersion}
            </span>
          </div>
          <p className="text-[11px] text-amber-100/90 mt-0.5">
            ห้ามใช้แบบเก่าผลิตชิ้นงาน! เพื่อป้องกันความผิดพลาดในสายการผลิต
          </p>
        </div>
      </div>

      <button
        onClick={onSwitchToLatest}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white text-xs font-bold shadow transition"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>โหลดแบบล่าสุด ({drawing.currentVersion})</span>
      </button>
    </div>
  );
};
