const fs = require('fs');
let code = fs.readFileSync('src/components/DrawingCatalog.tsx', 'utf8');

// Replace wrapper
code = code.replace(
  '    <div\n      id="drawing-catalog-sidebar"\n      className="w-full sm:w-64 md:w-72 lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none shrink-0"\n    >',
  '    <aside className="pane-hierarchy" id="drawing-catalog-sidebar">'
);

// We need to change the inner HTML to match the provided layout:
/*
            <div class="pane-title"><span>Departments</span> <span>3 ACTIVE</span></div>
            <div class="dept-grid">
                <div class="dept-card selected"><h5>SAS</h5><span>5 Series</span></div>
                ...
            </div>
            <div class="pane-title"><span>Document Catalog</span></div>
            <div class="list-container">
                <div class="list-item">...</div>
            </div>
*/

fs.writeFileSync('src/components/DrawingCatalog.tsx', code);
console.log("Updated DrawingCatalog.tsx partially");
