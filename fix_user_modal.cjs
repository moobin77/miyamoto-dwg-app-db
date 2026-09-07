const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');

code = code.replace(
  /\(\(currentUser\?\.email === SUPER_ADMIN_EMAIL \|\| u\.isOwner === true\)/g,
  "(currentUser?.email === SUPER_ADMIN_EMAIL"
);

fs.writeFileSync('src/components/UserManagementModal.tsx', code);
console.log("Fix applied!");
