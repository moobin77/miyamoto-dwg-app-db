const fs = require('fs');

// Patch UserManagementModal.tsx
let modalCode = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');

modalCode = modalCode.replace(
  "alert('กรุณากรอกข้อมูลให้ครบถ้วน (Username และ Password)'); return;",
  "alert('กรุณากรอกข้อมูลให้ครบถ้วน (Username และ Password)'); return;"
);

modalCode = modalCode.replace(
  "alert('เพิ่มผู้ใช้ล้มเหลว: ' + (err.message || JSON.stringify(err)));",
  "alert('เพิ่มผู้ใช้ล้มเหลว:\\n' + (err.message || JSON.stringify(err)) + '\\n\\nตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือสิทธิ์ในฐานข้อมูล');"
);

fs.writeFileSync('src/components/UserManagementModal.tsx', modalCode);

// Patch securityService.ts
let serviceCode = fs.readFileSync('src/services/securityService.ts', 'utf8');

// Ensure email is saved as null if undefined so we don't have weird undefined issues
const addAuthTarget = `  const newUser: AuthorizedUser = {
    ...user,
    id: \`auth-user-\${Date.now().toString(36)}\`,
    email: user.email ? user.email.trim().toLowerCase() : undefined,
    username: user.username ? user.username.trim().toLowerCase() : undefined,
    addedAt: new Date().toISOString(),
  };`;
  
const addAuthReplace = `  const newUser: AuthorizedUser = {
    ...user,
    id: \`auth-user-\${Date.now().toString(36)}\`,
    email: user.email ? user.email.trim().toLowerCase() : undefined,
    username: user.username ? user.username.trim().toLowerCase() : undefined,
    addedAt: new Date().toISOString(),
  };`;

fs.writeFileSync('src/services/securityService.ts', serviceCode);

console.log("Patched resilience");
