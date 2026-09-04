import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import { Drawing, DrawingVersion } from '../types';
import { TechnicalBlueprint } from './TechnicalBlueprints';

interface VersionDiffViewerProps {
  drawing: Drawing;
  activeVersion: DrawingVersion;
  onClose: () => void;
  theme: 'blueprint' | 'dark' | 'light';
}

export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
  drawing,
  activeVersion,
  onClose,
  theme,
}) => {
  const versions = drawing.versions;
  const [versionA, setVersionA] = useState<DrawingVersion>(
    versions[versions.length - 1] || activeVersion
  );
  const [versionB, setVersionB] = useState<DrawingVersion>(versions[0] || activeVersion);
  const [diffViewMode, setDiffViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-tech">
              ระบบเปรียบเทียบความแตกต่างระหว่างเวอร์ชัน (Visual Version Diff)
            </h2>
            <p className="text-xs text-slate-400">
              {drawing.code} • {drawing.title}
            </p>
          </div>
        </div>

        {/* Version Pickers & Mode Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">แบบเดิม:</span>
            <select
              value={versionA.version}
              onChange={(e) => {
                const found = versions.find((v) => v.version === e.target.value);
                if (found) setVersionA(found);
              }}
              className="bg-slate-700 text-white font-mono-num font-bold rounded px-2 py-0.5 border border-slate-600 focus:outline-none"
            >
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  {v.version} ({v.releaseDate.substring(0, 10)})
                </option>
              ))}
            </select>

            <ArrowRight className="w-4 h-4 text-slate-500 mx-1" />

            <span className="text-slate-400">แบบใหม่:</span>
            <select
              value={versionB.version}
              onChange={(e) => {
                const found = versions.find((v) => v.version === e.target.value);
                if (found) setVersionB(found);
              }}
              className="bg-slate-700 text-emerald-400 font-mono-num font-bold rounded px-2 py-0.5 border border-slate-600 focus:outline-none"
            >
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  {v.version} ({v.releaseDate.substring(0, 10)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setDiffViewMode('side-by-side')}
              className={`px-3 py-1 rounded-md transition ${
                diffViewMode === 'side-by-side' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              เคียงข้าง (Side-by-Side)
            </button>
            <button
              onClick={() => setDiffViewMode('overlay')}
              className={`px-3 py-1 rounded-md transition ${
                diffViewMode === 'overlay' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              ไฮไลต์ซ้อนทับ (Overlay)
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Difference summary summary cards */}
      <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-300">รายการดัดแปลงที่ต้องระวัง:</span>
          <span className="text-slate-400">
            {versionB.changeDescription.split('\n')[0] || 'การแก้ไขปรับปรุงตามคำสั่ง ECO'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> เพิ่มเติม/ปรับขนาด
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> ปรับปรุงพิกัดเผื่อ
          </span>
          <span className="font-mono-num text-blue-400">ECO: {versionB.ecoNumber}</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden p-4">
        {diffViewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Left Box: Version A */}
            <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono-num">
                  [เดิม] {versionA.version} - ปล่อยเมื่อ {versionA.releaseDate}
                </span>
                <span className="text-[11px] text-slate-400">{versionA.releasedBy}</span>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <TechnicalBlueprint
                  drawing={drawing}
                  activeVersion={versionA}
                  showDiff={false}
                  theme={theme}
                  selectedDimId={null}
                />
              </div>
            </div>

            {/* Right Box: Version B */}
            <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-emerald-500/40 overflow-hidden shadow-xl">
              <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 font-mono-num flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  [ใหม่] {versionB.version} - {versionB.ecoNumber}
                </span>
                <span className="text-[11px] text-emerald-400">{versionB.releasedBy}</span>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <TechnicalBlueprint
                  drawing={drawing}
                  activeVersion={versionB}
                  showDiff={true}
                  theme={theme}
                  selectedDimId={null}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Overlay Mode */
          <div className="h-full bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-xl">
            <TechnicalBlueprint
              drawing={drawing}
              activeVersion={versionB}
              showDiff={true}
              theme={theme}
              selectedDimId={null}
            />
          </div>
        )}
      </div>
    </div>
  );
};
