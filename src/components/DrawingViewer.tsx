import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  History,
  Download,
  PlusCircle,
  Clock,
  Ruler,
  Info,
  Check,
  X,
  Smartphone,
  Edit3,
  Upload,
  Paperclip,
  ExternalLink,
  Eye,
  FileCode,
  File,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Drawing, DrawingVersion, CriticalDimension, AttachedDrawingFile } from '../types';
import { TechnicalBlueprint } from './TechnicalBlueprints';
import { soundEffects } from '../services/sound';

interface DrawingViewerProps {
  drawing: Drawing;
  activeVersion: DrawingVersion;
  onVersionChange: (version: DrawingVersion) => void;
  onOpenAuditTrail: () => void;
  onOpenDiffModal: () => void;
  onOpenNewRevision: () => void;
  onOpenExport: () => void;
  onAcknowledge: (comment: string) => Promise<void>;
  onUpdateInspection: (dimId: string, val: string, status: 'PASS' | 'FAIL' | 'PENDING') => Promise<void>;
  isAcknowledgedByCurrentOp: boolean;
  theme: 'blueprint' | 'dark' | 'light';
  onToggleTheme: (t: 'blueprint' | 'dark' | 'light') => void;
  isAdmin?: boolean;
  onOpenEditJob?: () => void;
  onOpenAddFile?: () => void;
}

export const DrawingViewer: React.FC<DrawingViewerProps> = ({
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
  isAdmin = false,
  onOpenEditJob,
  onOpenAddFile,
}) => {
  // Zoom and Pan transform state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // View toggles
  const [showDiff, setShowDiff] = useState<boolean>(true);
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [showFilesList, setShowFilesList] = useState<boolean>(false);
  const [selectedDimId, setSelectedDimId] = useState<string | null>(null);
  const [activeViewFile, setActiveViewFile] = useState<AttachedDrawingFile | null>(null);

  // Acknowledgment dialog state
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [ackComment, setAckComment] = useState('');
  const [isSubmittingAck, setIsSubmittingAck] = useState(false);

  // Measurement input state for selected critical dimension
  const [inputMeasurement, setInputMeasurement] = useState('');

  // Reset view when drawing or version changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedDimId(null);
    // If drawing has attached files, keep or reset file view
    if (!drawing.attachedFiles || drawing.attachedFiles.length === 0) {
      setActiveViewFile(null);
    }
  }, [drawing.id, activeVersion.version]);

  // Handle Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan interaction (Mouse & Touch for tablets)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // primary click only
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Touch handlers for tablet gestures
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      touchStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPanning || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - touchStartRef.current.x,
      y: e.touches[0].clientY - touchStartRef.current.y,
    });
  };

  const handleTouchEnd = () => setIsPanning(false);

  // Submit acknowledgment
  const handleConfirmAck = async () => {
    setIsSubmittingAck(true);
    try {
      await onAcknowledge(ackComment || 'ตรวจสอบแบบดรออิ้งและเข้าใจจุดปรับปรุงแล้ว');
      setIsAckModalOpen(false);
      setAckComment('');
      soundEffects.playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });
    } finally {
      setIsSubmittingAck(false);
    }
  };

  // Submit dimension measurement
  const handleSaveMeasurement = async (dim: CriticalDimension) => {
    if (!inputMeasurement) return;
    const num = parseFloat(inputMeasurement);
    // Tolerance checking
    let pass: 'PASS' | 'FAIL' = 'PASS';
    if (dim.id === 'dim-2') {
      // Ø50 H7: 50.000 to 50.025
      pass = num >= 50.0 && num <= 50.025 ? 'PASS' : 'FAIL';
    } else if (dim.id === 'dim-1') {
      // 160.00 ±0.10: 159.90 to 160.10
      pass = num >= 159.9 && num <= 160.1 ? 'PASS' : 'FAIL';
    } else if (dim.id === 'dim-4') {
      // 28.00 ±0.05
      pass = num >= 27.95 && num <= 28.05 ? 'PASS' : 'FAIL';
    }

    await onUpdateInspection(dim.id, inputMeasurement, pass);
    setInputMeasurement('');
    soundEffects.playSuccessChime();
  };

  const selectedDim = drawing.criticalDimensions.find((d) => d.id === selectedDimId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. TOP TOOLBAR FOR TABLETS (High Contrast, Large Touch Targets) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shadow-md select-none z-10">
        {/* Drawing info and version chips */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {drawing.department && (
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {drawing.department}
                </span>
              )}
              {drawing.modelCode && (
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  รุ่น: {drawing.modelCode}
                </span>
              )}
              {drawing.lengthLabel && (
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {drawing.lengthLabel}
                </span>
              )}
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wide font-tech">
                {drawing.code}
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-mono-num font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {activeVersion.version}
              </span>
              {activeVersion.isApprovedForProduction ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  อนุมัติผลิต (Production)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  แบบทดลอง (Trial Only)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-xs text-slate-300 font-medium max-w-xl truncate">
                {drawing.title} • {drawing.partNumber} • {drawing.productionLine}
              </p>
              {isAdmin && onOpenEditJob && (
                <button
                  id="btn-edit-job-title"
                  type="button"
                  onClick={onOpenEditJob}
                  className="px-2 py-0.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1 transition shrink-0"
                  title="แก้ไขชื่องานและข้อมูลดรออิ้ง (Admin)"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>แก้ไขชื่องาน</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Version Switcher Pills */}
          <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 ml-2">
            <span className="text-[11px] text-slate-400 px-1.5 font-medium">เวอร์ชัน:</span>
            {drawing.versions.map((ver) => {
              const isActive = ver.version === activeVersion.version;
              return (
                <button
                  key={ver.version}
                  onClick={() => onVersionChange(ver)}
                  className={`px-2.5 py-1 rounded text-xs font-mono-num font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  {ver.version}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons (Audit Trail, Diff, Inspector, Export, New Rev) */}
        <div className="flex items-center gap-2">
          {/* Version Diff Highlight Toggle */}
          <button
            onClick={() => setShowDiff(!showDiff)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showDiff
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="เน้นจุดที่มีการแก้ไขระหว่างเวอร์ชัน"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">จุดแก้ไข (Diff)</span>
          </button>

          {/* Side-by-side Diff Modal */}
          <button
            onClick={onOpenDiffModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">เปรียบเทียบ</span>
          </button>

          {/* Critical Dimensions Inspector */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              showInspector
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Ruler className="w-3.5 h-3.5 text-blue-400" />
            <span>ตรวจขนาด ({drawing.criticalDimensions.length})</span>
          </button>

          {/* Audit History */}
          <button
            onClick={onOpenAuditTrail}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">ประวัติ ECO</span>
          </button>

          {/* Standard Export */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">ส่งออก</span>
          </button>

          {/* Attached Files List Popover */}
          {drawing.attachedFiles && drawing.attachedFiles.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilesList(!showFilesList)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-indigo-300 border border-indigo-500/40 hover:bg-slate-700 transition"
                title="ดูไฟล์ CAD/PDF ที่แนบไว้"
              >
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                <span>ไฟล์แนบ ({drawing.attachedFiles.length})</span>
              </button>

              {showFilesList && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-2 text-xs space-y-1.5">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 text-[11px] font-bold text-slate-300">
                    <span>ไฟล์แนบ ({drawing.attachedFiles.length} รายการ)</span>
                    <button
                      type="button"
                      onClick={() => setShowFilesList(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {drawing.attachedFiles.map((f) => (
                      <div
                        key={f.id}
                        className={`p-2 rounded-lg flex items-center justify-between gap-2 border transition ${
                          activeViewFile?.id === f.id
                            ? 'bg-blue-950/80 border-blue-500/80 shadow-sm'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate text-[11px]">
                            {f.fileName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {f.fileType} • {f.fileSize}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveViewFile(f);
                              setShowFilesList(false);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                              activeViewFile?.id === f.id
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            }`}
                            title="แสดงไฟล์นี้บนจอภาพหลัก"
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>{activeViewFile?.id === f.id ? 'กำลังดู' : 'ดูบนจอ'}</span>
                          </button>
                          {f.dataUrl ? (
                            <a
                              href={f.dataUrl}
                              download={f.fileName}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shrink-0"
                            >
                              ดาวน์โหลด
                            </a>
                          ) : f.fileUrl ? (
                            <a
                              href={f.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shrink-0 flex items-center gap-1"
                            >
                              เปิด <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Add / Attach File Button */}
          {isAdmin && onOpenAddFile && (
            <button
              id="btn-viewer-add-file"
              type="button"
              onClick={onOpenAddFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 transition"
              title="แนบไฟล์งาน CAD/PDF (Admin)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">แนบไฟล์งาน</span>
            </button>
          )}

          {/* New Revision Button (R&D / Engineer) */}
          <button
            onClick={onOpenNewRevision}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>ปรับปรุงแบบ</span>
          </button>
        </div>
      </div>

      {/* 2. REVISION STATUS & OPERATOR ACKNOWLEDGMENT BANNER */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300 font-medium">บันทึกการแก้ไขล่าสุด:</span>
          <span className="text-slate-400 font-mono-num">{activeVersion.releaseDate}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-medium">ECO:</span>
          <span className="text-blue-400 font-mono-num">{activeVersion.ecoNumber}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 truncate max-w-xs">{activeVersion.changeDescription.split('\n')[0]}</span>
        </div>

        {/* Operator Sign-off button / Acknowledged status */}
        <div className="flex items-center gap-2">
          {isAcknowledgedByCurrentOp ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>คุณลงชื่อรับทราบเวอร์ชันนี้แล้ว (Signed)</span>
            </div>
          ) : (
            <button
              onClick={() => setIsAckModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition animate-pulse"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>ลงชื่อรับทราบแบบ ({activeVersion.version})</span>
            </button>
          )}

          {/* Mode Switcher: CAD vs Attached File */}
          {drawing.attachedFiles && drawing.attachedFiles.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveViewFile(null)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                  !activeViewFile
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📐 CAD Blueprint</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewFile(drawing.attachedFiles![0])}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                  activeViewFile
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📄 ไฟล์แนบ ({drawing.attachedFiles.length})</span>
              </button>
            </div>
          )}

          {/* Theme selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => onToggleTheme('blueprint')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                theme === 'blueprint' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Blueprint
            </button>
            <button
              onClick={() => onToggleTheme('dark')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                theme === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => onToggleTheme('light')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                theme === 'light' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Light
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: VECTOR DRAWING VIEWPORT + INSPECTION DRAWER */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Drawing Pan & Zoom Stage */}
        <div
          id="drawing-viewport-stage"
          className="flex-1 h-full relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Transformed Drawing Content */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {activeViewFile ? (
              /* RENDER ATTACHED FILE */
              <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center p-4 bg-slate-900/95 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden mx-auto">
                <div className="w-full flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-800/90 rounded-xl mb-3 border border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-slate-200 min-w-0">
                    <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold truncate">{activeViewFile.fileName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold shrink-0">
                      {activeViewFile.fileType}
                    </span>
                    <span className="text-slate-400 text-[10px] shrink-0">({activeViewFile.fileSize})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveViewFile(null)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold flex items-center gap-1 transition"
                    >
                      <Layers className="w-3 h-3" />
                      <span>กลับไปดู CAD Blueprint</span>
                    </button>
                    {activeViewFile.dataUrl ? (
                      <a
                        href={activeViewFile.dataUrl}
                        download={activeViewFile.fileName}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>ดาวน์โหลด</span>
                      </a>
                    ) : activeViewFile.fileUrl ? (
                      <a
                        href={activeViewFile.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>เปิด</span>
                      </a>
                    ) : null}
                  </div>
                </div>

                {/* Display based on file type */}
                {activeViewFile.fileType === 'IMAGE' ||
                activeViewFile.fileType === 'SVG' ||
                (activeViewFile.dataUrl && activeViewFile.dataUrl.startsWith('data:image/')) ? (
                  <div className="max-h-[70vh] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center p-3">
                    <img
                      src={activeViewFile.dataUrl || activeViewFile.fileUrl}
                      alt={activeViewFile.fileName}
                      referrerPolicy="no-referrer"
                      className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-inner"
                    />
                  </div>
                ) : activeViewFile.fileType === 'PDF' ||
                  (activeViewFile.dataUrl && activeViewFile.dataUrl.startsWith('data:application/pdf')) ? (
                  <div className="w-[85vw] max-w-4xl h-[70vh] rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
                    <iframe
                      src={activeViewFile.dataUrl || activeViewFile.fileUrl}
                      title={activeViewFile.fileName}
                      className="w-full flex-1 border-0 rounded-b-xl"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-4 max-w-md my-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                      <FileCode className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{activeViewFile.fileName}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        ไฟล์มาตรฐานสำหรับเครื่องจักรและการผลิต ({activeViewFile.fileType})
                      </p>
                      {activeViewFile.notes && (
                        <p className="text-[11px] text-slate-300 mt-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          {activeViewFile.notes}
                        </p>
                      )}
                    </div>
                    {activeViewFile.dataUrl && (
                      <a
                        href={activeViewFile.dataUrl}
                        download={activeViewFile.fileName}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition"
                      >
                        <Download className="w-4 h-4" /> ดาวน์โหลดไฟล์เข้าเครื่องจักร CNC
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <TechnicalBlueprint
                drawing={drawing}
                activeVersion={activeVersion}
                showDiff={showDiff}
                theme={theme}
                selectedDimId={selectedDimId}
                onSelectDim={(id) => {
                  setSelectedDimId(id);
                  setShowInspector(true);
                }}
              />
            )}
          </div>

          {/* Floating Tablet Canvas Floating Controls */}
          <div className="absolute bottom-5 left-5 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl z-20">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 active:scale-95 transition"
              title="ซูมเข้า (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono-num text-slate-300 px-2 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 active:scale-95 transition"
              title="ซูมออก (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
            <button
              onClick={handleResetZoom}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 active:scale-95 transition"
              title="พอดีจอ (Fit Screen)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Tablet Pinch/Pan hint badge */}
          <div className="hidden lg:flex absolute top-4 left-4 items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 text-slate-400 text-[11px] border border-slate-800 pointer-events-none">
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span>ใช้ 1 นิ้วเลื่อนตำแหน่งภาพ • แตะที่ขนาดเพื่อบันทึกการวัด</span>
          </div>
        </div>

        {/* 4. SHOPFLOOR CRITICAL DIMENSIONS INSPECTOR DRAWER */}
        {showInspector && (
          <aside className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-20 shadow-2xl">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">ตรวจสอบขนาดวิกฤต (QC)</h3>
              </div>
              <button
                onClick={() => setShowInspector(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 text-xs text-slate-400 bg-slate-800/40 border-b border-slate-800">
              พนักงานฝ่ายผลิตวัดขนาดจากชิ้นงานจริงและกรอกผลเพื่อตรวจสอบพิกัดความเผื่ออัตโนมัติ
            </div>

            {/* List of critical dimensions */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {drawing.criticalDimensions.map((dim) => {
                const isSelected = selectedDimId === dim.id;
                return (
                  <div
                    key={dim.id}
                    onClick={() => {
                      setSelectedDimId(dim.id);
                      setInputMeasurement(dim.measuredValue || '');
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono-num font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          #{dim.itemNo}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-200 mt-1">{dim.label}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          dim.status === 'PASS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : dim.status === 'FAIL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {dim.status}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">ขนาดแบบ:</span>
                        <p className="font-mono-num font-bold text-white text-xs">{dim.nominal}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">พิกัดเผื่อ:</span>
                        <p className="font-mono-num text-amber-300 text-xs">{dim.tolerance}</p>
                      </div>
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400">เครื่องมือ: {dim.tool}</div>

                    {/* Measured value display */}
                    {dim.measuredValue && (
                      <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400">ผลวัดหน้างาน:</span>
                        <span className="font-mono-num font-bold text-emerald-400">
                          {dim.measuredValue} mm
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom measurement input form for selected dimension */}
            {selectedDim && (
              <div className="p-3.5 border-t border-slate-800 bg-slate-900/90">
                <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>บันทึกผลวัด #{selectedDim.itemNo} ({selectedDim.nominal})</span>
                  <span className="text-amber-400 text-[11px] font-mono-num">{selectedDim.tolerance}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMeasurement}
                    onChange={(e) => setInputMeasurement(e.target.value)}
                    placeholder="เช่น 50.015"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono-num text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSaveMeasurement(selectedDim)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 5. MODAL: OPERATOR ACKNOWLEDGMENT / SIGN-OFF */}
      {isAckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ลงชื่อรับทราบแบบดรออิ้ง</h3>
                <p className="text-xs text-slate-400">
                  {drawing.code} ({activeVersion.version})
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5">
              <p className="font-semibold text-slate-200">ข้อกำหนดการสื่อสารฝ่ายผลิต:</p>
              <p className="text-slate-300">
                การลงชื่อนี้ยืนยันว่าท่านได้ตรวจสอบแบบฉบับล่าสุด และได้ตั้งค่าเครื่องจักรตามค่าพิกัดความเผื่อที่ปรับปรุงใหม่เพื่อป้องกันงานเสีย (Defect Prevention)
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                หมายเหตุการตรวจสอบ (อุปกรณ์ / ชิ้นงานทดลอง):
              </label>
              <textarea
                value={ackComment}
                onChange={(e) => setAckComment(e.target.value)}
                placeholder="เช่น ตรวจสอบเซ็ตมีดกลึงและปรับค่าชดเชย Tool Offset เรียบร้อยแล้ว"
                className="w-full h-20 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAckModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmAck}
                disabled={isSubmittingAck}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition"
              >
                {isSubmittingAck ? 'กำลังบันทึก...' : 'ยืนยันรับทราบ (Sign-off)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
