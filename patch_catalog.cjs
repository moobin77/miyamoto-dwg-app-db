const fs = require('fs');
let code = fs.readFileSync('src/components/DrawingCatalog.tsx', 'utf8');

const target = `          if (seriesDrawings.length === 0) return null;
          
          return (
            <div key={series.id} className="mb-4">
              <div className="text-[0.65rem] text-[rgba(226,232,240,0.5)] mb-2 font-extrabold uppercase tracking-widest">{series.name}</div>
              
              <div className="space-y-2">
                {seriesDrawings.map(dwg => {`;

const replacement = `          return (
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
                {seriesDrawings.map(dwg => {`;

code = code.replace(target, replacement);

const targetEnd = `                })}
              </div>
            </div>
          );
        })}`;

const replacementEnd = `                })}
              </div>
              )}
            </div>
          );
        })}`;

code = code.replace(targetEnd, replacementEnd);

fs.writeFileSync('src/components/DrawingCatalog.tsx', code);
console.log("Patched DrawingCatalog.tsx");
