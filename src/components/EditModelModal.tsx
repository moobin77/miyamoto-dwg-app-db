import React, { useState, useEffect } from 'react';
import { X, Edit3, Box, AlertCircle, Check, Layers, Info } from 'lucide-react';
import { ProductModel } from '../types';

interface EditModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ProductModel | null;
  onSubmit: (
    modelId: string,
    updates: {
      code: string;
      name: string;
      nameEn?: string;
      category: string;
      description?: string;
      svgType: 'flange' | 'shaft' | 'manifold' | 'bracket';
    }
  ) => Promise<void>;
}

export const EditModelModal: React.FC<EditModelModalProps> = ({
  isOpen,
  onClose,
  model,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [svgType, setSvgType] = useState<'flange' | 'shaft' | 'manifold' | 'bracket'>('shaft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (model && isOpen) {
      setCode(model.code || '');
      setName(model.name || '');
      setNameEn(model.nameEn || '');
      setCategory(model.category || 'ชิ้นส่วนเครื่องจักรกล');
      setDescription(model.description || '');
      setSvgType(model.svgType || 'shaft');
      setError('');
    }
  }, [model, isOpen]);

  if (!isOpen || !model) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('กรุณาระบุรหัสรุ่น (Model Code)');
      return;
    }
    if (!name.trim()) {
      setError('กรุณาระบุชื่อรุ่นภาษาไทย (Model Name)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(model.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        category: category.trim() || 'ชิ้นส่วนเครื่องจักรกล',
        description: description.trim() || undefined,
        svgType,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลรุ่น');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="edit-model-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="edit-model-modal-container"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">แก้ไขข้อมูลหัวข้อรุ่น (Edit Model)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30">
                  {model.departmentId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ปรับเปลี่ยนชื่อรุ่น รหัส และข้อมูลจำเพาะหลักของสินค้า
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Model Code & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                รหัสรุ่น (Model Code) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="เช่น SAS-C50, PTS-S60"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                รหัสรุ่นจะนำไปใช้สร้างรหัสดรออิ้งและ Part Number ของทุกความยาว
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                หมวดหมู่ (Category)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="เช่น กระบอกสูบไฮดรอลิก, เพลาขับ"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Model Name TH */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ชื่อรุ่นภาษาไทย (Model Name TH) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น กระบอกสูบไฮดรอลิก Actuator C50"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Model Name EN */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ชื่อรุ่นภาษาอังกฤษ (Model Name EN)
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="เช่น Hydraulic Actuator Cylinder C50"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* CAD SVG Geometry Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ประเภทรูปทรง 2D CAD เวกเตอร์จำลอง (SVG Geometry)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'shaft', label: 'เพลาทรงกระบอก (Shaft)' },
                { id: 'flange', label: 'หน้าแปลน (Flange)' },
                { id: 'manifold', label: 'บล็อกวาล์ว (Manifold)' },
                { id: 'bracket', label: 'ขายึดแท่น (Bracket)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSvgType(t.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition flex flex-col gap-1 ${
                    svgType === t.id
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/40'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <span className="font-bold">{t.id.toUpperCase()}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              คำอธิบายรุ่น / ข้อมูลเทคนิคเพิ่มเติม
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดสเปก มาตรฐานการผลิต หรือการใช้งาน..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Informational Banner */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-xs text-blue-300">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">ระบบซิงโครไนซ์อัตโนมัติ:</span>
              เมื่อกดบันทึก ข้อมูลรหัสและชื่อรุ่นจะได้รับการอัปเดตไปยังแบบดรออิ้งของทุกความยาว ({model.lengths?.length || 0} ขนาด) ภายใต้รุ่นนี้โดยอัตโนมัติ
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>กำลังบันทึกข้อมูล...</>
              ) : (
                <>
                  <Check className="w-4 h-4" /> บันทึกการแก้ไขหัวข้อรุ่น
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
