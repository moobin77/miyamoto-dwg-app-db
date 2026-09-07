const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace everything inside the first `return (` for the main app UI
const newLayoutStart = `
  return (
    <div className="grid grid-rows-[56px_1fr_28px] h-screen w-screen overflow-hidden bg-[#0f1115] text-[#e2e8f0] font-sans">
      <header className="bg-[#1a1d23] border-b-2 border-[#e2e8f0] px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button 
            className="btn btn-outline" 
            style={{ padding: '4px 8px' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="font-['Syne'] text-xl tracking-tighter uppercase font-bold">Cloud Drawing Hub</h1>
          <div className="flex gap-1 hidden sm:flex">
            <span className="meta-label">{departments.length} Depts</span>
            <span className="meta-label">Tablet Optimized</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[0.7rem] font-bold">{currentUser.displayName}</p>
            <button onClick={handleSignOut} className="text-[0.6rem] text-[#3b82f6] hover:underline">
              {currentUser.role} • Sign Out
            </button>
          </div>
          
          <button 
            className="btn btn-primary bg-red-500 hover:bg-red-600" 
            onClick={handleLockScreen}
          >
            Lock Screen
          </button>
          
          {isAdmin && (
            <button 
              className="btn btn-outline hidden sm:flex"
              onClick={() => setIsUserManagementOpen(true)}
            >
              Whitelist
            </button>
          )}

          <div className="meta-label bg-black border border-[#3b82f6] hidden lg:flex items-center gap-2">
            Firebase: {DATABASE_NAME} <span className="status-dot"></span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-[320px_1fr] overflow-hidden relative">
        {/* Drawing Catalog Sidebar */}
`;

code = code.replace(/return \(\s*<div className="flex flex-col h-screen w-screen[^>]*>[\s\S]*?{\/\* Drawing Catalog Sidebar \*\//m, newLayoutStart);

// Handle cases where sidebar might be toggled (grid-cols-[0px_1fr] if closed).
code = code.replace(/<main className="grid grid-cols-\[320px_1fr\] overflow-hidden relative">/g, 
  `<main className={\`grid \${sidebarOpen ? 'grid-cols-[320px_1fr]' : 'grid-cols-[0px_1fr]'} overflow-hidden relative transition-all duration-300\`}>`);


// Footer replacement
const newFooter = `
      </main>

      <footer className="bg-[#3b82f6] text-white flex items-center justify-between px-6 font-['JetBrains_Mono'] text-[0.6rem] uppercase tracking-wider z-50">
        <div className="flex gap-8">
          <span className="hidden sm:inline">Hierarchy: Department &gt; Series &gt; Rev</span>
          {activeDrawing && effectiveActiveVersion && (
            <span>ECO: {effectiveActiveVersion.ecoNumber || '-'}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Cloud Connected: {DATABASE_NAME}</span>
          <span className="status-dot bg-white"></span>
        </div>
        <span className="hidden md:inline">Last Update: {new Date().toLocaleString()}</span>
      </footer>
`;

code = code.replace(/<\/main>\s*<footer[^>]*>[\s\S]*?<\/footer>/m, newFooter);

fs.writeFileSync('src/App.tsx', code);
