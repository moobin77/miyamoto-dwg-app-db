const fs = require('fs');

const code = `import React, { useState } from 'react';
import { Drawing, DrawingVersion, AttachedFile } from '../types';
import { TechnicalBlueprints } from './TechnicalBlueprints';

interface DrawingViewerProps {
  drawing: Drawing;
  activeVersion: DrawingVersion;
  onVersionChange: (v: DrawingVersion) => void;
  onOpenAuditTrail: () => void;
  onOpenDiffModal: () => void;
  onOpenNewRevision: () => void;
  onOpenExport: () => void;
  onAcknowledge: (drawingId: string, version: string, opName: string) => void;
  onUpdateInspection: (drawingId: string, inspectionItemNo: string, val: string) => void;
  isAcknowledgedByCurrentOp: boolean;
  theme: 'blueprint' | 'dark' | 'light';
  onToggleTheme: (theme: 'blueprint' | 'dark' | 'light') => void;
  isAdmin: boolean;
  onOpenEditJob?: () => void;
  onOpenAddFile?: () => void;
  onDeleteAttachedFile?: (file: AttachedFile) => void;
}

export function DrawingViewer({
  drawing,
  activeVersion,
  onVersionChange,
  onOpenAuditTrail,
  onOpenDiffModal,
  onOpenNewRevision,
  onOpenExport,
  onAcknowledge,
  onUpdateInspection,
  isAcknowledgedByCurrentOp,
  theme,
  onToggleTheme,
  isAdmin,
  onOpenEditJob,
  onOpenAddFile,
}: DrawingViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  return (
    <>
      <section className="pane-viewer">
          <div className="viewer-toolbar">
              <div style={{display:'flex', gap:'10px'}}>
                  <button className="btn" style={{padding:'4px 10px'}} onClick={() => onToggleTheme('blueprint')}>Blueprint</button>
                  <button className="btn" style={{padding:'4px 10px'}} onClick={() => onToggleTheme('dark')}>Dark Mode</button>
              </div>
              <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                  <button className="btn" style={{padding:'4px'}} onClick={handleZoomOut}>-</button>
                  <span style={{fontFamily:'Space Mono', fontSize:'11px'}}>{zoom}%</span>
                  <button className="btn" style={{padding:'4px'}} onClick={handleZoomIn}>+</button>
              </div>
          </div>
          <div className="dwg-canvas">
              <div className="blueprint-container" style={{ transform: \`scale(\${zoom / 100})\`, transformOrigin: 'center center' }}>
                  <TechnicalBlueprints
                    type={activeVersion.svgType || 'shaft'}
                    dimensions={activeVersion.criticalDimensions}
                    lengthLabel={drawing.lengthLabel}
                    theme={theme}
                  />
              </div>
          </div>
      </section>

      <aside className="pane-props">
          <div className="prop-section">
              <span className="prop-label">Description</span>
              <p className="prop-value">{drawing.name || drawing.lengthLabel || drawing.code}</p>
              
              <span className="prop-label">Engineering Change</span>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
                  <span className="prop-value" style={{color:'var(--accent)'}}>{activeVersion.ecoNumber || 'ECO-NONE'}</span>
                  <button className="btn" style={{padding:'2px 8px', fontSize:'9px'}} onClick={onOpenAuditTrail}>View Log</button>
              </div>

              <span className="prop-label">Production Line</span>
              <p className="prop-value">{drawing.department} - {drawing.department}</p>
              
              {drawing.versions && drawing.versions.length > 1 && (
                 <div style={{marginTop: '1rem'}}>
                    <span className="prop-label">Versions</span>
                    <div style={{display:'flex', gap:'4px', flexWrap:'wrap'}}>
                      {drawing.versions.map(v => (
                         <button 
                           key={v.version} 
                           className={v.version === activeVersion.version ? "btn btn-fill" : "btn"} 
                           style={{padding:'2px 6px', fontSize:'10px'}}
                           onClick={() => onVersionChange(v)}
                         >
                           {v.version}
                         </button>
                      ))}
                    </div>
                 </div>
              )}
          </div>

          <div className="prop-section" style={{background:'#f0f9ff', flex:1}}>
              <span className="prop-label" style={{color:'var(--accent)'}}>Review Status</span>
              <button 
                className={isAcknowledgedByCurrentOp ? "btn" : "btn btn-accent"} 
                style={{width:'100%', marginBottom:'1rem'}}
                onClick={() => onAcknowledge(drawing.id, activeVersion.version, 'OPERATOR')}
                disabled={isAcknowledgedByCurrentOp}
              >
                {isAcknowledgedByCurrentOp ? 'Acknowledge Signed' : \`ลงชื่อรับทราบแบบ (Rev \${activeVersion.version})\`}
              </button>
              
              {isAdmin && (
                <>
                  <span className="prop-label">Administrative Actions</span>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                      <button className="btn" onClick={onOpenEditJob}>Update Job</button>
                      <button className="btn" onClick={onOpenAddFile}>Edit Files</button>
                      <button className="btn" onClick={onOpenDiffModal}>Diff Tool</button>
                      <button className="btn" onClick={onOpenNewRevision}>New Rev</button>
                  </div>
                </>
              )}
          </div>
      </aside>
    </>
  );
}
\`

fs.writeFileSync('src/components/DrawingViewer.tsx', code);
console.log("Updated DrawingViewer.tsx");
