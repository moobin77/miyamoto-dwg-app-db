import React, { useState, useEffect } from 'react';
import { X, Plus, Ruler, AlertCircle, Check } from 'lucide-react';
import { ProductModel } from '../types';

interface AddLengthModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ProductModel | null;
  onSubmit: (
    modelId: string,
    lengthData: {
      lengthMm: number;
      lengthLabel?: string;
      partNumber?: string;
      machineNo?: string;
      nominalStroke?: string;
    }
  ) => Promise<void>;
}

export const AddLengthModal: React.FC<AddLengthModalProps> = ({
  isOpen,
  onClose,
  model,
  onSubmit,
}) => {
  const [lengthMm, setLengthMm] = useState<number>(450);
  const [lengthLabel, setLengthLabel] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [machineNo, setMachineNo] = useState('CNC-02 (Okuma)');
  const [nominalStroke, setNominalStroke] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (model) {
      const defaultLen = 450;
      setLengthMm(defaultLen);
      setLengthLabel(`L = ${defaultLen} mm`);
      setPartNumber(`PN-${model.code}-L${defaultLen}`);
      setNominalStroke(`${Math.round(defaultLen * 0.6)} mm`);
      if (model.lengths && model.lengths.length > 0) {
        setMachineNo(model.lengths[0].machineNo || 'CNC-01');
      }
    }
  }, [model]);

  if (!isOpen || !model) return null;

  const handleLengthChange = (val: number) => {
    setLengthMm(val);
    setLengthLabel(`L = ${val} mm`);
    setPartNumber(`PN-${model.code}-L${val}`);
    setNominalStroke(`${Math.round(val * 0.6)} mm`);
  };

  const handlePreset = (offset: number) => {
    const next = Math.max(10, (lengthMm || 300) + offset);
    handleLengthChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lengthMm || lengthMm <= 0) {
      setError('กรุณาระบุความยาวที่ผลิตที่ถูกต้อง (มากกว่า 0 mm)');
      return;
    }

    // Check if length already exists
    if (model.lengths.some((l) => l.lengthMm === Number(lengthMm))) {
      setError(`ความยาว L = ${lengthMm} mm มีอยู่ในรุ่น ${model.code} แล้ว`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(model.id, {
        lengthMm: Number(lengthMm),
        lengthLabel: lengthLabel.trim() || `L = ${lengthMm} mm`,
        partNumber: partNumber.trim() || `PN-${model.code}-L${lengthMm}`,
        machineNo: machineNo.trim() || undefined,
        nominalStroke: nominalStroke.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเพิ่มความยาว');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="add-length-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="add-length-modal-container"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">เพิ่มความยาวที่ผลิต (Add Length)</h2>
              <p className="text-xs text-slate-400">สร้างความยาวและแบบดรออิ้งใหม่สำหรับรุ่นนี้</p>
            </div>
          </div>
          <button
            id="close-add-length-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Target Banner */}
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                แผนก {model.departmentId}
              </span>
              <span className="font-mono text-sm font-bold text-white tracking-wide">
                {model.code}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{model.name}</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">ความยาวที่มีอยู่แล้ว</span>
            <span className="text-xs font-semibold text-slate-300">
              {model.lengths.length} ขนาด ({model.lengths.map((l) => `${l.lengthMm}mm`).join(', ')})
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl flex items-center gap-2 text-red-200 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Length Input & Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                ความยาวระบุ (Length mm) *
              </label>
              <span className="text-xs text-slate-400">ปุ่มปรับขนาดด่วน:</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={lengthMm || ''}
                onChange={(e) => handleLengthChange(Number(e.target.value))}
                min={10}
                max={6000}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 pr-16 font-mono"
                required
              />
              <span className="absolute right-4 top-3 text-sm text-slate-400 font-bold">mm</span>
            </div>

            {/* Quick Adjustment Pills for Tablet Users */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {[+50, +100, +200, +500, -50, -100].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handlePreset(delta)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono border border-slate-700 transition"
                >
                  {delta > 0 ? `+${delta}` : delta} mm
                </button>
              ))}
            </div>
          </div>

          {/* Label & Part Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ป้ายกำกับขนาด (Length Label)
              </label>
              <input
                type="text"
                value={lengthLabel}
                onChange={(e) => setLengthLabel(e.target.value)}
                placeholder="เช่น L = 600 mm"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                รหัสพาร์ต (Part Number)
              </label>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="เช่น PN-SAS-C50-L600"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Machine & Stroke */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                เครื่องจักรที่ผลิต (Assigned Machine)
              </label>
              <input
                type="text"
                value={machineNo}
                onChange={(e) => setMachineNo(e.target.value)}
                placeholder="เช่น CNC-02, MC-01"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ระยะชัก / ระยะสโตรก (Stroke / Travel)
              </label>
              <input
                type="text"
                value={nominalStroke}
                onChange={(e) => setNominalStroke(e.target.value)}
                placeholder="เช่น 300 mm"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
            >
              ยกเลิก
            </button>
            <button
              id="confirm-add-length-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มความยาวและสร้างดรออิ้ง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
