const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');

// Change role dropdown
const roleTarget = `<select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    >
                      <option value="OPERATOR">Operator (ดูข้อมูลและบันทึกหน้าเครื่อง)</option>
                      <option value="ENGINEER">Engineer (จัดการแบบและพิจารณา ECO)</option>
                      <option value="ADMIN">Admin (จัดการระบบเต็มรูปแบบ)</option>
                    </select>`;

const roleReplacement = `<select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    >
                      <option value="ENGINEER">Engineer (จัดการแบบและพิจารณา ECO)</option>
                    </select>`;

code = code.replace(roleTarget, roleReplacement);

// Change newRole initial state
code = code.replace(
  "const [newRole, setNewRole] = useState<'ADMIN' | 'ENGINEER' | 'OPERATOR'>('OPERATOR');",
  "const [newRole, setNewRole] = useState<'ADMIN' | 'ENGINEER' | 'OPERATOR'>('ENGINEER');"
);

fs.writeFileSync('src/components/UserManagementModal.tsx', code);
console.log("Patched UserManagementModal");
