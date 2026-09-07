import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Edit3,
  Paperclip,
  Folder,
  FolderPlus,
  FileText,
  Layers,
  X,
  Sparkles,
} from 'lucide-react';
import {
  DepartmentId,
  DepartmentInfo,
  ProductModel,
  ProductSeries,
  Drawing,
} from '../types';

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
  operatorName?: string;
  stationLine?: string;
  machineId?: string;
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
  onOpenAddLength: _onOpenAddLength,
  onDeleteModel,
  onOpenEditModel: _onOpenEditModel,
  onOpenEditJob,
  onOpenAddFile,
  onDeleteLength,
  onOpenAddSeries,
  onOpenManageSeries: _onOpenManageSeries,
  onOpenEditSeries,
  onDeleteSeries,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Track expanded/collapsed state for each series
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  const toggleSeriesExpand = (seriesId: string) => {
    setExpandedSeries((prev) => ({
      ...prev,
      [seriesId]: prev[seriesId] === undefined ? false : !prev[seriesId],
    }));
  };

  const currentDepartment =
    departments.find((d) => d.id === selectedDepartmentId) || departments[0] || null;

  // Map of modelId to seriesId for quick lookup
  const modelToSeriesMap = useMemo(() => {
    const map = new Map<string, string>();
    if (currentDepartment) {
      for (const m of currentDepartment.models) {
        if (m.seriesId) {
          map.set(m.id, m.seriesId);
        }
      }
    }
    return map;
  }, [currentDepartment]);

  // Group drawings by series for the current department
  const seriesWithDrawings = useMemo(() => {
    if (!currentDepartment) return [];

    const seriesList = currentDepartment.series || [];
    const deptDrawings = drawings.filter(
      (d) => d.department === selectedDepartmentId || (!d.department && selectedDepartmentId === 'SAS')
    );

    const grouped: {
      series: ProductSeries;
      drawings: Drawing[];
    }[] = [];

    const matchedDrawingIds = new Set<string>();

    for (const s of seriesList) {
      const matched = deptDrawings.filter((d) => {
        // 1. Direct seriesId on drawing
        if (d.seriesId === s.id) return true;
        // 2. Through modelId mapping
        if (d.modelId && modelToSeriesMap.get(d.modelId) === s.id) return true;
        // 3. Match series code in drawing code/title
        if (s.code && (d.code?.includes(s.code) || d.title?.includes(s.code))) return true;
        return false;
      });

      matched.forEach((d) => matchedDrawingIds.add(d.id));

      grouped.push({
        series: s,
        drawings: matched,
      });
    }

    // Any remaining drawings in this department that don't belong to a defined series
    const unassignedDrawings = deptDrawings.filter((d) => !matchedDrawingIds.has(d.id));
    if (unassignedDrawings.length > 0) {
      grouped.push({
        series: {
          id: 'general-series',
          departmentId: selectedDepartmentId,
          code: 'GENERAL',
          name: 'ซีรี่ส์ทั่วไป (General Series)',
          description: 'แบบดรออิ้งและรุ่นมาตรฐานทั่วไป',
          createdAt: '2025-01-01',
        },
        drawings: unassignedDrawings,
      });
    }

    return grouped;
  }, [currentDepartment, drawings, selectedDepartmentId, modelToSeriesMap]);

  // Filtered series and drawings when searching
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return seriesWithDrawings;

    return seriesWithDrawings
      .map((g) => {
        const seriesMatches =
          g.series.name.toLowerCase().includes(q) || g.series.code.toLowerCase().includes(q);

        const matchingDrawings = g.drawings.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.code.toLowerCase().includes(q) ||
            (d.partNumber && d.partNumber.toLowerCase().includes(q)) ||
            (d.lengthLabel && d.lengthLabel.toLowerCase().includes(q)) ||
            (d.modelName && d.modelName.toLowerCase().includes(q))
        );

        if (seriesMatches) {
          return g; // keep all drawings if series itself matched
        }

        return {
          ...g,
          drawings: matchingDrawings,
        };
      })
      .filter((g) => g.drawings.length > 0 || g.series.name.toLowerCase().includes(q));
  }, [seriesWithDrawings, searchQuery]);

  // Department definitions
  const departmentTabs: { id: DepartmentId; label: string; sub: string }[] = [
    { id: 'SAS', label: 'SAS', sub: 'ระบบกันสะเทือน & แอคทูเอเตอร์' },
    { id: 'PTS', label: 'PTS', sub: 'เพลาขับ & ระบบส่งกำลัง' },
    { id: 'OTS', label: 'OTS', sub: 'เครื่องมือกล & เลนส์ออปติก' },
    { id: 'BOM', label: 'BOM', sub: 'รายการชิ้นส่วน (Bill of Materials)' },
  ];

  // Count drawings in each department
  const getDeptDrawingsCount = (deptId: DepartmentId) => {
    return drawings.filter((d) => d.department === deptId).length;
  };

  return (
    <div
      id="drawing-catalog-sidebar"
      className="w-full sm:w-64 md:w-72 lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none shrink-0"
    >
      {/* 1. DEPARTMENT SELECTOR (แผนก) - Clean Segmented Tabs */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>เลือกแผนก (Department)</span>
          </span>
          {isAdmin && onOpenAddSeries && (
            <button
              type="button"
              onClick={() => onOpenAddSeries(selectedDepartmentId)}
              className="text-[11px] font-bold px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1 shadow-sm"
              title="เพิ่มซีรีส์ใหม่เข้าแผนกนี้"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ เพิ่มซีรีส์</span>
            </button>
          )}
        </div>

        {/* 3 Department Pills */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {departmentTabs.map((dept) => {
            const isSelected = selectedDepartmentId === dept.id;
            const count = getDeptDrawingsCount(dept.id);
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => {
                  onSelectDepartment(dept.id);
                }}
                className={`py-2 px-2 rounded-lg text-center transition flex flex-col items-center justify-center relative ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black tracking-wide font-tech">{dept.label}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-blue-900 text-blue-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <span className="text-[9px] truncate max-w-full opacity-80 leading-tight mt-0.5">
                  {dept.id === 'SAS' ? 'Actuator' : dept.id === 'PTS' ? 'Turning' : dept.id === 'OTS' ? 'Optics' : 'Materials'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SEARCH BAR (ค้นหา) */}
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/90 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาซีรี่ส์, รหัสแบบ หรือชื่องาน..."
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. SERIES & DRAWINGS LIST (ซีรี่ย์และดรออิ้ง) */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-2">
        {filteredGroups.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
            <Folder className="w-8 h-8 text-slate-600 stroke-[1.5]" />
            <p className="font-medium text-slate-400">
              {searchQuery ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ยังไม่มีซีรีส์ในแผนกนี้'}
            </p>
            {isAdmin && onOpenAddSeries && (
              <button
                type="button"
                onClick={() => onOpenAddSeries(selectedDepartmentId)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ เพิ่มซีรีส์ใหม่</span>
              </button>
            )}
          </div>
        ) : (
          filteredGroups.map((group) => {
            const series = group.series;
            const isGeneral = series.id === 'general-series';
            // Default expanded, or respect user toggle
            const isExpanded = expandedSeries[series.id] !== false;

            return (
              <div
                key={series.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-sm transition"
              >
                {/* Series Header Banner */}
                <div
                  className="px-3 py-2.5 bg-slate-850/90 hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer transition select-none"
                  onClick={() => toggleSeriesExpand(series.id)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 hover:text-white transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                    <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/25 shrink-0">
                      <Folder className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate font-tech">
                          {series.name}
                        </span>
                        {series.code && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-blue-300 font-mono font-bold border border-slate-700 shrink-0">
                            {series.code}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {group.drawings.length} แบบดรออิ้ง
                      </span>
                    </div>
                  </div>

                  {/* Series Action Buttons */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isAdmin && !isGeneral && (
                      <>
                        {onOpenAddModel && (
                          <button
                            type="button"
                            onClick={() => onOpenAddModel(selectedDepartmentId, series.id)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition"
                            title="เพิ่มแบบดรออิ้งหรือรุ่นเข้าซีรีส์นี้"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                        {onOpenEditSeries && (
                          <button
                            type="button"
                            onClick={() => onOpenEditSeries(series)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                            title="แก้ไขชื่อซีรีส์และรหัส"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteSeries && (
                          <button
                            type="button"
                            onClick={() => onDeleteSeries(series)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition"
                            title="ลบซีรีส์นี้"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Drawings List inside this Series */}
                {isExpanded && (
                  <div className="p-1.5 space-y-1 bg-slate-950/40 border-t border-slate-850">
                    {group.drawings.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 text-[11px]">
                        ยังไม่มีแบบดรออิ้งในซีรีส์นี้
                        {isAdmin && onOpenAddModel && (
                          <button
                            type="button"
                            onClick={() => onOpenAddModel(selectedDepartmentId, series.id)}
                            className="mt-1.5 mx-auto block text-xs font-semibold text-blue-400 hover:underline"
                          >
                            + เพิ่มแบบดรออิ้งเข้าซีรีส์นี้
                          </button>
                        )}
                      </div>
                    ) : (
                      group.drawings.map((drawing) => {
                        const isSelected = drawing.id === selectedDrawingId;

                        return (
                          <div
                            key={drawing.id}
                            onClick={() => onSelectDrawing(drawing)}
                            className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                              isSelected
                                ? 'bg-blue-600/15 border-blue-500/80 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500/40'
                                : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                  isSelected
                                    ? 'bg-blue-500 text-white border-blue-400'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white font-mono truncate">
                                    {drawing.code || drawing.partNumber}
                                  </span>
                                  {drawing.currentVersion && (
                                    <span
                                      className={`text-[9px] px-1 py-0.2 rounded font-bold font-mono shrink-0 ${
                                        isSelected
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      }`}
                                    >
                                      {drawing.currentVersion}
                                    </span>
                                  )}
                                  {drawing.attachedFiles && drawing.attachedFiles.length > 0 && (
                                    <span
                                      className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold shrink-0 flex items-center gap-0.5"
                                      title={`มีไฟล์แนบ ${drawing.attachedFiles.length} ไฟล์`}
                                    >
                                      <Paperclip className="w-2.5 h-2.5" />
                                      <span>{drawing.attachedFiles.length}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5">
                                  <span className="font-semibold text-slate-300 truncate">
                                    {drawing.title}
                                  </span>
                                  {(drawing.lengthLabel || drawing.lengthMm) && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-300/90 font-mono font-bold shrink-0">
                                        {drawing.lengthLabel || `L = ${drawing.lengthMm} mm`}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Admin Actions on Drawing */}
                            {isAdmin && (
                              <div
                                className="flex items-center gap-1 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {onOpenAddFile && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenAddFile(drawing)}
                                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition"
                                    title="แนบไฟล์ CAD/PDF เข้าแบบนี้"
                                  >
                                    <Paperclip className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onOpenEditJob && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenEditJob(drawing)}
                                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition"
                                    title="แก้ไขชื่อ, ความยาว, และรหัสแบบ"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {(onDeleteLength || onDeleteModel) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (drawing.modelId && onDeleteModel) {
                                        onDeleteModel(drawing.modelId, drawing.code);
                                      } else if (onDeleteLength && drawing.lengthVariantId) {
                                        onDeleteLength(
                                          drawing.modelId || '',
                                          drawing.lengthVariantId,
                                          drawing.lengthLabel || drawing.code
                                        );
                                      }
                                    }}
                                    className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                                    title="ลบแบบดรออิ้งนี้ออกจากระบบ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
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

      {/* 4. CLEAN MINIMAL FOOTER */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span>โครงสร้าง: แผนก &gt; ซีรี่ย์</span>
        </div>
        <span className="font-mono text-slate-500">
          ทั้งหมด {drawings.length} แบบ
        </span>
      </div>
    </div>
  );
};
