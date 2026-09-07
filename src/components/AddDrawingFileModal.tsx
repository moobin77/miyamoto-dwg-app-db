import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  FileCode,
  Box,
  Image,
  Link2,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  HardDrive,
  FileCheck,
  AlertCircle,
  Cloud,
  Globe,
  ExternalLink,
  Loader2,
  Trash2,
  Eye,
  Search,
} from 'lucide-react';
import { Drawing, AttachedDrawingFile } from '../types';
import { api } from '../services/api';
import { useGoogleDrivePicker } from '../hooks/useGoogleDrivePicker';

interface AddDrawingFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawing: Drawing | null;
  onSubmitFile?: (drawingId: string, fileData: {
    fileName: string;
    fileType: 'PDF' | 'DXF' | 'DWG' | 'STEP' | 'SVG' | 'IMAGE';
    fileSize: string;
    source: 'DIRECT_UPLOAD' | 'PARAMETRIC_CAD' | 'PDM_SYNC';
    dataUrl?: string;
    fileUrl?: string;
    notes?: string;
  }) => Promise<void>;
  onSubmit?: (drawingId: string, fileData: {
    fileName: string;
    fileType: 'PDF' | 'DXF' | 'DWG' | 'STEP' | 'SVG' | 'IMAGE';
    fileSize: string;
    source: 'DIRECT_UPLOAD' | 'PARAMETRIC_CAD' | 'PDM_SYNC';
    dataUrl?: string;
    fileUrl?: string;
    notes?: string;
  }) => Promise<void>;
  onOpenParametricCreator?: () => void;
  onDeleteFile?: (drawingId: string, fileId: string) => Promise<void>;
  isAdmin?: boolean;
}

export const AddDrawingFileModal: React.FC<AddDrawingFileModalProps> = ({
  isOpen,
  onClose,
  drawing,
  onSubmitFile,
  onSubmit,
  onOpenParametricCreator,
  onDeleteFile,
  isAdmin = true,
}) => {
  const handleSaveDrawingFile = onSubmitFile || onSubmit;
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'GDRIVE' | 'PARAMETRIC' | 'CLOUD'>('UPLOAD');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteOldFile = async (fileId: string, fileName: string) => {
    if (!onDeleteFile || !drawing) return;
    const ok = window.confirm(`คุณแน่ใจหรือไม่ที่จะลบไฟล์เก่า "${fileName}" ออกจากระบบ?`);
    if (!ok) return;
    try {
      setDeletingId(fileId);
      await onDeleteFile(drawing.id, fileId);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [fileType, setFileType] = useState<'PDF' | 'DXF' | 'DWG' | 'STEP' | 'SVG' | 'IMAGE'>('PDF');
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');

  // Google Drive State
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [googleDriveFileName, setGoogleDriveFileName] = useState('');
  const { openPicker, isReady: isPickerReady } = useGoogleDrivePicker();

  // Cloud URL state
  const [cloudUrl, setCloudUrl] = useState('');
  const [cloudFileName, setCloudFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !drawing) return null;

  // Format file size in human readable string
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Detect CAD file type from extension
  const detectFileType = (name: string): 'PDF' | 'DXF' | 'DWG' | 'STEP' | 'SVG' | 'IMAGE' => {
    const ext = name.toLowerCase().split('.').pop() || '';
    if (ext === 'pdf') return 'PDF';
    if (ext === 'dxf') return 'DXF';
    if (ext === 'dwg') return 'DWG';
    if (['stp', 'step', 'iges', 'igs'].includes(ext)) return 'STEP';
    if (ext === 'svg') return 'SVG';
    if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'].includes(ext)) return 'IMAGE';
    return 'PDF';
  };

  // Parse Google Drive file ID from link
  const extractGoogleDriveId = (input: string): string | null => {
    if (!input) return null;
    const trimmed = input.trim();
    const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
    if (matchD) return matchD[1];
    const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    if (matchId) return matchId[1];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
    return null;
  };

  const detectedDriveId = extractGoogleDriveId(googleDriveUrl);

  const handleProcessFile = (file: File) => {
    setSelectedFile(file);
    const detected = detectFileType(file.name);
    setFileType(detected);
    setError('');
    setIsReadingFile(true);

    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setError('ไม่สามารถอ่านไฟล์ได้');
      setIsReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  // Quick sample generator so users can instantly test file upload even without a CAD/PDF file on hand
  const handleGenerateSampleFile = () => {
    const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%" style="background:#0f172a;font-family:monospace">
      <rect x="20" y="20" width="760" height="460" fill="none" stroke="#3b82f6" stroke-width="2"/>
      <rect x="25" y="25" width="750" height="450" fill="none" stroke="#1e3a8a" stroke-width="1" stroke-dasharray="4"/>
      <text x="50" y="70" fill="#60a5fa" font-size="20" font-weight="bold">OFFICIAL BLUEPRINT: ${drawing.code}</text>
      <text x="50" y="100" fill="#94a3b8" font-size="14">MODEL: ${drawing.modelName || drawing.title} | SPEC: ${drawing.partNumber}</text>
      <line x1="50" y1="120" x2="750" y2="120" stroke="#334155" stroke-width="1"/>
      <rect x="150" y="200" width="500" height="120" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
      <circle cx="200" cy="260" r="30" fill="none" stroke="#f59e0b" stroke-width="2"/>
      <line x1="200" y1="210" x2="200" y2="310" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2"/>
      <line x1="150" y1="260" x2="650" y2="260" stroke="#38bdf8" stroke-width="1" stroke-dasharray="4"/>
      <text x="350" y="265" fill="#f8fafc" font-size="16" font-weight="bold">L = ${drawing.lengthMm || 300} mm (NOMINAL STROKE)</text>
      <rect x="520" y="380" width="250" height="90" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="535" y="410" fill="#38bdf8" font-size="12" font-weight="bold">APPROVED PRODUCTION</text>
      <text x="535" y="435" fill="#94a3b8" font-size="11">DATE: ${new Date().toLocaleDateString('th-TH')}</text>
      <text x="535" y="455" fill="#10b981" font-size="11" font-weight="bold">STATUS: VERIFIED CAD VAULT</text>
    </svg>`;
    const blob = new Blob([sampleSvg], { type: 'image/svg+xml' });
    const file = new (window as any).File([blob], `${drawing.code}_Official_Blueprint.svg`, {
      type: 'image/svg+xml',
    });
    handleProcessFile(file);
    setNotes('ไฟล์แบบพิมพ์เขียวเวกเตอร์ 2D มาตรฐานโรงงาน (สร้างอัตโนมัติ)');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadingFile) {
      setError('กำลังโหลดข้อมูลไฟล์ กรุณารอสักครู่...');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      if (activeTab === 'UPLOAD') {
        if (!selectedFile) {
          setError('กรุณาเลือกไฟล์หรือลากไฟล์มาวางก่อนบันทึก');
          setIsSubmitting(false);
          return;
        }

        setUploadStatus('กำลังอัปโหลดไฟล์เข้าสู่ที่เก็บไฟล์ระบบ...');
        let uploadedFileUrl = '';
        let detectedSize = formatSize(selectedFile.size);
        let detectedFileType = fileType;

        try {
          // Upload binary CAD/PDF directly to server disk storage
          const uploadRes = await api.uploadFile(selectedFile);
          uploadedFileUrl = uploadRes.fileUrl;
          detectedSize = uploadRes.fileSize;
          detectedFileType = uploadRes.fileType;
        } catch (uploadErr: any) {
          console.warn('Direct upload server error, falling back if possible:', uploadErr);
          if (selectedFile.size > 2 * 1024 * 1024) {
            throw new Error(`อัปโหลดไฟล์ล้มเหลว: ${uploadErr.message}`);
          }
        }

        if (!handleSaveDrawingFile) {
          throw new Error('ไม่พบฟังก์ชันสำหรับบันทึกไฟล์ (Callback handler not found)');
        }

        await handleSaveDrawingFile(drawing.id, {
          fileName: selectedFile.name,
          fileType: detectedFileType,
          fileSize: detectedSize,
          source: 'DIRECT_UPLOAD',
          fileUrl: uploadedFileUrl || undefined,
          dataUrl: uploadedFileUrl ? undefined : fileDataUrl,
          notes: notes.trim() || 'อัปโหลดเข้าคลังไฟล์ระบบ',
        });
      } else if (activeTab === 'GDRIVE') {
        if (!googleDriveUrl.trim()) {
          setError('กรุณาระบุลิงก์ Google Drive หรือ File ID');
          setIsSubmitting(false);
          return;
        }

        if (!handleSaveDrawingFile) {
          throw new Error('ไม่พบฟังก์ชันสำหรับบันทึกไฟล์ (Callback handler not found)');
        }

        const driveId = extractGoogleDriveId(googleDriveUrl);
        const previewUrl = driveId
          ? `https://drive.google.com/file/d/${driveId}/preview`
          : googleDriveUrl.trim();

        const name =
          googleDriveFileName.trim() ||
          `${drawing.code}_CAD_Drive.${fileType === 'IMAGE' ? 'png' : fileType.toLowerCase()}`;

        await handleSaveDrawingFile(drawing.id, {
          fileName: name,
          fileType,
          fileSize: 'Google Drive Cloud',
          source: 'PDM_SYNC',
          fileUrl: previewUrl,
          notes:
            notes.trim() ||
            `เชื่อมโยงจาก Google Drive (${driveId ? `File ID: ${driveId}` : 'Shared Link'})`,
        });
      } else if (activeTab === 'CLOUD') {
        if (!cloudUrl.trim()) {
          setError('กรุณาระบุ URL หรือ Cloud Storage Link');
          setIsSubmitting(false);
          return;
        }

        if (!handleSaveDrawingFile) {
          throw new Error('ไม่พบฟังก์ชันสำหรับบันทึกไฟล์ (Callback handler not found)');
        }

        const name = cloudFileName.trim() || `${drawing.code}_CAD_Vault.pdf`;
        await handleSaveDrawingFile(drawing.id, {
          fileName: name,
          fileType,
          fileSize: 'Cloud Stream',
          source: 'PDM_SYNC',
          fileUrl: cloudUrl.trim(),
          notes: notes.trim() || 'เชื่อมโยงจากระบบ PDM / Cloud Vault',
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการแนบไฟล์');
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-2xl text-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-tech">
                ระบบเพิ่มและแนบไฟล์งานดรออิ้ง (Add Drawing File &amp; Guide)
              </h3>
              <p className="text-xs text-slate-400">
                สำหรับแอดมินและวิศวกร • ชิ้นงาน: {drawing.code} ({drawing.title})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Guidance Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border-b border-slate-800 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">คำแนะนำการเพิ่มไฟล์สำหรับแอดมิน:</strong> ในระบบการผลิต
            สามารถเพิ่มดรออิ้งได้ 3 รูปแบบหลัก ได้แก่ (1) อัปโหลดไฟล์มาตรฐาน CAD/PDF โดยตรง, (2)
            สร้างแบบอัตโนมัติตามพารามิเตอร์ (Parametric CAD Configurator), หรือ (3) เชื่อมต่อคลาวด์ PDM/Vault
          </p>
        </div>

        {/* 4 Methods Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-800 bg-slate-900 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('UPLOAD');
              setError('');
            }}
            className={`py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'UPLOAD'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>1. อัปโหลดตรง (Server)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('GDRIVE');
              setError('');
            }}
            className={`py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'GDRIVE'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>2. Google Drive (แนะนำ)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('PARAMETRIC');
              setError('');
            }}
            className={`py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'PARAMETRIC'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>3. Parametric CAD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('CLOUD');
              setError('');
            }}
            className={`py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'CLOUD'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>4. PDM / Vault Link</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: DIRECT FILE UPLOAD */}
          {activeTab === 'UPLOAD' && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : selectedFile
                    ? 'border-emerald-500/60 bg-emerald-500/5'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.dxf,.dwg,.step,.stp,.iges,.igs,.svg,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 border border-emerald-500/30">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-white text-sm">{selectedFile.name}</span>
                    <span className="text-slate-400 text-[11px] mt-0.5">
                      ขนาด: {formatSize(selectedFile.size)} • ตรวจพบชนิด: {fileType}
                    </span>
                    {fileDataUrl && (fileType === 'IMAGE' || fileType === 'SVG') && (
                      <div className="mt-2 max-h-24 max-w-xs overflow-hidden rounded border border-slate-700 bg-slate-950 p-1">
                        <img
                          src={fileDataUrl}
                          alt="preview"
                          referrerPolicy="no-referrer"
                          className="max-h-20 mx-auto object-contain"
                        />
                      </div>
                    )}
                    <span className="mt-2 text-[11px] text-blue-400 underline">
                      คลิกเพื่อเปลี่ยนไฟล์อื่น
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-white text-sm">
                      ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                    </span>
                    <span className="text-slate-400 text-[11px] mt-1 max-w-md">
                      รองรับ: <strong>PDF (ดรออิ้งมาตรฐาน)</strong>, <strong>DXF / DWG (CAD 2D)</strong>,{' '}
                      <strong>STEP / IGES (3D)</strong>, <strong>SVG (เวกเตอร์)</strong>, รูปภาพสแกน
                    </span>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateSampleFile();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
                      >
                        <span>⚡ สร้างไฟล์พิมพ์เขียวตัวอย่างทันที (Auto-Generate Sample CAD)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* File Format Selector & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    ประเภทไฟล์มาตรฐาน (File Category)
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="PDF">PDF - Official 2D Blueprint (แนะนำสำหรับหน้าจอแท็บเล็ต)</option>
                    <option value="DXF">DXF - AutoCAD Exchange Format (สำหรับเครื่อง CNC / Laser)</option>
                    <option value="DWG">DWG - AutoCAD Native Drawing</option>
                    <option value="STEP">STEP / STP - 3D Solid Model (สำหรับ CMM &amp; CAM)</option>
                    <option value="SVG">SVG - Scalable Vector Schematic</option>
                    <option value="IMAGE">IMAGE - High-Res Blueprint Scan (PNG/JPG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    คำอธิบาย / วัตถุประสงค์ไฟล์
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="เช่น ดรออิ้งสั่งผลิตจากฝ่ายออกแบบ R&D ชุดปล่อยตัวจริง"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Supported formats pills */}
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-wrap gap-2 items-center text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">รูปแบบไฟล์ที่แท็บเล็ตรองรับ:</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  .PDF (ดูบนจอสัมผัส)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  .DXF (CAD/CAM)
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  .DWG (AutoCAD)
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  .STEP (3D Model)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  .SVG / .PNG
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{uploadStatus || 'กำลังอัปโหลด...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>อัปโหลดและแนบไฟล์เข้าระบบ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB: GOOGLE DRIVE INTEGRATION */}
          {activeTab === 'GDRIVE' && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-300 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">
                    วิธีที่ 2: เชื่อมต่อไฟล์ CAD/DWG/PDF จาก Google Drive (แนะนำสำหรับโรงงาน)
                  </h4>
                </div>
                <p className="leading-relaxed">
                  หากฝ่ายออกแบบหรือ R&amp;D จัดเก็บไฟล์ไว้บน <strong>Google Drive</strong> หรือ <strong>Shared Drive</strong>{' '}
                  คุณสามารถคัดลอกลิงก์มาวางได้ทันที แท็บเล็ตหน้างานจะสามารถแสดงผลตัวอย่างแบบ (Live Embedded Preview) และเปิดดูสเปกได้โดยตรง โดยไม่เปลืองพื้นที่เซิร์ฟเวอร์
                </p>

                {/* Step-by-Step Guide */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1 text-[11px]">1. อัปโหลดลง Drive</span>
                    <p className="text-[10px] text-slate-400">
                      อัปโหลดไฟล์ PDF, DWG, DXF หรือ STEP ลงโฟลเดอร์ Google Drive ของบริษัท
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1 text-[11px]">2. เลือกไฟล์ / วางลิงก์</span>
                    <p className="text-[10px] text-slate-400">
                      คลิกปุ่มเลือกไฟล์จาก Drive หรือ นำลิงก์แชร์มาวางในช่องด้านล่าง
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-center">
                    <button
                      type="button"
                      disabled={!isPickerReady}
                      onClick={async () => {
                        try {
                          const files = await openPicker();
                          if (files.length > 0) {
                            const file = files[0];
                            setGoogleDriveUrl(file.url);
                            setGoogleDriveFileName(file.name);
                            // Auto detect simple types
                            if (file.name.toLowerCase().endsWith('.pdf')) setFileType('PDF');
                            else if (file.name.toLowerCase().endsWith('.dxf')) setFileType('DXF');
                            else if (file.name.toLowerCase().endsWith('.dwg')) setFileType('DWG');
                            else if (file.name.toLowerCase().endsWith('.step') || file.name.toLowerCase().endsWith('.stp')) setFileType('STEP');
                          }
                        } catch (err: any) {
                          setError(err.message || 'Google Drive picker failed');
                        }
                      }}
                      className="w-full h-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <Search className="w-4 h-4" />
                      <span>เปิด Google Drive ของคุณ</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  วางลิงก์ Google Drive หรือ File ID <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={googleDriveUrl}
                    onChange={(e) => setGoogleDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1a2b3c4d5e.../view?usp=sharing"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                  {detectedDriveId && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {detectedDriveId ? (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-400">
                    <span>✓ ตรวจพบ Google Drive File ID: <code className="bg-emerald-950 px-1 py-0.5 rounded text-emerald-300">{detectedDriveId}</code></span>
                    <a
                      href={`https://drive.google.com/file/d/${detectedDriveId}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>ทดสอบเปิดดูใน Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : googleDriveUrl.trim() ? (
                  <p className="mt-1.5 text-[11px] text-amber-400">
                    ⚠️ ยังไม่ตรวจพบรูปแบบ Drive ID มาตรฐาน แต่ระบบจะบันทึกเป็น Web Link เชื่อมโยงภายนอก
                  </p>
                ) : (
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">รองรับทุกลิงก์: drive.google.com/file/d/..., open?id=... หรือ File ID ตรง</span>
                    <button
                      type="button"
                      onClick={() => {
                        setGoogleDriveUrl('https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing');
                        setGoogleDriveFileName(`${drawing.code}_Sample_Drive_CAD.pdf`);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-medium underline"
                    >
                      กดเพื่อลองวางลิงก์ตัวอย่าง
                    </button>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    ชื่อไฟล์ที่แสดง (Display File Name)
                  </label>
                  <input
                    type="text"
                    value={googleDriveFileName}
                    onChange={(e) => setGoogleDriveFileName(e.target.value)}
                    placeholder={`${drawing.code}_GoogleDrive_Master.pdf`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    ประเภทของไฟล์บน Drive
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="PDF">PDF Drawing (แสดงตัวอย่างบนจอเครื่องจักรได้ทันที)</option>
                    <option value="DXF">AutoCAD DXF File</option>
                    <option value="DWG">AutoCAD DWG Drawing</option>
                    <option value="STEP">STEP / IGES 3D Solid Model</option>
                    <option value="IMAGE">ภาพพิมพ์เขียวสแกน (PNG / JPG)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  หมายเหตุ / โฟลเดอร์ต้นทาง
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น เก็บใน Shared Drive: Engineering / Release_2025"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !googleDriveUrl.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>เชื่อมต่อไฟล์จาก Google Drive</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PARAMETRIC CAD CONFIGURATOR (Recommendation & Workflow) */}
          {activeTab === 'PARAMETRIC' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-slate-300 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">
                    วิธีที่ 2: ระบบสร้างแบบดรออิ้งตามพารามิเตอร์ (Parametric Blueprint Generator)
                  </h4>
                </div>
                <p className="leading-relaxed">
                  เป็นวิธีที่สะดวกรวดเร็วที่สุดสำหรับโรงงานผลิตชิ้นส่วนมาตรฐาน (เช่น เพลา, กระบอกสูบ,
                  หน้าแปลน, บล็อกแมนิโฟลด์) โดยที่แอดมิน<strong>ไม่จำเป็นต้องเขียนไฟล์ CAD ใหม่ทุกครั้ง</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-1">1. เพิ่มรุ่นชิ้นงาน</span>
                    <p className="text-[11px] text-slate-400">
                      ระบุรหัสรุ่น เช่น SAS-C50, PTS-S60 และเลือกประเภทรูปทรงเรขาคณิต (เพลา, หน้าแปลน ฯลฯ)
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-1">2. เพิ่มความยาวที่ผลิต</span>
                    <p className="text-[11px] text-slate-400">
                      ใส่ระยะความยาว $L$ เช่น 300mm, 450mm, 600mm, 800mm ได้ตามต้องการ
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-1">3. ระบบวาดแบบอัตโนมัติ</span>
                    <p className="text-[11px] text-slate-400">
                      ระบบจะคำนวณสัดส่วน เขียนเส้นบอกขนาด (Dimension lines) และสร้าง Title Block ทันที
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-white">ต้องการเพิ่มรุ่นหรือความยาวใหม่ตอนนี้?</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    คลิกเพื่อเปิดหน้าต่างสร้างรุ่นใหม่ในแผนก {drawing.department || 'SAS'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenParametricCreator) onOpenParametricCreator();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <span>เปิดตัวสร้างรุ่น &amp; ความยาว</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CLOUD PDM / VAULT SYNC */}
          {activeTab === 'CLOUD' && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-slate-300 space-y-2">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">
                    วิธีที่ 4: เชื่อมโยงไฟล์จาก Cloud PDM / Autodesk Vault / ERP
                  </h4>
                </div>
                <p className="leading-relaxed">
                  สำหรับโรงงานที่จัดเก็บไฟล์ CAD กลางไว้บนระบบ SolidWorks PDM, Autodesk Vault, Nextcloud, หรือ Webhook
                  แอดมินสามารถวาง URL เชื่อมโยงได้ เพื่อให้แท็บเล็ตดึงไฟล์ล่าสุดอัตโนมัติ
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Cloud Share Link / PDM Webhook URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  placeholder="https://vault.company.com/drawings/dwg-pts-s60-latest.pdf"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    ชื่อไฟล์ที่แสดง (Display File Name)
                  </label>
                  <input
                    type="text"
                    value={cloudFileName}
                    onChange={(e) => setCloudFileName(e.target.value)}
                    placeholder={`${drawing.code}_Released_ECO.pdf`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    ประเภทของไฟล์ปลายทาง
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="PDF">PDF Drawing Package</option>
                    <option value="DXF">AutoCAD DXF File</option>
                    <option value="DWG">AutoCAD DWG Drawing</option>
                    <option value="STEP">STEP / IGES 3D Solid Model</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  หมายเหตุการเชื่อมต่อ (Notes)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ซิงค์อัตโนมัติเมื่อฝ่าย R&D อนุมัติ ECO ใน SolidWorks Vault"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !cloudUrl.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>กำลังเชื่อมต่อ...</span>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>บันทึกลิงก์ไฟล์งาน</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Current Attached Files List if any */}
          {drawing.attachedFiles && drawing.attachedFiles.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <h5 className="font-bold text-white text-xs mb-2.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>ไฟล์ที่แนบไว้แล้วในแบบนี้ ({drawing.attachedFiles.length} ไฟล์):</span>
              </h5>
              <div className="space-y-2">
                {drawing.attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        {file.fileType === 'PDF' && <FileText className="w-4 h-4" />}
                        {file.fileType === 'DXF' && <FileCode className="w-4 h-4" />}
                        {file.fileType === 'STEP' && <Box className="w-4 h-4" />}
                        {['IMAGE', 'SVG'].includes(file.fileType) && <Image className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{file.fileName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-700 text-slate-300">
                            {file.fileType}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {file.fileSize} • อัปโหลดเมื่อ {file.uploadedAt} โดย {file.uploadedBy}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isAdmin ? (
                        <>
                          {file.dataUrl ? (
                            <a
                              href={file.dataUrl}
                              download={file.fileName}
                              className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium transition"
                            >
                              ดาวน์โหลด
                            </a>
                          ) : file.fileUrl ? (
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-[11px] font-medium transition flex items-center gap-1"
                            >
                              {file.fileUrl.includes('drive.google.com') ? (
                                <>
                                  <Globe className="w-3 h-3" />
                                  <span>เปิดดู</span>
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="w-3 h-3" />
                                  <span>เปิดดู</span>
                                </>
                              )}
                            </a>
                          ) : null}

                          {onDeleteFile && (
                            <button
                              type="button"
                              disabled={deletingId === file.id}
                              onClick={() => handleDeleteOldFile(file.id, file.fileName)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition text-xs flex items-center gap-1"
                              title="ลบไฟล์เก่านี้ (เฉพาะแอดมิน)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">ลบไฟล์</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium flex items-center gap-1 select-none">
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>ดูได้อย่างเดียว</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
