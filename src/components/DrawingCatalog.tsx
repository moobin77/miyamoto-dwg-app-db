import React from 'react';
import { Department, Drawing, DepartmentId } from '../types';
import { Folder, FileText, ChevronRight, Hash, Layers } from 'lucide-react';

interface DrawingCatalogProps {
  departments: Department[];
  drawings: Drawing[];
  selectedDrawingId: string | null;
  onSelectDrawing: (drawing: Drawing) => void;
  selectedDepartmentId: DepartmentId;
  onSelectDepartment: (deptId: DepartmentId) => void;
  isAdmin: boolean;
  onOpenAddModel?: (deptId: DepartmentId, seriesId?: string) => void;
  onOpenAddLength?: (modelId: string) => void;
  onDeleteModel?: (modelId: string, modelCode: string) => void;
  onDeleteLength?: (drawingId: string, lengthLabel: string) => void;
  onOpenEditJob?: (drawing: Drawing) => void;
  onOpenEditModel?: (modelId: string, currentCode: string, currentName: string) => void;
  onOpenAddFile?: () => void;
  onOpenAddFileGuide?: () => void;
  onOpenManageSeries?: (deptId: DepartmentId) => void;
  onOpenAddSeries?: (deptId: DepartmentId) => void;
  onOpenEditSeries?: () => void;
  onDeleteSeries?: (seriesId: string, seriesName: string) => void;
  operatorName?: string;
  stationLine?: string;
  machineId?: string;
}

export function DrawingCatalog({
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
  machineId
}: DrawingCatalogProps) {
  const currentDept = departments.find(d => d.id === selectedDepartmentId) || departments[0];

  
  
  return (
    <div className="bg-[#1a1d23] border-r border-[rgba(226,232,240,0.1)] flex flex-col h-full overflow-hidden w-full select-none shrink-0">
      <div className="p-5 border-b border-[rgba(226,232,240,0.1)]">
        <p className="meta-label mb-2 inline-block">Select Department</p>
        <div className="grid grid-cols-2 gap-[1px] bg-[rgba(226,232,240,0.1)] my-2">
          {departments.map(dept => {
            const isSelected = dept.id === selectedDepartmentId;
            return (
              <button 
                key={dept.id} 
                className={`p-3 border-none text-[0.7rem] font-semibold cursor-pointer text-center transition-colors ${
                  isSelected ? 'bg-[#3b82f6] text-white' : 'bg-[#1a1d23] text-[rgba(226,232,240,0.5)] hover:bg-[rgba(255,255,255,0.02)]'
                }`}
                onClick={() => onSelectDepartment(dept.id)}
              >
                {dept.id} [{dept.models?.length || 0}]
              </button>
            );
          })}
        </div>
        {isAdmin && onOpenManageSeries && (
          <button 
            className="btn btn-primary w-full mt-2" 
            onClick={() => onOpenManageSeries(selectedDepartmentId)}
          >
            + Add Series
          </button>
        )}
      </div>

      <div className="p-3 bg-[rgba(0,0,0,0.2)]">
        <input 
          type="text" 
          placeholder="Search code, title or job..."
          className="w-full bg-transparent border border-[rgba(226,232,240,0.1)] text-[#e2e8f0] p-2 text-xs font-inherit rounded-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
        {currentDept?.series?.map(series => {
          const seriesModels = currentDept.models?.filter(m => m.seriesId === series.id) || [];
          const modelIds = seriesModels.map(m => m.id);
          const seriesDrawings = drawings.filter(d => modelIds.includes(d.modelId));
          
          return (
            <div key={series.id} className="mb-4">
              <div className="text-[0.65rem] text-[rgba(226,232,240,0.5)] mb-2 font-extrabold uppercase tracking-widest">{series.name}</div>
              
              {seriesDrawings.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 italic bg-slate-800/30 rounded border border-slate-700/50 text-center">
                  ยังไม่มีโมเดลในซีรีย์นี้
                  {isAdmin && onOpenAddModel && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddModel(currentDept.id, series.id);
                      }}
                      className="mt-2 text-indigo-400 hover:text-indigo-300 block w-full py-1.5 bg-indigo-500/10 rounded border border-indigo-500/20 font-medium not-italic transition-colors"
                    >
                      + เพิ่มโมเดลชิ้นงาน
                    </button>
                  )}
                </div>
              ) : (
              <div className="space-y-2">
                {seriesDrawings.map(dwg => {
                  const isSelected = selectedDrawingId === dwg.id;
                  return (
                    <div 
                      key={dwg.id} 
                      className={`p-3 border-l-2 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-[#3b82f6] bg-[rgba(59,130,246,0.1)]' 
                          : 'border-transparent bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)]'
                      }`}
                      onClick={() => onSelectDrawing(dwg)}
                    >
                      <span className="font-['JetBrains_Mono'] text-[0.85rem] block mb-0.5 font-bold">{dwg.code}</span>
                      <span className="text-[0.7rem] text-[rgba(226,232,240,0.5)] truncate block">{dwg.name || dwg.lengthLabel}</span>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          );
        })}
        {/* Fallback models without series */}
        {currentDept?.models?.filter(m => !m.seriesId).map(model => {
          const modelDrawings = drawings.filter(d => d.modelId === model.id);
          if (modelDrawings.length === 0) return null;
          return (
             <div key={model.id} className="mb-4">
              <div className="text-[0.65rem] text-[rgba(226,232,240,0.5)] mb-2 font-extrabold uppercase tracking-widest">{model.name}</div>
              
              <div className="space-y-2">
                {modelDrawings.map(dwg => {
                  const isSelected = selectedDrawingId === dwg.id;
                  return (
                    <div 
                      key={dwg.id} 
                      className={`p-3 border-l-2 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-[#3b82f6] bg-[rgba(59,130,246,0.1)]' 
                          : 'border-transparent bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)]'
                      }`}
                      onClick={() => onSelectDrawing(dwg)}
                    >
                      <span className="font-['JetBrains_Mono'] text-[0.85rem] block mb-0.5 font-bold">{dwg.code}</span>
                      <span className="text-[0.7rem] text-[rgba(226,232,240,0.5)] truncate block">{dwg.name || dwg.lengthLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
