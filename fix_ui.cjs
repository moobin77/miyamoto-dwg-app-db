const fs = require('fs');

// 1. Fix App.tsx isLocked initial state
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/const \[isLocked, setIsLocked\] = useState<boolean>\(\(\) => {[\s\S]*?}\);/, 'const [isLocked, setIsLocked] = useState<boolean>(true);');
fs.writeFileSync('src/App.tsx', appCode);

// 2. Fix DrawingCatalog dept.label
let catalogCode = fs.readFileSync('src/components/DrawingCatalog.tsx', 'utf8');
catalogCode = catalogCode.replace(/{dept\.label}/g, '{dept.id}');
fs.writeFileSync('src/components/DrawingCatalog.tsx', catalogCode);

console.log("Fixes applied!");
