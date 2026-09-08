const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');

code = code.replace(
  "alert('เพิ่มผู้ใช้ล้มเหลว: ' + err.message);",
  "alert('เพิ่มผู้ใช้ล้มเหลว: ' + (err.message || JSON.stringify(err)));"
);

fs.writeFileSync('src/components/UserManagementModal.tsx', code);
console.log("Patched error message");
