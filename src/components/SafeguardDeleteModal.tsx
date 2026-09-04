import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Trash2, X, AlertCircle } from 'lucide-react';

export interface SafeguardDeleteTarget {
  type: 'SERIES' | 'MODEL' | 'LENGTH' | 'FILE';
  id: string;
  name: string;
  code?: string;
  details?: string;
  impactCount?: number;
  impactDescription?: string;
}

interface SafeguardDeleteModalProps {
  isOpen: boolean;
  target: SafeguardDeleteTarget | null;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export const SafeguardDeleteModal: React.FC<SafeguardDeleteModalProps> = ({
  isOpen,
  target,
  onConfirm,
  onClose,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !target) return null;

  const typeLabels: Record<SafeguardDeleteTarget['type'], { th: string; badge: string }> = {
    SERIES: { th: 'ซีรี่ส์ (Series)', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
    MODEL: { th: 'รุ่นสินค้า (Model)', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    LENGTH: { th: 'ความยาว/ดรออิ้ง (Length)', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    FILE: { th: 'ไฟล์แนบ (Attached File)', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  };

  const expectedKey = 'ลบ';
  const expectedKeyEn = 'DELETE';
  const expectedName = target.code || target.name;

  const isConfirmed =
    confirmationInput.trim() === expectedKey ||
    confirmationInput.trim().toUpperCase() === expectedKeyEn ||
    confirmationInput.trim().toLowerCase() === expectedName.trim().toLowerCase();

  const handleExecuteDelete = async () => {
    if (!isConfirmed || isDeleting) return;
    try {
      setIsDeleting(true);
      setErrorMsg('');
      await onConfirm();
      setConfirmationInput('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="safeguard-delete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="safeguard-delete-modal"
        className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl shadow-red-950/40 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Danger Header */}
        <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/60 p-4 border-b border-red-500/30 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">ระบบป้องกันการกดลบผิด (Safeguard)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold ${typeLabels[target.type].badge}`}>
                  {typeLabels[target.type].th}
                </span>
              </div>
              <p className="text-xs text-red-300/80 mt-0.5">
                กรุณาตรวจสอบรายละเอียดก่อนยืนยันการลบ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Target Item Card */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <div className="text-xs text-slate-400 mb-1">รายการที่กำลังจะถูกลบ:</div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{target.name}</span>
              {target.code && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 font-mono text-slate-200 border border-slate-600">
                  {target.code}
                </span>
              )}
            </div>
            {target.details && (
              <p className="text-xs text-slate-400 mt-1">{target.details}</p>
            )}
            {target.impactDescription && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-700 flex items-center gap-2 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{target.impactDescription}</span>
              </div>
            )}
          </div>

          {/* Warning Notice */}
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 leading-relaxed">
              การลบนี้จะส่งผลต่อฐานข้อมูลในระบบทันที หากลบแล้วจะไม่สามารถกู้คืนได้ เพื่อป้องกันการกดพลาด
              กรุณาพิมพ์ยืนยันในช่องด้านล่าง
            </p>
          </div>

          {/* Safeguard Text Verification Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              พิมพ์คำว่า <span className="font-bold text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/30">ลบ</span> หรือ <span className="font-bold text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/30">DELETE</span> เพื่อยืนยัน:
            </label>
            <input
              type="text"
              autoFocus
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="พิมพ์ ลบ หรือ DELETE"
              className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 transition font-mono"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-900/40 border border-red-500/50 rounded-lg text-xs text-red-200">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleExecuteDelete}
            disabled={!isConfirmed || isDeleting}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg ${
              isConfirmed && !isDeleting
                ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-red-600/30 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'กำลังลบข้อมูล...' : 'ยืนยันการลบอย่างปลอดภัย'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
