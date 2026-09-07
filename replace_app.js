const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = '  return (\n    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">';
const idxStart = content.indexOf(startMarker);

const endMarker = '        )}      </div>';
// we need to find the specific </div> that closes the workspace
// Instead, let's just use regex to replace everything from the first `return (` inside App to the start of the Modals.
