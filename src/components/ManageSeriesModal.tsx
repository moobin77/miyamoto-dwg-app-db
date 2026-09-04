import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Layers,
  FolderPlus,
  FileText,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { DepartmentId, DepartmentInfo, ProductSeries } from '../types';
import { SafeguardDeleteTarget } from './SafeguardDeleteModal';

interface ManageSeriesModalProps {
  isOpen: boolean;
  department: DepartmentInfo;
  onClose: () => void;
  onAddSeries: (seriesData: { name: string; code?: string; description?: string }) => Promise<void>;
  onUpdateSeries: (seriesId: string, updates: { name?: string; code?: string; description?: string }) => Promise<void>;
  onTriggerDeleteSafeguard: (target: SafeguardDeleteTarget, deleteAction: () => Promise<void>) => void;
  onOpenAddModelForSeries?: (seriesId: string) => void;
}

export const ManageSeriesModal: React.FC<ManageSeriesModalProps> = ({
  isOpen,
  department,
  onClose,
  onAddSeries,
  onUpdateSeries,
  onTriggerDeleteSafeguard,
  onOpenAddModelForSeries,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesCode, setNewSeriesCode] = useState('');
  const [newSeriesDesc, setNewSeriesDesc] = useState('');
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCode, setEditingCode] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!isOpen) return null;

  const seriesList = department.series || [];

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeriesName.trim()) return;
    try {
      setIsSubmitting(true);
      setActionError('');
      await onAddSeries({
        name: newSeriesName.trim(),
        code: newSeriesCode.trim() || undefined,
        description: newSeriesDesc.trim() || undefined,
      });
      setNewSeriesName('');
      setNewSeriesCode('');
      setNewSeriesDesc('');
      setIsCreating(false);
    } catch (err: any) {
      setActionError(err?.message || 'ไม่สามารถเพิ่มซีรี่ส์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (s: ProductSeries) => {
    setEditingSeriesId(s.id);
    setEditingName(s.name);
    setEditingCode(s.code);
    setEditingDesc(s.description || '');
  };

  const handleSaveEdit = async (seriesId: string) => {
    if (!editingName.trim()) return;
    try {
      setIsSubmitting(true);
      setActionError('');
      await onUpdateSeries(seriesId, {
        name: editingName.trim(),
        code: editingCode.trim() || undefined,
        description: editingDesc.trim() || undefined,
      });
      setEditingSeriesId(null);
    } catch (err: any) {
      setActionError(err?.message || 'ไม่สามารถแก้ไขซีรี่ส์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (s: ProductSeries) => {
    const modelsInSeries = department.models.filter((m) => m.seriesId === s.id);
    const totalLengths = modelsInSeries.reduce((acc, m) => acc + (m.lengths?.length || 0), 0);

    const target: SafeguardDeleteTarget = {
      type: 'SERIES',
      id: s.id,
      name: s.name,
      code: s.code,
      details: s.description,
      impactCount: modelsInSeries.length,
      impactDescription:
        modelsInSeries.length > 0
          ? `ซีรี่ส์นี้มี ${modelsInSeries.length} รุ่น และ ${totalLengths} ดรออิ้ง ที่เชื่อมโยงอยู่ การลบจะนำข้อมูลเหล่านี้ออกด้วย`
          : 'ไม่มีรุ่นที่ผูกอยู่ สามารถลบได้อย่างปลอดภัย',
    };

    onTriggerDeleteSafeguard(target, async () => {
      // The parent callback will call api.deleteSeries and refresh state
    });
  };

  return (
    <div
      id="manage-series-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="manage-series-modal"
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">จัดการไฟล์ซีรี่ส์ (Series Management)</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-600/40 font-mono font-bold">
                  {department.code} - {department.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                จัดกลุ่มรุ่นและไฟล์ดรออิ้งตามซีรี่ส์ เพิ่ม แก้ไขชื่อ และลบด้วยระบบป้องกัน
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {actionError && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>รายการซีรี่ส์ทั้งหมด ({seriesList.length})</span>
            </div>
            {!isCreating && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>เพิ่มไฟล์ซีรี่ส์ใหม่</span>
              </button>
            )}
          </div>

          {/* New Series Form */}
          {isCreating && (
            <form
              onSubmit={handleCreateSeries}
              className="p-4 bg-slate-950/70 border border-indigo-500/40 rounded-xl space-y-3 animate-fadeIn"
            >
              <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  เพิ่มซีรี่ส์ใหม่ในแผนก {department.code}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ยกเลิก
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    รหัสซีรี่ส์ (Code)
                  </label>
                  <input
                    type="text"
                    value={newSeriesCode}
                    onChange={(e) => setNewSeriesCode(e.target.value.toUpperCase())}
                    placeholder="เช่น SAS-C-SERIES"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    ชื่อซีรี่ส์ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSeriesName}
                    onChange={(e) => setNewSeriesName(e.target.value)}
                    placeholder="เช่น SAS-C Series (กระบอกสูบไฮดรอลิก Compact)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  คำอธิบายเพิ่มเติม
                </label>
                <input
                  type="text"
                  value={newSeriesDesc}
                  onChange={(e) => setNewSeriesDesc(e.target.value)}
                  placeholder="เช่น ซีรี่ส์กระบอกสูบขนาดกะทัดรัดสำหรับพื้นที่ติดตั้งจำกัด"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!newSeriesName.trim() || isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกซีรี่ส์'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Series List */}
          <div className="space-y-2.5">
            {seriesList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                ยังไม่มีซีรี่ส์ในแผนกนี้ กดปุ่ม "เพิ่มไฟล์ซีรี่ส์ใหม่" เพื่อเริ่มต้น
              </div>
            ) : (
              seriesList.map((s) => {
                const isEditing = editingSeriesId === s.id;
                const modelsCount = department.models.filter((m) => m.seriesId === s.id).length;

                if (isEditing) {
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 bg-slate-950 border border-amber-500/50 rounded-xl space-y-2.5 animate-fadeIn"
                    >
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" />
                        แก้ไขชื่อซีรี่ส์
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editingCode}
                          onChange={(e) => setEditingCode(e.target.value.toUpperCase())}
                          placeholder="รหัสซีรี่ส์"
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          placeholder="ชื่อซีรี่ส์"
                          className="md:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <input
                        type="text"
                        value={editingDesc}
                        onChange={(e) => setEditingDesc(e.target.value)}
                        placeholder="รายละเอียด"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingSeriesId(null)}
                          className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(s.id)}
                          disabled={!editingName.trim() || isSubmitting}
                          className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          บันทึกชื่อใหม่
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={s.id}
                    className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3 transition group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                          {s.code}
                        </span>
                        <span className="text-sm font-bold text-white truncate">
                          {s.name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 font-mono">
                          {modelsCount} รุ่น
                        </span>
                      </div>
                      {s.description && (
                        <p className="text-xs text-slate-400 truncate">{s.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onOpenAddModelForSeries && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenAddModelForSeries(s.id);
                            onClose();
                          }}
                          title="เพิ่มรุ่นใหม่ในซีรี่ส์นี้"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>เพิ่มรุ่นในซีรี่ส์</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(s)}
                        title="แก้ไขชื่อซีรี่ส์เท่านั้น"
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(s)}
                        title="ลบซีรี่ส์พร้อมระบบป้องกันความปลอดภัย"
                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/80 text-red-400 hover:text-white border border-red-500/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>* ซีรี่ส์และรุ่นสามารถแก้ไขชื่อและลบได้เท่านั้น และมีระบบป้องกันการกดลบผิด</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
