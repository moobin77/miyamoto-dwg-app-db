const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');

code = code.replace(
  "if (!newUsername.trim() || !newPassword) return;",
  "if (!newUsername.trim() || !newPassword) { alert('กรุณากรอกข้อมูลให้ครบถ้วน (Username และ Password)'); return; }"
);

fs.writeFileSync('src/components/UserManagementModal.tsx', code);
console.log("Patched early return");
