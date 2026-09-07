const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');

const target = `        <div className="p-6 overflow-y-auto flex-1">
          {isAddingUser ? (`;

const replacement = `        <div className="p-6 overflow-y-auto flex-1">
          {/* Kiosk Pin Section */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">รหัส PIN เข้าใช้งานหน้าเครื่อง (Operator KIOSK)</h3>
                <p className="text-xs text-slate-400">ใช้สำหรับล็อคอินเข้าสู่หน้าจอทำงานของพนักงาน</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditingKiosk ? (
                <>
                  <input
                    type="text"
                    value={newKioskPin}
                    onChange={(e) => setNewKioskPin(e.target.value)}
                    className="w-24 bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-sm font-mono tracking-widest text-amber-400 focus:outline-none text-center"
                    maxLength={6}
                  />
                  <button onClick={handleUpdateKioskPin} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditingKiosk(false)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-sm font-mono tracking-widest text-slate-300">
                    {kioskPin}
                  </div>
                  {(currentUser?.email === SUPER_ADMIN_EMAIL || currentUser?.username === 'admin') && (
                    <button onClick={() => setIsEditingKiosk(true)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-md transition" title="เปลี่ยน PIN">
                      <KeyRound className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {isAddingUser ? (`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/UserManagementModal.tsx', code);
console.log("Patched Kiosk UI");
