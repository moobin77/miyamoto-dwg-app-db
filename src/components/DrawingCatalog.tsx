import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Tag,
  ListFilter,
  ExternalLink,
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
  onOpenEditModel?: (model: ProductModel) => void;
  onOpenEditJob?: (drawing: Drawing) => void;
  onOpenAddFile?: (drawing: Drawing) => void;
  onDeleteLength?: (modelId: string, lengthId: string, lengthLabel: string) => void;
  onOpenAddSeries?: (deptId: DepartmentId) => void;
  onOpenManageSeries?: (deptId: DepartmentId) => void;
  onOpenEditSeries?: (series: ProductSeries) => void;
  onDeleteSeries?: (series: ProductSeries) => void;
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
  onOpenEditModel,
  onOpenEditJob,
  onOpenAddFile,
  onDeleteLength,
  onOpenAddSeries,
  onOpenManageSeries,
  onOpenEditSeries,
  onDeleteSeries,
  onOpenAddFileGuide,
  operatorName,
  stationLine,
  machineId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'stepper' | 'tree'>('stepper');

  // 4-Step Access Workflow State:
  // Step 1: Department (e.g. 1.SAS, 2.PTS, 3.OTS)
  // Step 2: Series (e.g. SAS-01, SAS-02)
  // Step 3: Model Code (e.g. SAS-M50)
  // Step 4: Length (e.g. 300mm, 500mm)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(2);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Tree view expansion states
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

  const currentSeriesList = currentDepartment?.series || [];

  // Synchronize active drawing with the stepper
  useEffect(() => {
    if (!selectedDrawingId) return;
    const drawing = drawings.find((d) => d.id === selectedDrawingId);
    if (!drawing) return;

    if (drawing.department && drawing.department !== selectedDepartmentId) {
      onSelectDepartment(drawing.department);
    }

    const dept = departments.find((d) => d.id === (drawing.department || selectedDepartmentId));
    if (!dept) return;

    const foundModel = dept.models.find((m) =>
      m.lengths.some((l) => l.drawingId === drawing.id)
    );

    if (foundModel) {
      setSelectedModelId(foundModel.id);
      setSelectedSeriesId(foundModel.seriesId || 'general-series');
    }
  }, [selectedDrawingId]);

  // Active items based on selections
  const currentSeries =
    selectedSeriesId === 'general-series'
      ? { id: 'general-series', code: 'GENERAL', name: 'รุ่นทั่วไป (General Models)' }
      : currentSeriesList.find((s) => s.id === selectedSeriesId) || null;

  const currentModel =
    currentDepartment?.models.find((m) => m.id === selectedModelId) || null;

  const currentDrawing = drawings.find((d) => d.id === selectedDrawingId);

  // Models in the selected series
  const modelsInCurrentSeries = (currentDepartment?.models || []).filter((m) => {
    if (selectedSeriesId === 'general-series') {
      return !m.seriesId || !currentSeriesList.some((s) => s.id === m.seriesId);
    }
    return m.seriesId === selectedSeriesId;
  });

  // Filter models based on search query (for global search mode)
  const isSearching = searchQuery.trim().length > 0;
  const filteredModels = (currentDepartment?.models || []).filter((model) => {
    if (!isSearching) return true;
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

  const deptMeta: Record<DepartmentId, { num: string; label: string; sub: string }> = {
    SAS: { num: '1', label: 'SAS', sub: 'Actuators' },
    PTS: { num: '2', label: 'PTS', sub: 'Transmission' },
    OTS: { num: '3', label: 'OTS', sub: 'Tooling/Optics' },
  };

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
            {isAdmin ? (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> แอดมิน
              </span>
            ) : (
              <span
                className="text-[10px] font-medium text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded flex items-center gap-1"
                title="ผู้ใช้งานทั่วไป: ดูแบบได้อย่างเดียว ห้ามดาวน์โหลด"
              >
                <Eye className="w-2.5 h-2.5 text-amber-400" /> ดูได้อย่างเดียว
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4-Step Access Workflow Banner & Controls */}
      <div className="p-2.5 bg-slate-950 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            การเข้าใช้งานตามลำดับ (4 ขั้นตอน)
          </span>

          {/* View Mode Switch (4-Step vs Tree) */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setViewMode('stepper')}
              className={`px-2 py-0.5 rounded font-semibold transition ${
                viewMode === 'stepper'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="เข้าใช้งานทีละขั้นตอน (1.แผนก → 2.ซีรี่ส์ → 3.รหัส → 4.ความยาว)"
            >
              4 ขั้นตอน
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-2 py-0.5 rounded font-semibold transition ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="ดูผังโครงสร้างทั้งหมด (Tree View)"
            >
              ผังทั้งหมด
            </button>
          </div>
        </div>

        {/* 4-Step Progress Indicator Buttons */}
        <div className="grid grid-cols-4 gap-1">
          {/* Step 1: แผนก */}
          <button
            type="button"
            onClick={() => {
              setViewMode('stepper');
              setActiveStep(1);
            }}
            className={`p-1.5 rounded-lg border text-left transition flex flex-col ${
              activeStep === 1
                ? 'bg-blue-600/25 border-blue-500 text-white ring-1 ring-blue-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="text-[9px] font-bold text-blue-400">1. แผนก</span>
            <span className="text-[11px] font-black truncate text-white mt-0.5">
              {selectedDepartmentId}
            </span>
          </button>

          {/* Step 2: ซีรี่ส์ */}
          <button
            type="button"
            onClick={() => {
              setViewMode('stepper');
              setActiveStep(2);
            }}
            className={`p-1.5 rounded-lg border text-left transition flex flex-col ${
              activeStep === 2
                ? 'bg-blue-600/25 border-blue-500 text-white ring-1 ring-blue-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="text-[9px] font-bold text-indigo-400">2. ซีรี่ส์</span>
            <span className="text-[11px] font-bold truncate text-slate-200 mt-0.5">
              {currentSeries ? currentSeries.code : 'เลือก...'}
            </span>
          </button>

          {/* Step 3: เลือกรหัส */}
          <button
            type="button"
            onClick={() => {
              if (selectedSeriesId || currentSeriesList.length === 0) {
                setViewMode('stepper');
                setActiveStep(3);
              } else {
                setActiveStep(2);
              }
            }}
            className={`p-1.5 rounded-lg border text-left transition flex flex-col ${
              activeStep === 3
                ? 'bg-blue-600/25 border-blue-500 text-white ring-1 ring-blue-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="text-[9px] font-bold text-amber-400">3. รหัส</span>
            <span className="text-[11px] font-bold truncate text-slate-200 mt-0.5">
              {currentModel ? currentModel.code : 'เลือก...'}
            </span>
          </button>

          {/* Step 4: เลือกความยาว */}
          <button
            type="button"
            onClick={() => {
              if (selectedModelId) {
                setViewMode('stepper');
                setActiveStep(4);
              } else if (selectedSeriesId) {
                setActiveStep(3);
              } else {
                setActiveStep(2);
              }
            }}
            className={`p-1.5 rounded-lg border text-left transition flex flex-col ${
              activeStep === 4
                ? 'bg-blue-600/25 border-blue-500 text-white ring-1 ring-blue-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="text-[9px] font-bold text-emerald-400">4. ความยาว</span>
            <span className="text-[11px] font-bold truncate text-slate-200 mt-0.5">
              {currentDrawing?.lengthLabel || (currentModel ? 'เลือก...' : '-')}
            </span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-slate-800 space-y-2 bg-slate-900">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-drawings-input"
            type="text"
            placeholder="ค้นหาด่วน: พิมพ์ชื่อรุ่น, ความยาว (เช่น 300mm), Part No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Admin Shortcuts */}
        {isAdmin && (
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              id="admin-add-model-btn"
              type="button"
              onClick={() => onOpenAddModel(selectedDepartmentId, selectedSeriesId || undefined)}
              className="py-1.5 px-2 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-3 h-3" />
              <span>+ เพิ่มรุ่น</span>
            </button>

            <button
              id="admin-add-series-btn"
              type="button"
              onClick={() =>
                onOpenAddSeries
                  ? onOpenAddSeries(selectedDepartmentId)
                  : onOpenManageSeries && onOpenManageSeries(selectedDepartmentId)
              }
              className="py-1.5 px-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition"
            >
              <FolderPlus className="w-3 h-3" />
              <span>+ เพิ่มซีรี่ส์</span>
            </button>
          </div>
        )}
      </div>

      {/* MAIN CATALOG BODY */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* CASE A: USER IS SEARCHING */}
        {isSearching ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>ผลการค้นหา "{searchQuery}" ({filteredModels.length} รุ่น)</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-blue-400 hover:underline text-[11px]"
              >
                กลับไปที่ 4 ขั้นตอน
              </button>
            </div>

            {filteredModels.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>ไม่พบรายการที่ตรงกับคำค้นหา</p>
              </div>
            ) : (
              filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isExpanded={true}
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
        ) : viewMode === 'tree' ? (
          /* CASE B: FULL TREE VIEW */
          <div className="space-y-3">
            {/* Department Selector in Tree Mode */}
            <div className="grid grid-cols-3 gap-1.5 pb-1">
              {(['SAS', 'PTS', 'OTS'] as DepartmentId[]).map((deptId) => {
                const isSelected = selectedDepartmentId === deptId;
                const dept = departments.find((d) => d.id === deptId);
                const info = deptMeta[deptId];
                return (
                  <button
                    key={deptId}
                    type="button"
                    onClick={() => onSelectDepartment(deptId)}
                    className={`py-2 px-1 rounded-xl text-center border transition ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-black">{info.num}. {info.label}</div>
                    <span className="text-[9px] opacity-75">{dept?.models?.length || 0} รุ่น</span>
                  </button>
                );
              })}
            </div>

            {/* Tree of Series and Models */}
            {currentSeriesList.map((series) => {
              const seriesModels = (currentDepartment?.models || []).filter(
                (m) => m.seriesId === series.id
              );
              const isSeriesExpanded = expandedSeries[series.id] ?? true;

              return (
                <div
                  key={series.id}
                  className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 overflow-hidden shadow-lg"
                >
                  <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleSeriesExpand(series.id)}
                      className="flex-1 text-left flex items-center gap-2 min-w-0"
                    >
                      <FolderTree className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-black text-indigo-300 font-mono">
                          {series.code}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{series.name}</h4>
                      </div>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onOpenAddModel(selectedDepartmentId, series.id)}
                        className="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-200 text-[10px] font-bold"
                      >
                        + เพิ่มรุ่น
                      </button>
                    )}
                  </div>

                  {isSeriesExpanded && (
                    <div className="p-2 space-y-2 bg-slate-950/50">
                      {seriesModels.map((model) => (
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
              );
            })}
          </div>
        ) : (
          /* CASE C: 4-STEP GUIDED FLOW */
          <div className="space-y-3">
            {/* ---------------- STEP 1: SELECT DEPARTMENT ---------------- */}
            {activeStep === 1 && (
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs">
                  <span className="font-black text-blue-400 block mb-0.5">
                    ขั้นตอนที่ 1 จาก 4: เลือกแผนก
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    เลือกแผนกปฏิบัติการที่ต้องการดูแบบดรออิ้ง (SAS, PTS หรือ OTS)
                  </p>
                </div>

                <div className="space-y-2">
                  {(['SAS', 'PTS', 'OTS'] as DepartmentId[]).map((deptId) => {
                    const isSelected = selectedDepartmentId === deptId;
                    const dept = departments.find((d) => d.id === deptId);
                    const info = deptMeta[deptId];
                    const modelCount = dept?.models?.length || 0;
                    const seriesCount = dept?.series?.length || 0;

                    return (
                      <button
                        key={deptId}
                        type="button"
                        onClick={() => {
                          onSelectDepartment(deptId);
                          setSelectedSeriesId(null);
                          setSelectedModelId(null);
                          setActiveStep(2);
                        }}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                            : 'bg-slate-850 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-400'
                                : 'bg-slate-800 text-blue-400 border-slate-700 group-hover:border-blue-500/50'
                            }`}
                          >
                            {info.num}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">{info.label}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                                {info.sub}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {dept?.description || 'ฝ่ายผลิตและประกอบ'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                              <span>📁 {seriesCount} ซีรี่ส์</span>
                              <span>•</span>
                              <span>📦 {modelCount} รหัสรุ่น</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition">
                          <span>เลือก</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------- STEP 2: SELECT SERIES ---------------- */}
            {activeStep === 2 && (
              <div className="space-y-2.5">
                {/* Header & Back Button */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                    <span>กลับไปขั้นตอน 1 (แผนก)</span>
                  </button>
                  <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded">
                    แผนก: {selectedDepartmentId}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
                  <span className="font-black text-indigo-400 block mb-0.5">
                    ขั้นตอนที่ 2 จาก 4: เลือกซีรี่ส์
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    เลือกหมวดหมู่ซีรี่ส์ในแผนก {selectedDepartmentId}
                  </p>
                </div>

                <div className="space-y-2">
                  {currentSeriesList.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-slate-800/40 rounded-2xl border border-slate-800">
                      <FolderTree className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">
                        ยังไม่มีซีรี่ส์ในแผนก {selectedDepartmentId}
                      </p>
                      {isAdmin && onOpenAddSeries && (
                        <button
                          type="button"
                          onClick={() => onOpenAddSeries(selectedDepartmentId)}
                          className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span>+ เพิ่มซีรี่ส์แรก</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    currentSeriesList.map((series) => {
                      const isSelected = selectedSeriesId === series.id;
                      const modelsInThis = (currentDepartment?.models || []).filter(
                        (m) => m.seriesId === series.id
                      );

                      return (
                        <button
                          key={series.id}
                          type="button"
                          onClick={() => {
                            setSelectedSeriesId(series.id);
                            setSelectedModelId(null);
                            setActiveStep(3);
                          }}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                              : 'bg-slate-850 border-slate-700/80 hover:bg-slate-800 hover:border-indigo-500/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-400'
                                  : 'bg-slate-800 text-indigo-400 border-slate-700 group-hover:border-indigo-500/50'
                              }`}
                            >
                              <FolderTree className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black font-mono text-indigo-300">
                                  {series.code}
                                </span>
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                                  {modelsInThis.length} รุ่น
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white truncate mt-0.5">
                                {series.name}
                              </h4>
                              {series.description && (
                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                  {series.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition">
                            <span>เลือกรหัส</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </button>
                      );
                    })
                  )}

                  {/* General / Unassigned models card if any */}
                  {(() => {
                    const unassigned = (currentDepartment?.models || []).filter(
                      (m) => !m.seriesId || !currentSeriesList.some((s) => s.id === m.seriesId)
                    );
                    if (unassigned.length === 0) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeriesId('general-series');
                          setSelectedModelId(null);
                          setActiveStep(3);
                        }}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group ${
                          selectedSeriesId === 'general-series'
                            ? 'bg-slate-800 border-slate-600 ring-1 ring-slate-500'
                            : 'bg-slate-850 border-slate-700/80 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center shrink-0">
                            <Box className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-slate-300">📦 รุ่นทั่วไป</span>
                            <h4 className="text-xs text-slate-400 truncate mt-0.5">
                              รุ่นที่ไม่ได้ระบุซีรี่ส์เฉพาะ ({unassigned.length} รุ่น)
                            </h4>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ---------------- STEP 3: SELECT MODEL CODE ---------------- */}
            {activeStep === 3 && (
              <div className="space-y-2.5">
                {/* Header & Back Button */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
                    <span>กลับไปขั้นตอน 2 (ซีรี่ส์)</span>
                  </button>
                  <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded truncate max-w-[150px]">
                    ซีรี่ส์: {currentSeries ? currentSeries.code : 'ทั่วไป'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs">
                  <span className="font-black text-amber-400 block mb-0.5">
                    ขั้นตอนที่ 3 จาก 4: เลือกรหัสรุ่น (Model Code)
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    เลือกรหัสผลิตภัณฑ์ที่ต้องการ เช่น SAS-M50 หรือ PTS-G40
                  </p>
                </div>

                <div className="space-y-2">
                  {modelsInCurrentSeries.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-slate-800/40 rounded-2xl border border-slate-800">
                      <Box className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">
                        ยังไม่มีรุ่นในซีรี่ส์นี้
                      </p>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenAddModel(
                              selectedDepartmentId,
                              selectedSeriesId === 'general-series' ? undefined : selectedSeriesId || undefined
                            )
                          }
                          className="mt-3 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ เพิ่มรหัสรุ่นในซีรี่ส์นี้</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    modelsInCurrentSeries.map((model) => {
                      const isSelected = selectedModelId === model.id;
                      const lengthCount = model.lengths.length;

                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            setSelectedModelId(model.id);
                            setActiveStep(4);
                          }}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'bg-amber-600/20 border-amber-500 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10'
                              : 'bg-slate-850 border-slate-700/80 hover:bg-slate-800 hover:border-amber-500/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                                  : 'bg-slate-800 text-amber-400 border-slate-700 group-hover:border-amber-500/50'
                              }`}
                            >
                              <Box className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black font-mono text-white">
                                  {model.code}
                                </span>
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                                  {model.category}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-300 truncate mt-0.5">
                                {model.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-amber-400/90 font-mono">
                                <Ruler className="w-3 h-3 text-amber-400" />
                                <span>{lengthCount} ขนาดความยาว</span>
                                {model.lengths.length > 0 && (
                                  <span className="text-slate-400">
                                    ({model.lengths.map((l) => `${l.lengthMm}mm`).join(', ')})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition">
                            <span>เลือกความยาว</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ---------------- STEP 4: SELECT LENGTH ---------------- */}
            {activeStep === 4 && (
              <div className="space-y-2.5">
                {/* Header & Back Button */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>กลับไปขั้นตอน 3 (รหัสรุ่น)</span>
                  </button>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded truncate max-w-[150px]">
                    รุ่น: {currentModel ? currentModel.code : 'เลือก...'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-emerald-400 block mb-0.5">
                        ขั้นตอนที่ 4 จาก 4: เลือกความยาว (Length)
                      </span>
                      <p className="text-slate-300 text-[11px]">
                        คลิกเลือกขนาดความยาวเพื่อแสดงแบบดรออิ้งและไฟล์แนบ
                      </p>
                    </div>
                    {isAdmin && currentModel && (
                      <button
                        type="button"
                        onClick={() => onOpenAddLength(currentModel)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm"
                        title="เพิ่มขนาดความยาวใหม่ในรุ่นนี้"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ เพิ่มความยาว</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Length Cards List */}
                {currentModel ? (
                  <div className="space-y-2">
                    {currentModel.lengths.length === 0 ? (
                      <div className="text-center py-6 px-4 bg-slate-800/40 rounded-2xl border border-slate-800">
                        <Ruler className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-semibold">
                          ยังไม่มีขนาดความยาวในรุ่น {currentModel.code}
                        </p>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onOpenAddLength(currentModel)}
                            className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ เพิ่มขนาดความยาวแรก</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      currentModel.lengths.map((len) => {
                        const matchedDrawing = drawings.find((d) => d.id === len.drawingId);
                        const isDrawingActive = matchedDrawing?.id === selectedDrawingId;
                        const attachedFilesCount = matchedDrawing?.attachedFiles?.length || 0;

                        return (
                          <div
                            key={len.id}
                            className={`p-3 rounded-2xl border transition-all ${
                              isDrawingActive
                                ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/10'
                                : 'bg-slate-850 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (matchedDrawing) onSelectDrawing(matchedDrawing);
                                }}
                                className="flex-1 text-left min-w-0"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-white font-mono">
                                    {len.lengthLabel || `${len.lengthMm} mm`}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-400 font-mono">
                                    ({len.lengthMm} mm)
                                  </span>
                                  {isDrawingActive && (
                                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500 text-white font-black animate-pulse flex items-center gap-1">
                                      <Check className="w-2.5 h-2.5" /> กำลังดูอยู่
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-300 font-mono mt-1">
                                  <span>Part No: {len.partNumber}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  <span>DWG Code: {len.drawingCode}</span>
                                </div>

                                {/* Badges: Attached files, Revision */}
                                <div className="flex items-center gap-2 mt-2">
                                  {matchedDrawing?.revision && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold">
                                      {matchedDrawing.revision}
                                    </span>
                                  )}
                                  {matchedDrawing?.status && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                      {matchedDrawing.status}
                                    </span>
                                  )}
                                  {attachedFilesCount > 0 && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
                                      <Paperclip className="w-2.5 h-2.5" />
                                      <span>ไฟล์แนบ {attachedFilesCount}</span>
                                    </span>
                                  )}
                                </div>
                              </button>

                              {/* Action Buttons */}
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (matchedDrawing) onSelectDrawing(matchedDrawing);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                    isDrawingActive
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                  }`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{isDrawingActive ? 'กำลังแสดง' : 'ดูแบบนี้'}</span>
                                </button>

                                {isAdmin && (
                                  <div className="flex items-center gap-1">
                                    {matchedDrawing && onOpenEditJob && (
                                      <button
                                        type="button"
                                        onClick={() => onOpenEditJob(matchedDrawing)}
                                        className="p-1 rounded-lg text-amber-400 hover:bg-amber-500/15 border border-amber-500/30 text-[10px]"
                                        title="แก้ไขข้อมูลชื่องาน (Edit Job Name)"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    )}
                                    {onDeleteLength && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onDeleteLength(
                                            currentModel.id,
                                            len.id,
                                            len.lengthLabel || `${len.lengthMm}mm`
                                          )
                                        }
                                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 text-[10px]"
                                        title="ลบความยาวนี้"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-slate-800/40 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-400">กรุณากลับไปเลือกรหัสรุ่นในขั้นตอนที่ 3</p>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="mt-2 text-xs font-bold text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> กลับไปเลือกรหัสรุ่น
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-300">
            {currentDepartment?.id}: {currentDepartment?.name}
          </span>
          <p className="text-[10px] text-slate-500 truncate max-w-[240px]">
            {currentDepartment?.description}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 block">แบบทั้งหมด</span>
          <span className="font-mono-num font-bold text-slate-300">
            {drawings.filter((d) => d.department === selectedDepartmentId).length} รายการ
          </span>
        </div>
      </div>
    </div>
  );
};
