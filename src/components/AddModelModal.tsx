import React, { useState } from 'react';
import { X, Plus, Layers, Box, Cpu, AlertCircle } from 'lucide-react';
import { DepartmentId, ProductModel } from '../types';

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDepartmentId?: DepartmentId;
  onSubmit: (departmentId: DepartmentId, modelData: {
    code: string;
    name: string;
    nameEn?: string;
    category?: string;
    description?: string;
    svgType: 'flange' | 'shaft' | 'manifold' | 'bracket';
    initialLengthMm: number;
    machineNo?: string;
  }) => Promise<void>;
}

export const AddModelModal: React.FC<AddModelModalProps> = ({
  isOpen,
  onClose,
  defaultDepartmentId = 'SAS',
  onSubmit,
}) => {
  const [departmentId, setDepartmentId] = useState<DepartmentId>(defaultDepartmentId);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('ชิ้นส่วนเครื่องจักรกล');
  const [svgType, setSvgType] = useState<'shaft' | 'flange' | 'manifold' | 'bracket'>('shaft');
  const [initialLengthMm, setInitialLengthMm] = useState<number>(350);
  const [machineNo, setMachineNo] = useState('CNC-01 (Mazak)');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('กรุณาระบุรหัสรุ่น (Model Code)');
      return;
    }
    if (!name.trim()) {
      setError('กรุณาระบุชื่อรุ่น (Model Name)');
      return;
    }
    if (!initialLengthMm || initialLengthMm <= 0) {
      setError('กรุณาระบุความยาวเริ่มต้นที่ถูกต้อง (มากกว่า 0 mm)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(departmentId, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        category,
        description: description.trim() || undefined,
        svgType,
        initialLengthMm: Number(initialLengthMm),
        machineNo: machineNo.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเพิ่มรุ่น');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="add-model-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="add-model-modal-container"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">เพิ่มรุ่นที่ผลิตใหม่ (Add Model)</h2>
              <p className="text-xs text-slate-400">สำหรับผู้ดูแลระบบ / วิศวกรฝ่ายผลิต</p>
            </div>
          </div>
          <button
            id="close-add-model-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl flex items-center gap-2 text-red-200 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Department Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              เลือกแผนกที่สังกัด (Department) *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['SAS', 'PTS', 'OTS'] as DepartmentId[]).map((dept) => {
                const isSelected = departmentId === dept;
                const deptLabel =
                  dept === 'SAS'
                    ? '1. SAS (Actuator)'
                    : dept === 'PTS'
                    ? '2. PTS (Transmission)'
                    : '3. OTS (Tooling/Optical)';
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setDepartmentId(dept)}
                    className={`py-2.5 px-3 rounded-xl font-medium text-sm transition flex flex-col items-center justify-center text-center border ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/20'
                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-bold">{dept}</span>
                    <span className="text-[11px] opacity-75 mt-0.5">
                      {dept === 'SAS' ? 'กันสะเทือน' : dept === 'PTS' ? 'เพลาขับ' : 'แมนิโฟลด์'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Code and Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                รหัสรุ่น (Model Code) *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={`เช่น ${departmentId}-C60`}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono tracking-wide"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                หมวดหมู่ชิ้นงาน (Category)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="เช่น กระบอกสูบ, เพลาขับ"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ชื่อรุ่นภาษาไทย (Model Name - TH) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น กระบอกสูบไฮดรอลิก Actuator C60 Series"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ชื่อรุ่นภาษาอังกฤษ (Model Name - EN)
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="เช่น Hydraulic Actuator Cylinder C60"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Blueprint schematic type & Initial Length */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ลักษณะรูปทรง CAD Blueprint *
              </label>
              <select
                value={svgType}
                onChange={(e) => setSvgType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="shaft">เพลาทรงกระบอก (Shaft / Cylinder)</option>
                <option value="flange">หน้าแปลนดิสก์ (Coupling Flange)</option>
                <option value="manifold">บล็อกควบคุม (Manifold Block)</option>
                <option value="bracket">ฉากยึดโลหะแผ่น (Sheet Bracket)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ความยาวเริ่มต้นที่ผลิต (Initial L mm) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={initialLengthMm}
                  onChange={(e) => setInitialLengthMm(Number(e.target.value))}
                  min={10}
                  max={5000}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 pr-12 font-mono"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold">
                  mm
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              เครื่องจักรหลักที่ผลิต (Primary Machine)
            </label>
            <input
              type="text"
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              placeholder="เช่น CNC-01 (Mazak Quick Turn), MC-04"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              คำอธิบายรายละเอียดทางเทคนิค (Description / Specifications)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุสเปก มาตรฐานวัสดุ หรือข้อกำหนดเฉพาะของรุ่นนี้..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
            />
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
              id="confirm-add-model-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มรุ่นและสร้างดรออิ้ง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
