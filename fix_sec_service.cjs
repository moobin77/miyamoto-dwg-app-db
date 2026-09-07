const fs = require('fs');
let code = fs.readFileSync('src/services/securityService.ts', 'utf8');

code = code.replace(
  "    console.warn('Failed to persist authorized user to Firestore:', err);\n  }",
  "    console.warn('Failed to persist authorized user to Firestore:', err);\n    throw err;\n  }"
);

code = code.replace(
  "    console.warn('Failed to update authorized user in Firestore:', err);\n    }\n  }\n}",
  "    console.warn('Failed to update authorized user in Firestore:', err);\n      throw err;\n    }\n  }\n}"
);

fs.writeFileSync('src/services/securityService.ts', code);
console.log("Patched securityService.ts");
