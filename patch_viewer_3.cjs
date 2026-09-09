const fs = require('fs');
let code = fs.readFileSync('src/components/DrawingViewer.tsx', 'utf8');

// Replace the TechnicalBlueprint fallback with an overlay that encourages uploading
const target = `<TechnicalBlueprint
              drawing={drawing}
              activeVersion={activeVersion}
              showDiff={false}
              theme={theme}
              selectedDimId={null}
            />`;

const replacement = `<TechnicalBlueprint
              drawing={drawing}
              activeVersion={activeVersion}
              showDiff={false}
              theme={theme}
              selectedDimId={null}
            />
            {(!drawing.attachedFiles || drawing.attachedFiles.length === 0) && isAdmin && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                <div className="bg-[#1a1d23] border border-slate-700 p-8 rounded-2xl text-center max-w-md shadow-2xl">
                  <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4 opacity-80" />
                  <h3 className="text-xl font-bold text-white mb-2">ยังไม่มีไฟล์งานจริง</h3>
                  <p className="text-slate-400 text-sm mb-6">คุณสามารถอัปโหลดไฟล์ PDF, รูปภาพ หรือแนบลิงก์ Google Drive เพื่อแสดงผลแทนที่แบบจำลองนี้ได้</p>
                  {onOpenAddFile && (
                    <button 
                      onClick={onOpenAddFile}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50"
                    >
                      <Upload className="w-5 h-5" />
                      อัปโหลดไฟล์งานจริงตอนนี้
                    </button>
                  )}
                </div>
              </div>
            )}`;

code = code.replace(target, replacement);

// Make the top button clearer too
code = code.replace(
  '<button className="btn btn-outline text-indigo-400 border-indigo-900/50 hover:bg-indigo-500/10" onClick={onOpenAddFile}>\n                  เพิ่มไฟล์แนบ\n                </button>',
  '<button className="btn btn-outline text-indigo-400 border-indigo-900/50 hover:bg-indigo-500/10 font-bold" onClick={onOpenAddFile}>\n                  <Upload className="w-4 h-4 mr-1" /> อัปโหลดไฟล์งานจริง\n                </button>'
);

fs.writeFileSync('src/components/DrawingViewer.tsx', code);
console.log("Patched DrawingViewer.tsx with big upload button");
