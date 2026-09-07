const fs = require('fs');
let code = fs.readFileSync('src/services/securityService.ts', 'utf8');

const target = `      // Ensure super admin is included
      if (!remoteUsers.some((u) => u.email && u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())) {
        remoteUsers.unshift(DEFAULT_WHITELIST[0]);
      }`;

const replacement = `      // Ensure super admin is included
      const hasSuperAdmin = remoteUsers.some((u) => u.id === 'user-superadmin-01' || (u.email && u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()));
      if (!hasSuperAdmin) {
        remoteUsers.unshift(DEFAULT_WHITELIST[0]);
      } else {
        // Just to be safe from duplicate ids from other bugs, deduplicate by id
        const idSet = new Set();
        const deduplicated = [];
        for (const u of remoteUsers) {
          if (!idSet.has(u.id)) {
            idSet.add(u.id);
            deduplicated.push(u);
          }
        }
        remoteUsers.length = 0;
        remoteUsers.push(...deduplicated);
      }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/services/securityService.ts', code);
console.log("Fixed duplicate super admin key");
