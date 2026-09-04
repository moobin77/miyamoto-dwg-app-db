import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';
import { Drawing } from '../types';

interface NewRevisionModalProps {
  drawing: Drawing;
  onClose: () => void;
  onSubmit: (revisionData: {
    version: string;
    changeDescription: string;
    changeDepartment: 'R&D' | 'Tooling' | 'Production' | 'Quality';
    releasedBy: string;
    ecoNumber: string;
    isApprovedForProduction: boolean;
    diffHighlights: any[];
  }) => Promise<void>;
}

export const NewRevisionModal: React.FC<NewRevisionModalProps> = ({
  drawing,
  onClose,
  onSubmit,
}) => {
  // Auto calculate next version letter
  const currentLetter = drawing.currentVersion.replace(/[^A-Z]/g, '') || 'A';
  const nextCharCode = currentLetter.charCodeAt(0) + 1;
  const defaultNextVersion = `Rev ${String.fromCharCode(nextCharCode)}`;

  const [version, setVersion] = useState(defaultNextVersion);
  const [ecoNumber, setEcoNumber] = useState(
    `ECO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [changeDescription, setChangeDescription] = useState('');
  const [changeDepartment, setChangeDepartment] = useState<'R&D' | 'Tooling' | 'Production' | 'Quality'>('R&D');
  const [releasedBy, setReleasedBy] = useState('วิศวกรออกแบบ ปรีชา เลิศวิชัย');
  const [isApprovedForProduction, setIsApprovedForProduction] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diffLabel, setDiffLabel] = useState('');
  const [diffDesc, setDiffDesc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const diffHighlights = diffLabel.trim()
        ? [
            {
              type: 'modified' as const,
              label: diffLabel,
              description: diffDesc || diffLabel,
              x: 350,
              y: 250,
              width: 140,
              height: 80,
            },
          ]
        : [];

      await onSubmit({
        version,
        changeDescription,
        changeDepartment,
        releasedBy,
        ecoNumber,
        isApprovedForProduction,
        diffHighlights,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-tech">
                สร้างและเผยแพร่เวอร์ชันใหม่ (Release New Revision)
              </h3>
              <p className="text-xs text-slate-400">
                {drawing.code} • ฉบับปัจจุบัน: {drawing.currentVersion}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">ระบบแจ้งเตือนเรียลไทม์อัตโนมัติ:</span> เมื่อกดยืนยันเผยแพร่
              แท็บเล็ตทุกเครื่องในสายการผลิต ({drawing.productionLine}) จะได้รับแจ้งเตือนเสียงและป้ายเตือนสีส้มทันที
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                รหัสเวอร์ชันใหม่ (Version Code)
              </label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono-num font-bold text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                เลขที่คำสั่งเปลี่ยนแบบ (ECO Number)
              </label>
              <input
                type="text"
                required
                value={ecoNumber}
                onChange={(e) => setEcoNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono-num text-purple-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                แผนกผู้แจ้งแก้ไข (Department)
              </label>
              <select
                value={changeDepartment}
                onChange={(e: any) => setChangeDepartment(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="R&D">ฝ่ายวิจัยและพัฒนา (R&D)</option>
                <option value="Tooling">ฝ่ายแม่พิมพ์และทูลลิ่ง (Tooling)</option>
                <option value="Production">ฝ่ายผลิต (Production)</option>
                <option value="Quality">ฝ่ายควบคุมคุณภาพ (Quality / QC)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ผู้ออกแบบ / ปล่อยแบบ (Released By)
              </label>
              <input
                type="text"
                required
                value={releasedBy}
                onChange={(e) => setReleasedBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              รายละเอียดการเปลี่ยนแปลง (Change Description & Reason) *
            </label>
            <textarea
              required
              rows={3}
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              placeholder="เช่น 1. ปรับขนาดรูเจาะเพิ่มขึ้น 1.5mm เพื่อรองรับโบลต์ M12&#10;2. เพิ่มพิกัดความเรียบผิว Ra 0.8"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Diff Highlights Input */}
          <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-300">
              ป้ายไฮไลต์จุดดัดแปลงบนดรออิ้ง (Diff Highlight Badge)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="ชื่อจุด เช่น Bolt Hole Ø12.0"
                value={diffLabel}
                onChange={(e) => setDiffLabel(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="คำอธิบาย เช่น ขยายจากเดิม 10.5mm"
                value={diffDesc}
                onChange={(e) => setDiffDesc(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Production Approval Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-800/80 border border-slate-700 rounded-xl">
            <div>
              <span className="text-xs font-bold text-white block">
                อนุมัติให้สายการผลิตนำไปใช้ทันที (Approved for Mass Production)
              </span>
              <span className="text-[11px] text-slate-400">
                หากปิด จะแสดงเป็นแบบทดลอง (Trial Prototype Only)
              </span>
            </div>
            <input
              type="checkbox"
              checked={isApprovedForProduction}
              onChange={(e) => setIsApprovedForProduction(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังเผยแพร่...' : 'เผยแพร่สู่สายการผลิต (Publish)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
