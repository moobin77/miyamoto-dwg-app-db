const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `          {isAdmin && (
            <button 
              className="btn btn-outline hidden sm:flex"
              onClick={() => setIsAccessControlOpen(true)}
            >
              Whitelist
            </button>
          )}`;

const replacement = `          {isAdmin && (
            <button 
              className="btn btn-outline hidden sm:flex"
              onClick={() => setIsAccessControlOpen(true)}
            >
              Whitelist
            </button>
          )}

          {isAdmin && (
            <FirebaseSyncBadge
              isSyncing={isSyncingFirebase}
              lastSyncedAt={lastFirebaseSync}
              onSync={handleSyncAllToFirebase}
              totalDepartments={departments.length}
              totalDrawings={drawings.length}
            />
          )}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx header");
