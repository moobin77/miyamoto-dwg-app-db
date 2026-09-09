const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');

const target = `  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadSecurityConfig();
    }
  }, [isOpen]);`;

const replacement = `  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadSecurityConfig();
      // Reset form states
      setIsAddingUser(false);
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewRole('ENGINEER');
      setNewDept('ALL');
      setEditingUserId(null);
      setEditingPassword('');
      setIsEditingKiosk(false);
    }
  }, [isOpen]);`;

code = code.replace(target, replacement);

const targetCancel = `                  <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm">`;
const replacementCancel = `                  <button type="button" onClick={() => { setIsAddingUser(false); setNewUsername(''); setNewPassword(''); setNewName(''); }} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm">`;
code = code.replace(targetCancel, replacementCancel);

fs.writeFileSync('src/components/UserManagementModal.tsx', code);
console.log("Patched UserManagementModal.tsx");
