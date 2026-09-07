const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace new portal header with old header
code = code.replace(
  /<header className="portal-header">[\s\S]*?<\/header>/,
  `<header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
            DT
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Chakra_Petch'] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Cloud Drawing Table</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Industrial Blueprint System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {activeDrawing && (
             <div className="hidden md:flex items-center gap-4 mr-4 bg-slate-950 py-1.5 px-3 rounded-lg border border-slate-800">
               <div className="flex flex-col">
                 <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Active Drawing</span>
                 <span className="text-sm font-mono text-cyan-400">{activeDrawing.code}</span>
               </div>
               <div className="w-px h-6 bg-slate-800"></div>
               <div className="flex flex-col">
                 <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Revision</span>
                 <span className="text-sm font-mono text-amber-400">{effectiveActiveVersion?.version || '-'}</span>
               </div>
               <div className="w-px h-6 bg-slate-800"></div>
               <div className="flex flex-col">
                 <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Status</span>
                 <span className={\`text-xs font-bold \${effectiveActiveVersion?.isApprovedForProduction ? 'text-emerald-400' : 'text-rose-400'}\`}>
                   {effectiveActiveVersion?.isApprovedForProduction ? 'APPROVED' : 'PENDING'}
                 </span>
               </div>
             </div>
          )}

          <div className="flex items-center gap-2">
            <button 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-bold transition-colors"
              onClick={handleLockScreen}
            >
              Lock Session
            </button>
            {isAdmin && (
              <button 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-bold transition-colors shadow-lg shadow-blue-500/20"
                onClick={() => setIsUserManagementOpen(true)}
              >
                Access Control
              </button>
            )}
          </div>
        </div>
      </header>`
);

code = code.replace(
  /<div className="workspace">/,
  `<div className="flex-1 flex overflow-hidden relative">`
);

fs.writeFileSync('src/App.tsx', code);
