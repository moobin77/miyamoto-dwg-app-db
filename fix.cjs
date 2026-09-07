const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/{\/\* Drawing Catalog Sidebar \*\/}}/g, "{/* Drawing Catalog Sidebar */}");
code = code.replace(/<\/div>\s*<div className="h-8 bg-slate-900 border-t/m, "</main>\n      <div className=\"h-8 bg-slate-900 border-t");
fs.writeFileSync('src/App.tsx', code);
