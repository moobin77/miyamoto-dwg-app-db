const fs = require('fs');
let code = fs.readFileSync('src/components/DrawingViewer.tsx', 'utf8');
console.log(code.includes("drawing.attachedFiles[0].fileUrl"));
