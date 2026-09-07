const fs = require('fs');

// 1. Fix UserManagementModal.tsx
let modalCode = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');
modalCode = modalCode.replace(/currentUser\?\.id/g, 'currentUser?.uid');
modalCode = modalCode.replace(/currentUser\?\.email === SUPER_ADMIN_EMAIL/g, "(currentUser?.email === SUPER_ADMIN_EMAIL || currentUser?.username === 'admin')");
fs.writeFileSync('src/components/UserManagementModal.tsx', modalCode);

// 2. Fix DEFAULT_WHITELIST in securityService.ts
let serviceCode = fs.readFileSync('src/services/securityService.ts', 'utf8');
serviceCode = serviceCode.replace(
  /username: 'admin',/g,
  "username: 'admin',\n    email: SUPER_ADMIN_EMAIL,"
);
fs.writeFileSync('src/services/securityService.ts', serviceCode);

console.log("Fixes applied!");
