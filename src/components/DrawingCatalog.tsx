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
  FolderTree,
  FolderPlus,
  Folder,
} from 'lucide-react';
import {
  DepartmentId,
  DepartmentInfo,
  ProductModel,
  ProductSeries,
  ModelLengthVariant,
  Drawing,
} from '../types';
import { ModelCard } from './ModelCard';

interface DrawingCatalogProps {
  departments: DepartmentInfo[];
  drawings: Drawing[];
  selectedDrawingId: string;
  onSelectDrawing: (d: Drawing) => void;
  selectedDepartmentId: DepartmentId;
  onSelectDepartment: (deptId: DepartmentId) => void;
  isAdmin: boolean;
  onOpenAddModel: (deptId: DepartmentId, seriesId?: string) => void;
  onOpenAddLength: (model: ProductModel) => void;
  onDeleteModel: (modelId: string, modelCode: string) => void;
  onDeleteLength: (modelId: string, lengthId: string, lengthLabel: string) => void;
  onOpenEditJob?: (drawing: Drawing) => void;
  onOpenEditModel?: (model: ProductModel) => void;
  onOpenAddFile?: (drawing: Drawing) => void;
  onOpenAddFileGuide?: () => void;
  onOpenManageSeries?: (deptId: DepartmentId) => void;
  onOpenAddSeries?: (deptId: DepartmentId) => void;
  onOpenEditSeries?: (series: ProductSeries) => void;
  onDeleteSeries?: (series: ProductSeries) => void;
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
  onOpenManageSeries,
  onOpenAddSeries,
  onOpenEditSeries,
  onDeleteSeries,
  operatorName,
  stationLine,
  machineId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({
    'ser-sas-01': true,
    'ser-sas-02': true,
    'ser-pts-01': true,
    'ser-pts-02': true,
    'ser-ots-01': true,
    'general-series': true,
  });
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({
    'mod-sas-01': true,
    'mod-pts-01': true,
    'mod-pts-02': true,
    'mod-ots-01': true,
  });

  const toggleSeriesExpand = (seriesId: string) => {
    setExpandedSeries((prev) => ({
      ...prev,
      [seriesId]: prev[seriesId] === undefined ? false : !prev[seriesId],
    }));
  };

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

        {/* Admin Quick Action Button for Adding a Model & Series */}
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

            {/* Row: Add Series & Manage Series Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                id="admin-add-series-btn"
                type="button"
                onClick={() =>
                  onOpenAddSeries
                    ? onOpenAddSeries(selectedDepartmentId)
                    : onOpenManageSeries && onOpenManageSeries(selectedDepartmentId)
                }
                className="py-1.5 px-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>+ เพิ่มไฟล์ซีรี่ส์</span>
              </button>

              <button
                id="admin-manage-series-btn"
                type="button"
                onClick={() => onOpenManageSeries && onOpenManageSeries(selectedDepartmentId)}
                className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                <span>📁 จัดการไฟล์ซีรี่ส์</span>
              </button>
            </div>

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
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAddModel(selectedDepartmentId)}
                  className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-500 transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่มรุ่นใหม่
                </button>
                {onOpenManageSeries && (
                  <button
                    type="button"
                    onClick={() => onOpenManageSeries(selectedDepartmentId)}
                    className="px-3.5 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-700 transition inline-flex items-center gap-1.5"
                  >
                    <FolderTree className="w-3.5 h-3.5" /> จัดการซีรี่ส์
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          (() => {
            const seriesList = currentDepartment?.series || [];
            const unassignedModels = filteredModels.filter(
              (m) => !m.seriesId || !seriesList.some((s) => s.id === m.seriesId)
            );

            return (
              <div className="space-y-3">
                {/* 1. Series Folders */}
                {seriesList.map((series) => {
                  const seriesModels = filteredModels.filter((m) => m.seriesId === series.id);
                  const isSeriesExpanded = expandedSeries[series.id] ?? true;

                  return (
                    <div
                      key={series.id}
                      id={`series-folder-${series.id}`}
                      className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 overflow-hidden shadow-lg"
                    >
                      {/* Series Header */}
                      <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-indigo-500/20">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSeriesExpand(series.id)}
                            className="flex-1 text-left flex items-center gap-2.5 min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                              <FolderTree className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-indigo-300 font-mono">
                                  📁 {series.code}
                                </span>
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                                  {seriesModels.length} รุ่น
                                </span>
                              </div>
                              <h3 className="text-xs font-bold text-white truncate mt-0.5">
                                {series.name}
                              </h3>
                            </div>
                            <div className="shrink-0 p-1 text-slate-400 hover:text-white">
                              {isSeriesExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </div>
                          </button>

                          {/* Admin Series Actions: Add Model to Series, Rename Series, Delete Series */}
                          {isAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Add Model to this Series */}
                              <button
                                type="button"
                                title={`เพิ่มรุ่นสินค้าใหม่ในซีรี่ส์ ${series.code}`}
                                onClick={() => onOpenAddModel(selectedDepartmentId, series.id)}
                                className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-[10px] font-bold flex items-center gap-1 transition shadow-sm"
                              >
                                <Plus className="w-3 h-3" />
                                <span className="hidden sm:inline">+ เพิ่มรุ่น</span>
                              </button>

                              {/* Rename Series */}
                              {onOpenEditSeries && (
                                <button
                                  type="button"
                                  title="แก้ไขชื่อซีรี่ส์ (Rename Series)"
                                  onClick={() => onOpenEditSeries(series)}
                                  className="px-2 py-1 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 transition"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span className="hidden sm:inline">แก้ไขชื่อ</span>
                                </button>
                              )}

                              {/* Delete Series with Safeguard */}
                              {onDeleteSeries && (
                                <button
                                  type="button"
                                  title="ลบซีรี่ส์นี้ (Delete Series with Safeguard)"
                                  onClick={() => onDeleteSeries(series)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/15 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Series Body: Models inside this series */}
                      {isSeriesExpanded && (
                        <div className="p-2 space-y-2.5 bg-slate-950/50">
                          {seriesModels.length === 0 ? (
                            <div className="text-center py-4 px-3 text-slate-500 text-xs">
                              <p>ยังไม่มีรุ่นในซีรี่ส์ {series.code}</p>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => onOpenAddModel(selectedDepartmentId, series.id)}
                                  className="mt-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> เพิ่มรุ่นแรกในซีรี่ส์นี้
                                </button>
                              )}
                            </div>
                          ) : (
                            seriesModels.map((model) => (
                              <ModelCard
                                key={model.id}
                                model={model}
                                isExpanded={expandedModels[model.id] ?? true}
                                onToggleExpand={toggleModelExpand}
                                selectedDrawingId={selectedDrawingId}
                                isAdmin={isAdmin}
                                onOpenEditModel={onOpenEditModel}
                                onDeleteModel={onDeleteModel}
                                onOpenAddLength={onOpenAddLength}
                                drawings={drawings}
                                onSelectDrawing={onSelectDrawing}
                                onOpenEditJob={onOpenEditJob}
                                onOpenAddFile={onOpenAddFile}
                                onDeleteLength={onDeleteLength}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 2. Unassigned Models Folder */}
                {unassignedModels.length > 0 && (
                  <div
                    id="general-models-folder"
                    className="rounded-2xl border border-slate-700/80 bg-slate-900/80 overflow-hidden"
                  >
                    <div className="p-3 bg-slate-800/90 border-b border-slate-700/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleSeriesExpand('general-series')}
                        className="flex-1 text-left flex items-center gap-2 min-w-0"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-200">
                            📦 รุ่นทั่วไป (General Models)
                          </span>
                          <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-400 font-mono">
                            {unassignedModels.length} รุ่น
                          </span>
                        </div>
                        <div className="shrink-0 p-1 text-slate-400">
                          {expandedSeries['general-series'] ?? true ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    </div>

                    {(expandedSeries['general-series'] ?? true) && (
                      <div className="p-2 space-y-2.5 bg-slate-950/40">
                        {unassignedModels.map((model) => (
                          <ModelCard
                            key={model.id}
                            model={model}
                            isExpanded={expandedModels[model.id] ?? true}
                            onToggleExpand={toggleModelExpand}
                            selectedDrawingId={selectedDrawingId}
                            isAdmin={isAdmin}
                            onOpenEditModel={onOpenEditModel}
                            onDeleteModel={onDeleteModel}
                            onOpenAddLength={onOpenAddLength}
                            drawings={drawings}
                            onSelectDrawing={onSelectDrawing}
                            onOpenEditJob={onOpenEditJob}
                            onOpenAddFile={onOpenAddFile}
                            onDeleteLength={onDeleteLength}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()
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
