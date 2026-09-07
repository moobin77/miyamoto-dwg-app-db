const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">[\s\S]*?<\/div>\s*<\/div>\s*<header/m,
  `<div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">\n      <header`
);

fs.writeFileSync('src/App.tsx', code);
