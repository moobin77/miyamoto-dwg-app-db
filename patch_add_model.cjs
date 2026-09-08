const fs = require('fs');
let code = fs.readFileSync('src/components/AddModelModal.tsx', 'utf8');

const target1 = `{/* Blueprint schematic type & Initial Length */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ลักษณะรูปทรง CAD Blueprint *
              </label>
              <select
                value={svgType}
                onChange={(e) => setSvgType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="shaft">เพลาทรงกระบอก (Shaft / Cylinder)</option>
                <option value="flange">หน้าแปลนดิสก์ (Coupling Flange)</option>
                <option value="manifold">บล็อกควบคุม (Manifold Block)</option>
                <option value="bracket">ฉากยึดโลหะแผ่น (Sheet Bracket)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ความยาวเริ่มต้นที่ผลิต (Initial L mm) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={initialLengthMm}
                  onChange={(e) => setInitialLengthMm(Number(e.target.value))}
                  min="0"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">mm</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              เครื่องจักรหลักที่ผลิต (Primary Machine)
            </label>
            <input
              type="text"
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              placeholder="เช่น CNC-01 (Mazak Quick Turn), MC-04"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>`;

code = code.replace(target1, "");

fs.writeFileSync('src/components/AddModelModal.tsx', code);
console.log("Patched AddModelModal.tsx");
