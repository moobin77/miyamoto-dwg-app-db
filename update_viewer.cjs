const fs = require('fs');
let code = fs.readFileSync('src/components/DrawingViewer.tsx', 'utf8');

const newViewer = `
  return (
    <div className="bg-[#0b0d11] relative flex flex-col h-full overflow-hidden">
      
      {/* Viewer Controls */}
      <div className="px-6 py-3 bg-[#1a1d23] border-b border-[rgba(226,232,240,0.1)] flex items-center justify-between z-10 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <span className="meta-label bg-[#3b82f6] text-white !border-none">{drawing.department}</span>
            <h2 className="font-['Syne'] text-lg font-bold tracking-tight text-white">{drawing.code}</h2>
            <span className="meta-label">Rev {activeVersion.version}</span>
          </div>
          <p className="text-[0.7rem] text-[rgba(226,232,240,0.5)] mt-1 font-medium">
            {drawing.name || drawing.lengthLabel} • ECO-{activeVersion.ecoNumber || 'N/A'} • {activeVersion.releaseDate?.substring(0, 10)}
          </p>
        </div>
        <div className="flex gap-2">
          {drawing.versions && drawing.versions.length > 1 && (
            <button className="btn btn-outline" onClick={onOpenDiffModal}>Diff Tool</button>
          )}
          <button className="btn btn-outline" onClick={onOpenAuditTrail}>History</button>
          
          <button 
            className={\`btn \${isAcknowledgedByCurrentOp ? 'bg-emerald-900/50 text-emerald-400 border-emerald-900' : 'btn-primary'}\`}
            onClick={() => onAcknowledge(drawing.id, activeVersion.version, 'OPERATOR')}
            disabled={isAcknowledgedByCurrentOp}
          >
            {isAcknowledgedByCurrentOp ? 'Acknowledged' : \`Sign Off Rev \${activeVersion.version}\`}
          </button>
        </div>
      </div>

      <div className="viewer-stage relative flex-1 flex items-center justify-center overflow-auto p-8">
        <div 
          className="transition-transform duration-200 origin-center relative w-full h-full min-w-[800px] min-h-[600px] flex items-center justify-center" 
          style={{ transform: \`scale(\${zoom / 100})\` }}
        >
          <TechnicalBlueprint
            drawing={drawing}
            activeVersion={activeVersion}
            showDiff={false}
            theme={theme}
            selectedDimId={null}
          />
        </div>
        
        {/* HUD floating tools */}
        <div className="absolute bottom-6 left-6 flex gap-[1px] bg-[rgba(226,232,240,0.1)] rounded overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-20">
          <button className="btn btn-outline !bg-[#1a1d23] !border-none !rounded-none" onClick={handleZoomOut}>[-]</button>
          <button className="btn btn-outline !bg-[#1a1d23] !border-none !rounded-none font-['JetBrains_Mono'] w-16" onClick={handleZoomReset}>{zoom}%</button>
          <button className="btn btn-outline !bg-[#1a1d23] !border-none !rounded-none" onClick={handleZoomIn}>[+]</button>
        </div>
        
        {/* Properties HUD */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
          <div className="bg-[#1a1d23] border border-[rgba(226,232,240,0.1)] rounded shadow-xl overflow-hidden w-64">
            <div className="p-3 border-b border-[rgba(226,232,240,0.1)]">
               <h3 className="text-xs font-bold uppercase tracking-wider text-[rgba(226,232,240,0.5)]">Revisions</h3>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {drawing.versions?.map((v) => (
                <button
                  key={v.version}
                  onClick={() => onVersionChange(v)}
                  className={\`w-full text-left p-3 border-b border-[rgba(226,232,240,0.05)] transition-colors \${
                    v.version === activeVersion.version ? 'bg-[rgba(59,130,246,0.1)]' : 'hover:bg-[rgba(255,255,255,0.02)]'
                  }\`}
                >
                  <div className="flex justify-between items-center">
                    <span className={\`font-bold font-['JetBrains_Mono'] text-sm \${v.version === activeVersion.version ? 'text-[#3b82f6]' : 'text-white'}\`}>Rev {v.version}</span>
                    <span className="text-[10px] text-[rgba(226,232,240,0.5)]">{v.releaseDate.substring(0, 10)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <button onClick={onOpenExport} className="btn btn-outline bg-[#1a1d23] shadow-lg w-full">
            Export PDF/DXF
          </button>
        </div>
      </div>
    </div>
  );
`;

code = code.replace(/return \(\s*<div className="flex-1 flex flex-col h-full overflow-hidden[^>]*>[\s\S]*?<\/div>\s*\);\s*}/m, newViewer + "\n}");

fs.writeFileSync('src/components/DrawingViewer.tsx', code);
