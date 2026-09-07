const fs = require('fs');
let code = fs.readFileSync('src/components/DrawingViewer.tsx', 'utf8');

const target = `          <button className="btn btn-outline" onClick={onOpenAuditTrail}>History</button>`;
const replacement = `          <button className="btn btn-outline" onClick={onOpenAuditTrail}>History</button>
          
          {isAdmin && (
            <>
              {onOpenEditJob && (
                <button className="btn btn-outline text-amber-400 border-amber-900/50 hover:bg-amber-500/10" onClick={onOpenEditJob}>
                  แก้ไข
                </button>
              )}
              {onOpenAddFile && (
                <button className="btn btn-outline text-indigo-400 border-indigo-900/50 hover:bg-indigo-500/10" onClick={onOpenAddFile}>
                  เพิ่มไฟล์แนบ
                </button>
              )}
            </>
          )}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/DrawingViewer.tsx', code);
console.log("Fixed DrawingViewer.tsx");
