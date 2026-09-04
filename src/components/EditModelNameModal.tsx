import React, { useState } from 'react';
import { Edit2, Check, X, AlertCircle, Layers } from 'lucide-react';
import { ProductModel, ProductSeries } from '../types';

interface EditModelNameModalProps {
  isOpen: boolean;
  model: ProductModel | null;
  seriesList?: ProductSeries[];
  onClose: () => void;
  onSave: (modelId: string, updates: { name: string; code?: string; seriesId?: string; description?: string }) => Promise<void>;
}

export const EditModelNameModal: React.FC<EditModelNameModalProps> = ({
  isOpen,
  model,
  seriesList = [],
  onClose,
  onSave,
}) => {
  if (!isOpen || !model) return null;

  const [name, setName] = useState(model.name);
  const [code, setCode] = useState(model.code);
  const [seriesId, setSeriesId] = useState(model.seriesId || '');
  const [description, setDescription] = useState(model.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave(model.id, {
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        seriesId: seriesId || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการแก้ไขชื่อรุ่น');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="edit-model-name-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="edit-model-name-modal"
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">แก้ไขชื่อรุ่นสินค้า (Rename Model)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                รหัสรุ่น: <span className="font-mono text-slate-200">{model.code}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              ชื่อรุ่นสินค้า <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ระบุชื่อรุ่นสินค้า"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">รหัสรุ่น (Code)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="เช่น SAS-C50"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>สังกัดซีรี่ส์</span>
              </label>
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="">-- ไม่ระบุซีรี่ส์ --</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">คำอธิบาย</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดสเปกของรุ่น"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center gap-2 transition shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขชื่อ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
