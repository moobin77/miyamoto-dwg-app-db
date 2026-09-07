const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const returnStart = code.indexOf('  return (\n    <div className="flex flex-col h-screen w-screen');
const modalStart = code.indexOf('      {/* MODALS */}');

if (returnStart === -1 || modalStart === -1) {
  console.log("Could not find boundaries");
  process.exit(1);
}

const newLayout = `  return (
    <>
      <div className="utility-bar">
        <div className="sys-id">SYSTEM: CLOUD_DRAWING_HUB_V3.0.4</div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div className="meta-item"><span style={{ color: '#10b981' }}>●</span> FB: {DATABASE_NAME.toUpperCase()}</div>
          <div className="meta-item">USER: {currentUser.role === 'ADMIN' ? 'SUPER ADMIN' : currentUser.displayName.toUpperCase()}</div>
        </div>
      </div>

      <header className="portal-header">
        <div className="brand"><h1>Drawing Portal</h1></div>
        <div className="header-meta">
          <div className="meta-item"><span className="meta-label">ID:</span> {activeDrawing?.code || 'NO DRAWING SELECTED'}</div>
          <div className="meta-item"><span className="meta-label">Rev:</span> <span className="rev-badge">{effectiveActiveVersion?.version || '-'}</span></div>
          <div className="meta-item"><span className="meta-label">Status:</span> {effectiveActiveVersion?.isApprovedForProduction ? 'APPROVED PRODUCTION' : 'PENDING REVIEW'}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button className="btn btn-fill" style={{ padding: '6px 12px', fontSize: '10px' }} onClick={handleLockScreen}>Lock Session</button>
          {isAdmin && (
            <button className="btn" style={{ padding: '6px 12px', fontSize: '10px' }} onClick={() => setIsAccessControlOpen(true)}>Whitelist Control</button>
          )}
        </div>
      </header>

      {/* REVISION ALERT BANNER */}
      {activeDrawing && activeVersion && (
        <RevisionAlertBanner
          drawing={activeDrawing}
          activeVersion={activeVersion}
          onSwitchToLatest={handleSwitchToLatest}
        />
      )}

      <div className="workspace">
        {/* Drawing Catalog Sidebar */}
        {sidebarOpen && (
          <DrawingCatalog
            departments={departments}
            drawings={drawings}
            selectedDrawingId={selectedDrawingId}
            onSelectDrawing={(d) => {
              setSelectedDrawingId(d.id);
            }}
            selectedDepartmentId={selectedDepartmentId}
            onSelectDepartment={handleDepartmentChange}
            isAdmin={isAdmin}
            onOpenAddModel={handleOpenAddModel}
            onOpenAddLength={handleOpenAddLength}
            onDeleteModel={handleRequestDeleteModel}
            onDeleteLength={handleRequestDeleteLength}
            onOpenEditJob={handleOpenEditJob}
            onOpenEditModel={handleOpenEditModel}
            onOpenAddFile={handleOpenAddFile}
            onOpenAddFileGuide={() => handleOpenAddFile()}
            onOpenManageSeries={handleOpenManageSeries}
            onOpenAddSeries={handleOpenManageSeries}
            onOpenEditSeries={() => setIsManageSeriesOpen(true)}
            onDeleteSeries={handleDeleteSeries}
            operatorName={settings.operatorName}
            stationLine={settings.stationLine}
            machineId={settings.machineId}
          />
        )}

        {/* Drawing Viewport Stage */}
        {activeDrawing ? (
          <DrawingViewer
            drawing={activeDrawing}
            activeVersion={effectiveActiveVersion}
            onVersionChange={(ver) => setActiveVersion(ver)}
            onOpenAuditTrail={() => setIsAuditModalOpen(true)}
            onOpenDiffModal={() => setIsDiffModalOpen(true)}
            onOpenNewRevision={() => setIsNewRevModalOpen(true)}
            onOpenExport={() => setIsExportModalOpen(true)}
            onAcknowledge={handleAcknowledge}
            onUpdateInspection={handleUpdateInspection}
            isAcknowledgedByCurrentOp={isAcknowledgedByCurrentOp}
            theme={theme}
            onToggleTheme={(t) => {
              setTheme(t);
              const updated = { ...settings, theme: t };
              setSettings(updated);
              saveStationSettings(updated);
            }}
            isAdmin={isAdmin}
            onOpenEditJob={() => handleOpenEditJob(activeDrawing)}
            onOpenAddFile={() => handleOpenAddFile(activeDrawing)}
            onDeleteAttachedFile={handleDeleteAttachedFile}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-dim)' }}>
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            กำลังโหลดข้อมูลดรออิ้งจากคลาวด์...
          </div>
        )}
      </div>

      <div className="footer-metrics">
        <span>STORAGE: {drawings.length} DOCUMENT UNITS</span>
        <span>MODIFIED: {new Date().toLocaleString()}</span>
        <span>STATION ID: {settings.machineId}</span>
        <span>ENCRYPTION: AES-256 ACTIVE</span>
      </div>

`;

const newCode = code.substring(0, returnStart) + newLayout + code.substring(modalStart);
fs.writeFileSync('src/App.tsx', newCode);
console.log("Updated App.tsx successfully");
