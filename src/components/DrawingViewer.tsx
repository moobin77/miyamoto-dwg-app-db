import React, { useState } from 'react';
import { Drawing, DrawingVersion, AttachedFile } from '../types';
import { TechnicalBlueprint } from './TechnicalBlueprints';
import { ZoomIn, ZoomOut, Maximize, Clock, FileDiff, Download, History, PenTool, CheckCircle, Share2, Upload } from 'lucide-react';

interface DrawingViewerProps {
  drawing: Drawing;
  activeVersion: DrawingVersion;
  onVersionChange: (v: DrawingVersion) => void;
  onOpenAuditTrail: () => void;
  onOpenDiffModal: () => void;
  onOpenNewRevision: () => void;
  onOpenExport: () => void;
  onAcknowledge: (drawingId: string, version: string, opName: string) => void;
  onUpdateInspection: (drawingId: string, inspectionItemNo: string, val: string) => void;
  isAcknowledgedByCurrentOp: boolean;
  theme: 'blueprint' | 'dark' | 'light';
  onToggleTheme: (theme: 'blueprint' | 'dark' | 'light') => void;
  isAdmin: boolean;
  onOpenEditJob?: () => void;
  onOpenAddFile?: () => void;
  onDeleteAttachedFile?: (file: AttachedFile) => void;
}

export function DrawingViewer({
  drawing,
  activeVersion,
  onVersionChange,
  onOpenAuditTrail,
  onOpenDiffModal,
  onOpenNewRevision,
  onOpenExport,
  onAcknowledge,
  onUpdateInspection,
  isAcknowledgedByCurrentOp,
  theme,
  onToggleTheme,
  isAdmin,
  onOpenEditJob,
  onOpenAddFile,
}: DrawingViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 20, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 20, 20));
  const handleZoomReset = () => setZoom(100);

  
  return (
    <div className="bg-[#0b0d11] relative flex flex-col h-full overflow-hidden">
      
      {/* Viewer Controls */}
      <div className="px-6 py-3 bg-[#1a1d23] border-b border-[rgba(226,232,240,0.1)] flex items-center justify-between z-10 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <span className="meta-label bg-[#3b82f6] text-white !border-none">{drawing.department}</span>
            <h2 className="font-['Syne'] text-lg font-bold tracking-tight text-white">{drawing.code}</h2>
            <span className="meta-label">Rev {activeVersion.version}</span>
          </div>
          <p className="text-[0.7rem] text-[rgba(226,232,240,0.5)] mt-1 font-medium">
            {drawing.name || drawing.lengthLabel} • ECO-{activeVersion.ecoNumber || 'N/A'} • {activeVersion.releaseDate?.substring(0, 10)}
          </p>
        </div>
        <div className="flex gap-2">
          {drawing.versions && drawing.versions.length > 1 && (
            <button className="btn btn-outline" onClick={onOpenDiffModal}>Diff Tool</button>
          )}
          <button className="btn btn-outline" onClick={onOpenAuditTrail}>History</button>
          
          {isAdmin && (
            <>
              {onOpenEditJob && (
                <button className="btn btn-outline text-amber-400 border-amber-900/50 hover:bg-amber-500/10" onClick={onOpenEditJob}>
                  แก้ไข
                </button>
              )}
              {onOpenAddFile && (
                <button className="btn btn-outline text-indigo-400 border-indigo-900/50 hover:bg-indigo-500/10" onClick={onOpenAddFile}>
                  เพิ่มไฟล์แนบ
                </button>
              )}
            </>
          )}
          
          <button 
            className={`btn ${isAcknowledgedByCurrentOp ? 'bg-emerald-900/50 text-emerald-400 border-emerald-900' : 'btn-primary'}`}
            onClick={() => onAcknowledge(drawing.id, activeVersion.version, 'OPERATOR')}
            disabled={isAcknowledgedByCurrentOp}
          >
            {isAcknowledgedByCurrentOp ? 'Acknowledged' : `Sign Off Rev ${activeVersion.version}`}
          </button>
        </div>
      </div>

      <div className="viewer-stage relative flex-1 flex items-center justify-center overflow-auto p-8">
        <div 
          className="transition-transform duration-200 origin-center relative w-full h-full min-w-[800px] min-h-[600px] flex items-center justify-center" 
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <TechnicalBlueprint
            drawing={drawing}
            activeVersion={activeVersion}
            showDiff={false}
            theme={theme}
            selectedDimId={null}
          />
        </div>
        
        {/* HUD floating tools */}
        <div className="absolute bottom-6 left-6 flex gap-[1px] bg-[rgba(226,232,240,0.1)] rounded overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-20">
          <button className="btn btn-outline !bg-[#1a1d23] !border-none !rounded-none" onClick={handleZoomOut}>[-]</button>
          <button className="btn btn-outline !bg-[#1a1d23] !border-none !rounded-none font-['JetBrains_Mono'] w-16" onClick={handleZoomReset}>{zoom}%</button>
          <button className="btn btn-outline !bg-[#1a1d23] !border-none !rounded-none" onClick={handleZoomIn}>[+]</button>
        </div>
        
        {/* Properties HUD */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
          <div className="bg-[#1a1d23] border border-[rgba(226,232,240,0.1)] rounded shadow-xl overflow-hidden w-64">
            <div className="p-3 border-b border-[rgba(226,232,240,0.1)]">
               <h3 className="text-xs font-bold uppercase tracking-wider text-[rgba(226,232,240,0.5)]">Revisions</h3>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {drawing.versions?.map((v) => (
                <button
                  key={v.version}
                  onClick={() => onVersionChange(v)}
                  className={`w-full text-left p-3 border-b border-[rgba(226,232,240,0.05)] transition-colors ${
                    v.version === activeVersion.version ? 'bg-[rgba(59,130,246,0.1)]' : 'hover:bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-bold font-['JetBrains_Mono'] text-sm ${v.version === activeVersion.version ? 'text-[#3b82f6]' : 'text-white'}`}>Rev {v.version}</span>
                    <span className="text-[10px] text-[rgba(226,232,240,0.5)]">{v.releaseDate.substring(0, 10)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <button onClick={onOpenExport} className="btn btn-outline bg-[#1a1d23] shadow-lg w-full">
            Export PDF/DXF
          </button>
        </div>
      </div>
    </div>
  );

}
