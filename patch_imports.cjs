const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');

code = code.replace(
  "import { fetchAuthorizedUsers, addAuthorizedUser, deleteAuthorizedUser, updateAuthorizedUser, SUPER_ADMIN_EMAIL } from '../services/securityService';",
  "import { fetchAuthorizedUsers, addAuthorizedUser, deleteAuthorizedUser, updateAuthorizedUser, SUPER_ADMIN_EMAIL, fetchSecurityConfig, saveSecurityConfig } from '../services/securityService';"
);

fs.writeFileSync('src/components/UserManagementModal.tsx', code);
console.log("Patched imports");
