const fs = require('fs');

const code = `import React from 'react';
import { Department, Drawing, DepartmentId } from '../types';

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
  onSelectDepartment
}: DrawingCatalogProps) {
  const currentDept = departments.find(d => d.id === selectedDepartmentId) || departments[0];

  return (
    <aside className="pane-hierarchy" id="drawing-catalog-sidebar">
      <div className="pane-title">
        <span>Departments</span>
        <span>{departments.length} ACTIVE</span>
      </div>
      <div className="dept-grid">
        {departments.map(dept => {
          const isSelected = dept.id === selectedDepartmentId;
          const seriesCount = dept.series?.length || 0;
          return (
            <div 
              key={dept.id} 
              className={\`dept-card \${isSelected ? 'selected' : ''}\`}
              onClick={() => onSelectDepartment(dept.id)}
            >
              <h5>{dept.label}</h5>
              <span>{seriesCount} Series</span>
            </div>
          );
        })}
      </div>
      
      <div className="pane-title"><span>Document Catalog</span></div>
      <div className="list-container">
        {currentDept?.series?.map(series => {
          // get drawings for this series
          const seriesModels = currentDept.models?.filter(m => m.seriesId === series.id) || [];
          const modelIds = seriesModels.map(m => m.id);
          const seriesDrawings = drawings.filter(d => modelIds.includes(d.modelId));
          
          if (seriesDrawings.length === 0) return null;
          
          return (
            <React.Fragment key={series.id}>
              {seriesDrawings.map(dwg => {
                const isSelected = selectedDrawingId === dwg.id;
                return (
                  <div 
                    key={dwg.id} 
                    className={\`list-item \${isSelected ? 'selected' : ''}\`}
                    onClick={() => onSelectDrawing(dwg)}
                  >
                    <span style={{fontSize:'10px', fontWeight:700, opacity:0.6}}>SERIES: {series.name}</span>
                    <span className="item-code">{dwg.code}</span>
                    <span className="item-title">{dwg.name || dwg.lengthLabel}</span>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
        {/* Fallback for models without series or when no series is defined */}
        {currentDept?.models?.filter(m => !m.seriesId).map(model => {
          const modelDrawings = drawings.filter(d => d.modelId === model.id);
          return modelDrawings.map(dwg => {
             const isSelected = selectedDrawingId === dwg.id;
             return (
              <div 
                key={dwg.id} 
                className={\`list-item \${isSelected ? 'selected' : ''}\`}
                onClick={() => onSelectDrawing(dwg)}
              >
                <span className="item-code">{dwg.code}</span>
                <span className="item-title">{dwg.name || dwg.lengthLabel}</span>
              </div>
             );
          })
        })}
      </div>
    </aside>
  );
}
\`

fs.writeFileSync('src/components/DrawingCatalog.tsx', code);
console.log("Updated DrawingCatalog.tsx");
