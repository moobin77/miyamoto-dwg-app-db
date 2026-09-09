const fs = require('fs');
let code = fs.readFileSync('src/components/DrawingViewer.tsx', 'utf8');

const target = `<TechnicalBlueprint
            drawing={drawing}
            activeVersion={activeVersion}
            showDiff={false}
            theme={theme}
            selectedDimId={null}
          />`;

const replacement = `
          {drawing.attachedFiles && drawing.attachedFiles.length > 0 ? (
            drawing.attachedFiles[0].fileType === 'PDF' ? (
              <iframe 
                src={drawing.attachedFiles[0].fileUrl || drawing.attachedFiles[0].dataUrl} 
                className="w-full h-full border-0 bg-white"
                title="PDF Viewer"
              />
            ) : drawing.attachedFiles[0].fileType === 'IMAGE' || drawing.attachedFiles[0].fileName.match(/\\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img 
                src={drawing.attachedFiles[0].fileUrl || drawing.attachedFiles[0].dataUrl} 
                alt="Drawing"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <FileDiff className="w-16 h-16 mb-4 opacity-50" />
                <p>ไฟล์ถูกแนบแล้ว ({drawing.attachedFiles[0].fileName})</p>
                <a href={drawing.attachedFiles[0].fileUrl || drawing.attachedFiles[0].dataUrl} target="_blank" rel="noreferrer" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
                  คลิกเพื่อเปิดไฟล์
                </a>
              </div>
            )
          ) : (
            <TechnicalBlueprint
              drawing={drawing}
              activeVersion={activeVersion}
              showDiff={false}
              theme={theme}
              selectedDimId={null}
            />
          )}
`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/DrawingViewer.tsx', code);
console.log("Patched DrawingViewer.tsx");
