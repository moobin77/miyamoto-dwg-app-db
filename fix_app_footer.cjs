const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Find the footer-metrics and replace it.
code = code.replace(
  /<div className="footer-metrics">/,
  `<div className="h-8 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-500 font-mono shrink-0">`
);

fs.writeFileSync('src/App.tsx', code);
