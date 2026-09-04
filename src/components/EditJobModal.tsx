import React, { useState, useEffect } from 'react';
import { X, Edit3, Layers, AlertCircle, Check } from 'lucide-react';
import { Drawing } from '../types';

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawing: Drawing | null;
  onSubmit: (drawingId: string, updates: Partial<Drawing> & { modelName?: string }) => Promise<void>;
}

export const EditJobModal: React.FC<EditJobModalProps> = ({
  isOpen,
  onClose,
  drawing,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [drawingCode, setDrawingCode] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [material, setMaterial] = useState('');
  const [treatment, setTreatment] = useState('');
  const [machineNo, setMachineNo] = useState('');
  const [productionLine, setProductionLine] = useState('');
  const [toleranceStandard, setToleranceStandard] = useState('ISO 2768-mK');
  const [notesStr, setNotesStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (drawing) {
      setTitle(drawing.title || '');
      setTitleEn(drawing.titleEn || '');
      setDrawingCode(drawing.code || '');
      setPartNumber(drawing.partNumber || '');
      setMaterial(drawing.material || '');
      setTreatment(drawing.treatment || '');
      setMachineNo(drawing.machineNo || '');
      setProductionLine(drawing.productionLine || '');
      setToleranceStandard(drawing.toleranceStandard || 'ISO 2768-mK');
      setNotesStr((drawing.notes || []).join('\n'));
      setError('');
    }
  }, [drawing, isOpen]);

  if (!isOpen || !drawing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawing) return;
    if (!title.trim()) {
      setError('กรุณากรอกชื่องาน / ชื่อแบบดรออิ้ง');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const notes = notesStr
        .split('\n')
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      await onSubmit(drawing.id, {
        title: title.trim(),
        titleEn: titleEn.trim(),
        code: drawingCode.trim(),
        partNumber: partNumber.trim(),
        material: material.trim(),
        treatment: treatment.trim(),
        machineNo: machineNo.trim(),
        productionLine: productionLine.trim(),
        toleranceStandard: toleranceStandard.trim(),
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-2xl text-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-tech">
                แก้ไขชื่องานและรายละเอียดแบบดรออิ้ง (Edit Job & Drawing Info)
              </h3>
              <p className="text-xs text-slate-400">
                สิทธิ์แอดมิน • แผนก {drawing.department || 'PROD'} • รหัสแบบเดิม: {drawing.code}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Job Title (Primary focus) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              ชื่องาน / ชื่อแบบดรออิ้ง (Job Title - TH) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น กระบอกสูบไฮดรอลิก Actuator C50"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              ชื่องานภาษาอังกฤษ (Job Title - EN)
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Precision Hydraulic Actuator Cylinder C50"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Codes & Identifiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                รหัสแบบดรออิ้ง (Drawing Code)
              </label>
              <input
                type="text"
                value={drawingCode}
                onChange={(e) => setDrawingCode(e.target.value)}
                placeholder="เช่น DWG-SAS-C50-0300"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                รหัสชิ้นงานการผลิต (Part Number)
              </label>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="เช่น PN-SAS-C50-L300"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Material & Treatment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                วัสดุชิ้นงาน (Material)
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="เช่น S45C Carbon Steel / SUS304"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                การชุบผิว / การอบชุบ (Surface Treatment)
              </label>
              <input
                type="text"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="เช่น Hard Chrome Plated 20µm / Q+T"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Machine & Line Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                เครื่องจักรประจำชิ้นงาน
              </label>
              <input
                type="text"
                value={machineNo}
                onChange={(e) => setMachineNo(e.target.value)}
                placeholder="CNC-01"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                สายการผลิต (Line)
              </label>
              <input
                type="text"
                value={productionLine}
                onChange={(e) => setProductionLine(e.target.value)}
                placeholder="Line A - Actuator Cell"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                มาตรฐานความเผื่อ
              </label>
              <input
                type="text"
                value={toleranceStandard}
                onChange={(e) => setToleranceStandard(e.target.value)}
                placeholder="ISO 2768-mK"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Production Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              ข้อกำหนด / หมายเหตุฝ่ายผลิต (บรรทัดละ 1 ข้อ)
            </label>
            <textarea
              value={notesStr}
              onChange={(e) => setNotesStr(e.target.value)}
              rows={3}
              placeholder="ลบคม R0.5 ทุกขอบคม&#10;วัดขนาด CMM ทุกชิ้นที่ 1 และ 50&#10;ห้ามมีรอยขีดข่วนบนพื้นผิวชุบฮาร์ดโครม"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition leading-relaxed font-mono text-[11px]"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              * ข้อมูลจะถูกซิงค์ไปยังหน้าจอแท็บเล็ตฝ่ายผลิตทุกเครื่องแบบเรียลไทม์
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>กำลังบันทึก...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึกการแก้ไขชื่องาน</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
