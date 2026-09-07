const fs = require('fs');
let code = fs.readFileSync('src/services/storage.ts', 'utf8');

code = code.replace(
  /return JSON.parse\(raw\);/,
  `const parsed = JSON.parse(raw);
    if (!parsed.find((d: any) => d.id === 'BOM')) {
      saveLocalDepartments(INITIAL_DEPARTMENTS);
      return INITIAL_DEPARTMENTS;
    }
    return parsed;`
);

fs.writeFileSync('src/services/storage.ts', code);
