const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/{\/\* Drawing Catalog Sidebar \*\/}\n}/m, "{/* Drawing Catalog Sidebar */}");
fs.writeFileSync('src/App.tsx', code);
