const fs = require('fs');
let code = fs.readFileSync('src/services/securityService.ts', 'utf8');

code = code.replace(
  "      if (!remoteUsers.some((u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())) {",
  "      if (!remoteUsers.some((u) => u.email && u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())) {"
);

fs.writeFileSync('src/services/securityService.ts', code);
console.log("Fixed fetchAuthorizedUsers u.email check");
