const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the return
code = code.replace(
  /return \(\s*<>\s*<div className="utility-bar">[\s\S]*?<\/div>/,
  `return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">`
);

fs.writeFileSync('src/App.tsx', code);
