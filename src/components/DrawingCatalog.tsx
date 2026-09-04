import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Ruler,
  Shield,
  Layers,
  Box,
  HardHat,
  CheckCircle2,
  AlertTriangle,
  FileText,
  AlertCircle,
  Edit3,
  Upload,
  Paperclip,
  HelpCircle,
} from 'lucide-react';
import { DepartmentId, DepartmentInfo, ProductModel, ModelLengthVariant, Drawing } from '../types';

interface DrawingCatalogProps {
  departments: DepartmentInfo[];
  drawings: Drawing[];
  selectedDrawingId: string;
  onSelectDrawing: (d: Drawing) => void;
  selectedDepartmentId: DepartmentId;
  onSelectDepartment: (deptId: DepartmentId) => void;
  isAdmin: boolean;
  onOpenAddModel: (deptId: DepartmentId) => void;
  onOpenAddLength: (model: ProductModel) => void;
  onDeleteModel: (modelId: string, modelCode: string) => void;
  onDeleteLength: (modelId: string, lengthId: string, lengthLabel: string) => void;
  onOpenEditJob?: (drawing: Drawing) => void;
  onOpenEditModel?: (model: ProductModel) => void;
  onOpenAddFile?: (drawing: Drawing) => void;
  onOpenAddFileGuide?: () => void;
  operatorName: string;
  stationLine: string;
  machineId: string;
}

export const DrawingCatalog: React.FC<DrawingCatalogProps> = ({
  departments,
  drawings,
  selectedDrawingId,
  onSelectDrawing,
  selectedDepartmentId,
  onSelectDepartment,
  isAdmin,
  onOpenAddModel,
  onOpenAddLength,
  onDeleteModel,
  onDeleteLength,
  onOpenEditJob,
  onOpenEditModel,
  onOpenAddFile,
  onOpenAddFileGuide,
  operatorName,
  stationLine,
  machineId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({
    'mod-sas-01': true,
    'mod-pts-01': true,
    'mod-pts-02': true,
    'mod-ots-01': true,
  });

  const toggleModelExpand = (modelId: string) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelId]: !prev[modelId],
    }));
  };

  const currentDepartment =
    departments.find((d) => d.id === selectedDepartmentId) || departments[0] || null;

  // Filter models based on search query
  const filteredModels = (currentDepartment?.models || []).filter((model) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchModel =
      model.code.toLowerCase().includes(q) ||
      model.name.toLowerCase().includes(q) ||
      model.category.toLowerCase().includes(q);
    const matchLength = model.lengths.some(
      (l) =>
        l.lengthLabel.toLowerCase().includes(q) ||
        l.partNumber.toLowerCase().includes(q) ||
        l.drawingCode.toLowerCase().includes(q) ||
        String(l.lengthMm).includes(q)
    );
    return matchModel || matchLength;
  });

  return (
    <div
      id="drawing-catalog-sidebar"
      className="w-full sm:w-84 md:w-96 lg:w-[410px] bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none shrink-0"
    >
      {/* Station Operator Card */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
              <HardHat className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">{operatorName}</span>
              <span className="text-[10px] text-slate-400 truncate block">{stationLine}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono-num px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
              {machineId}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Departments Top Bar (1.SAS 2.PTS 3.OTS) */}
      <div className="p-2.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            โครงสร้างสายงานฝ่ายผลิต (3 แผนก)
          </span>
          {isAdmin && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" /> แอดมิน
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(['SAS', 'PTS', 'OTS'] as DepartmentId[]).map((deptId, idx) => {
            const isSelected = selectedDepartmentId === deptId;
            const dept = departments.find((d) => d.id === deptId);
            const modelCount = dept?.models?.length || 0;

            const deptTitles: Record<DepartmentId, { num: string; label: string; sub: string }> = {
              SAS: { num: '1', label: 'SAS', sub: 'Actuators' },
              PTS: { num: '2', label: 'PTS', sub: 'Transmission' },
              OTS: { num: '3', label: 'OTS', sub: 'Tooling/Optics' },
            };

            const info = deptTitles[deptId];

            return (
              <button
                key={deptId}
                id={`dept-tab-${deptId.toLowerCase()}`}
                type="button"
                onClick={() => onSelectDepartment(deptId)}
                className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center text-center border relative ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                    {info.num}.
                  </span>
                  <span className="text-xs font-black tracking-wide">{info.label}</span>
                </div>
                <span className="text-[10px] opacity-75 truncate max-w-full px-1">{info.sub}</span>
                <span
                  className={`mt-1 text-[9px] font-mono-num font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {modelCount} รุ่น
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Admin Add Model Action */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-drawings-input"
            type="text"
            placeholder="ค้นหารุ่น, ความยาว (เช่น 300mm), Part No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Admin Quick Action Button for Adding a Model */}
        {isAdmin && (
          <div className="space-y-1.5">
            <button
              id="admin-add-model-btn"
              type="button"
              onClick={() => onOpenAddModel(selectedDepartmentId)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มรุ่นใหม่ในแผนก {selectedDepartmentId} (Add Model)</span>
            </button>

            {onOpenAddFile && (
              <button
                id="admin-upload-drawing-file-btn"
                type="button"
                onClick={() => {
                  const targetDwg = drawings.find((d) => d.id === selectedDrawingId) || drawings[0];
                  if (targetDwg) onOpenAddFile(targetDwg);
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ แนบ / อัปโหลดไฟล์งานดรออิ้ง (Upload Drawing File)</span>
              </button>
            )}

            {onOpenAddFileGuide && (
              <button
                id="admin-file-guide-btn"
                type="button"
                onClick={onOpenAddFileGuide}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-[11px] font-medium flex items-center justify-center gap-1.5 transition"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>วิธีเพิ่มไฟล์งานของแอดมิน (Upload &amp; CAD Guide)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Models & Lengths Hierarchy List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredModels.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-slate-400">ไม่พบรุ่นที่ตรงกับการค้นหา</p>
            <p className="text-xs text-slate-500 mt-1">
              ในแผนก {selectedDepartmentId} หรือลองเปลี่ยนคำค้นหา
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onOpenAddModel(selectedDepartmentId)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-500 transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มรุ่นใหม่ตอนนี้
              </button>
            )}
          </div>
        ) : (
          filteredModels.map((model) => {
            const isExpanded = expandedModels[model.id] ?? true;
            const hasActiveDrawing = model.lengths.some((l) => l.drawingId === selectedDrawingId);

            return (
              <div
                key={model.id}
                id={`model-card-${model.id}`}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  hasActiveDrawing
                    ? 'bg-slate-850 border-blue-500/60 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20'
                    : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600'
                }`}
              >
                {/* Model Header */}
                <div className="p-3 bg-slate-800/80 border-b border-slate-700/60">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleModelExpand(model.id)}
                      className="flex-1 text-left flex items-start gap-2 min-w-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                        <Box className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-white font-mono tracking-wide">
                            {model.code}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-medium">
                            {model.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-200 mt-0.5 line-clamp-1">
                          {model.name}
                        </h4>
                      </div>
                      <div className="shrink-0 p-1 text-slate-400 hover:text-white">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Admin Action Buttons on Model Header */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* 1. Edit Model Header Button */}
                        {onOpenEditModel && (
                          <button
                            id={`btn-edit-model-${model.id}`}
                            title="แก้ไขหัวข้อรุ่น รหัส และชื่อสินค้า (Edit Model)"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditModel(model);
                            }}
                            className="px-2 py-1 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/15 border border-amber-500/30 transition flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span className="hidden sm:inline">แก้ไขรุ่น</span>
                          </button>
                        )}

                        {/* 2. Attach File to Model's first drawing */}
                        {onOpenAddFile && model.lengths.length > 0 && (
                          <button
                            id={`btn-add-file-model-${model.id}`}
                            title="แนบไฟล์งานดรออิ้งเข้าสู่รุ่นนี้ (PDF, ภาพ, CAD)"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const dwg = drawings.find((d) => d.id === model.lengths[0].drawingId) || drawings[0];
                              if (dwg) onOpenAddFile(dwg);
                            }}
                            className="p-1 rounded-lg text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/15 border border-indigo-500/30 transition flex items-center gap-1 text-[11px]"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                        )}

                        {/* 3. Delete Model */}
                        <button
                          title="ลบรุ่นนี้ (Admin Only)"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteModel(model.id, model.code);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subtitle / Model Stats */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-[10px] text-slate-400">
                      มี <strong className="text-slate-200">{model.lengths.length}</strong> ความยาวที่ผลิต
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddLength(model);
                        }}
                        className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1 transition"
                      >
                        <Plus className="w-3 h-3" /> + เพิ่มความยาว
                      </button>
                    )}
                  </div>
                </div>

                {/* Lengths List inside Model */}
                {isExpanded && (
                  <div className="p-2 space-y-1.5 bg-slate-900/60">
                    {model.lengths.length === 0 ? (
                      <div className="text-center py-3 text-slate-500 text-xs">
                        ยังไม่มีความยาวที่กำหนด
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onOpenAddLength(model)}
                            className="block mx-auto mt-1 text-blue-400 font-semibold text-xs"
                          >
                            + เพิ่มความยาวแรก
                          </button>
                        )}
                      </div>
                    ) : (
                      model.lengths.map((len) => {
                        const drawing = drawings.find((d) => d.id === len.drawingId);
                        const isSelected = len.drawingId === selectedDrawingId;
                        const currentVersion = drawing?.currentVersion || 'Rev A';
                        const isApproved = drawing?.status === 'APPROVED';

                        return (
                          <div
                            key={len.id}
                            id={`length-row-${len.id}`}
                            onClick={() => {
                              if (drawing) {
                                onSelectDrawing(drawing);
                              }
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500/50 text-white'
                                : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-400'
                                    : 'bg-slate-700/60 text-slate-400 border-slate-600'
                                }`}
                              >
                                <Ruler className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black font-mono">
                                    {len.lengthLabel}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {currentVersion}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                                  {len.partNumber} • {len.machineNo}
                                </p>
                              </div>
                            </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Attached files count indicator */}
                                {drawing?.attachedFiles && drawing.attachedFiles.length > 0 && (
                                  <span
                                    title={`${drawing.attachedFiles.length} ไฟล์แนบ`}
                                    className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                  >
                                    <Paperclip className="w-2.5 h-2.5" />
                                    <span>{drawing.attachedFiles.length}</span>
                                  </span>
                                )}

                                <span
                                  className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                                    isApproved
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}
                                >
                                  {isApproved ? (
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                  ) : (
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                  )}
                                  {isApproved ? 'พร้อมผลิต' : 'รออนุมัติ'}
                                </span>

                                {/* Admin Quick Action: Edit Job Title & Info */}
                                {isAdmin && drawing && onOpenEditJob && (
                                  <button
                                    title="แก้ไขชื่องาน / ข้อมูลแบบ (Admin)"
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenEditJob(drawing);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Admin Quick Action: Attach File */}
                                {isAdmin && drawing && onOpenAddFile && (
                                  <button
                                    title="แนบไฟล์งาน CAD/PDF (Admin)"
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenAddFile(drawing);
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition"
                                  >
                                    <Upload className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Admin Delete Length Button */}
                                {isAdmin && (
                                  <button
                                    title="ลบความยาวนี้"
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteLength(model.id, len.id, len.lengthLabel);
                                    }}
                                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}

                                <ChevronRight
                                  className={`w-3.5 h-3.5 transition-transform ${
                                    isSelected ? 'text-blue-400 translate-x-0.5' : 'text-slate-600'
                                  }`}
                                />
                              </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Department Info */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-300">
            {currentDepartment?.code}: {currentDepartment?.name}
          </span>
          <p className="text-[10px] text-slate-500 truncate max-w-[240px]">
            {currentDepartment?.description}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 block">ทั้งหมด</span>
          <span className="font-mono-num font-bold text-slate-300">
            {drawings.filter((d) => d.department === selectedDepartmentId).length} แบบ
          </span>
        </div>
      </div>
    </div>
  );
};
